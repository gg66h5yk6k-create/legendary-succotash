import test from 'node:test';
import assert from 'node:assert/strict';
import { createHandler, validateDocument } from '../netlify/server/handler.mjs';

const document = { values: { 0: 'Amina', 1: 'Yilmaz', day: '29', month: '2', year: '2024' }, language: 'de', step: 1 };
function setup() {
  const rows = new Map(); // Test double only; production uses Netlify Database.
  const handler = createHandler({
    authenticate: async request => ({ alice: { id: 'alice' }, bob: { id: 'bob' } })[request.headers.get('authorization')] || null,
    store: {
      load: async id => rows.get(id),
      save: async (id, document, version) => {
        if ((rows.get(id)?.version || 0) !== version) return null;
        const row = { document, version: version + 1 }; rows.set(id, row); return { version: row.version };
      },
    },
  });
  return (user, method = 'GET', body, origin = 'https://example.test') => handler(new Request('https://example.test/api/resume', { method, headers: { authorization: user, 'x-account-id': user, origin, 'content-type': 'application/json' }, body: body ? JSON.stringify(body) : undefined }));
}
test('anonymous users cannot read or write CVs', async () => {
  const call = setup();
  assert.equal((await call('unknown')).status, 401);
  assert.equal((await call('unknown', 'PUT', { document, version: 0 })).status, 401);
});
test('saved changes survive subsequent reads and stay isolated by authenticated user', async () => {
  const call = setup();
  assert.equal((await call('alice', 'PUT', { document, version: 0, userId: 'bob' })).status, 200);
  assert.deepEqual((await (await call('alice')).json()).document, document);
  assert.deepEqual(await (await call('bob')).json(), { document: null, version: 0 });
  await call('bob', 'PUT', { document: { ...document, values: { 0: 'Samira' } }, version: 0 });
  assert.equal((await (await call('alice')).json()).document.values[0], 'Amina');
});
test('concurrent edits cannot silently overwrite a newer saved version', async () => {
  const call = setup();
  await call('alice', 'PUT', { document, version: 0 });
  assert.equal((await call('alice', 'PUT', { document, version: 0 })).status, 409);
  assert.equal((await call('alice', 'PUT', { document: { ...document, step: 3 }, version: 1 })).status, 200);
  assert.equal((await call('alice', 'PUT', { document, version: 1 })).status, 409);
  assert.equal((await (await call('alice')).json()).document.step, 3);
});
test('rejects cross-origin writes and invalid document data', async () => {
  const call = setup();
  assert.equal((await call('alice', 'PUT', { document, version: 0 }, 'https://other.test')).status, 403);
  for (const invalid of [{ ...document, language: 'invalid' }, { ...document, values: { ...document.values, year: '2023' } }, { ...document, values: { userId: 'bob' } }, { ...document, values: { 0: 'x'.repeat(10001) } }]) {
    assert.equal(validateDocument(invalid), null);
    assert.equal((await call('alice', 'PUT', { document: invalid, version: 0 })).status, 400);
  }
});
test('service failure returns a non-sensitive failure rather than success', async () => {
  const handler = createHandler({ authenticate: async () => { throw new Error('private details'); }, store: {} });
  const response = await handler(new Request('https://example.test/api/resume'));
  assert.equal(response.status, 503);
  assert.equal(await response.text(), '{"error":"service_unavailable"}');
});

test('requests from a previous account cannot write into a newly signed-in account', async () => {
  let saved = false;
  const handler = createHandler({ authenticate: async () => ({ id: 'bob' }), store: { save: async () => { saved = true; } } });
  const response = await handler(new Request('https://example.test/api/resume', { method: 'PUT', headers: { origin: 'https://example.test', 'content-type': 'application/json', 'x-account-id': 'alice' }, body: JSON.stringify({ document, version: 0 }) }));
  assert.equal(response.status, 401);
  assert.equal(saved, false);
});
