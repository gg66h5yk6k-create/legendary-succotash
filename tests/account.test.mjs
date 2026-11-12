import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { parseHTML } from 'linkedom';

const source = readFileSync(new URL('../account.js', import.meta.url), 'utf8').replace(/^import[^\n]+\n/, '').replaceAll('export function ', 'function ');
const settle = async () => { for (let i = 0; i < 12; i++) await new Promise(resolve => setImmediate(resolve)); };
function setup({ current = { id: 'alice', email: 'alice@example.test' }, initial = null } = {}) {
  const { document, window } = parseHTML(readFileSync(new URL('../index.html', import.meta.url), 'utf8'));
  let stored = initial, failure = false, session = current, authListener, writes = 0;
  let draft = { values: {}, language: 'de', step: 0 };
  const translations = Object.fromEntries(['de','en','fr','tr','ru','ar','hi'].map(k => [k, {}]));
  const context = vm.createContext({ document, window, setTimeout, clearTimeout,
    getUser: async () => session, getSettings: async () => ({ disableSignup: false }), handleAuthCallback: async () => null,
    onAuthChange: cb => { authListener = cb; },
    login: async email => { session = { id: email.startsWith('bob') ? 'bob' : 'alice', email }; return session; },
    logout: async () => { session = null; authListener('logout'); },
    signup: async () => ({}), requestPasswordRecovery: async () => {}, updateUser: async () => {}, acceptInvite: async () => session,
    fetch: async (url, options) => {
      if (failure) return { ok: false, status: 503 };
      if (options.method === 'GET') return { ok: true, json: async () => stored || { document: null, version: 0 } };
      writes++; const body = JSON.parse(options.body);
      stored = { document: body.document, version: body.version + 1 };
      return { ok: true, json: async () => ({ version: stored.version }) };
    },
  });
  vm.runInContext(source, context);
  context.installAccountTranslations(translations);
  const controller = context.initAccount({ $: s => document.querySelector(s), t: () => translations.de,
    getDocument: () => structuredClone(draft), applyDocument: data => { draft = data || { values: {}, language: 'de', step: 0 }; },
  });
  return { document, controller, get draft() { return draft; }, get stored() { return stored; }, get writes() { return writes; }, fail: value => { failure = value; },
    click: selector => document.querySelector(selector).dispatchEvent(new window.Event('click')),
    event: (event, user) => authListener(event, user),
    submit: () => document.querySelector('#auth-form').dispatchEvent(new window.Event('submit', { cancelable: true })),
    translations,
  };
}
test('initial login restores persisted values and all seven languages have account labels', async () => {
  const app = setup({ initial: { document: { values: { 0: 'Amina' }, language: 'ar', step: 2 }, version: 4 } });
  await settle();
  assert.equal(app.draft.values[0], 'Amina');
  assert.equal(app.document.querySelector('main').hidden, false);
  for (const d of Object.values(app.translations)) assert.ok(d.login && d.saved && d.conflict && d.privacy);
});
test('changes save and a failure keeps edits pending until retry succeeds', async () => {
  const app = setup(); await settle();
  app.draft.values[0] = 'Amina'; app.controller.changed(); app.click('#retry-save'); await settle();
  assert.equal(app.stored.document.values[0], 'Amina');
  assert.equal(app.document.querySelector('#save-state').textContent, app.translations.de.saved);
  app.fail(true); app.draft.values[0] = 'Samira'; app.controller.changed(); app.click('#retry-save'); await settle();
  assert.equal(app.stored.document.values[0], 'Amina');
  assert.equal(app.document.querySelector('#save-state').textContent, app.translations.de.saveError);
  app.fail(false); app.click('#retry-save'); await settle();
  assert.equal(app.stored.document.values[0], 'Samira');
});
test('logout clears personal data and hides editor; guests cannot save', async () => {
  const app = setup({ initial: { document: { values: { 0: 'Amina' }, language: 'de', step: 0 }, version: 1 } }); await settle();
  app.event('logout'); await settle();
  assert.deepEqual(Object.keys(app.draft.values), []);
  assert.equal(app.document.querySelector('main').hidden, true);
  app.controller.changed(); app.click('#retry-save'); await settle(); assert.equal(app.writes, 0);
});
test('failed initial load keeps the editor hidden and does not overwrite saved data', async () => {
  const app = setup(); app.fail(true); await settle();
  assert.equal(app.document.querySelector('main').hidden, true);
  assert.equal(app.document.querySelector('#save-state').textContent, app.translations.de.loadError);
  assert.equal(app.writes, 0);
  app.fail(false); app.click('#retry-load'); await settle();
  assert.equal(app.document.querySelector('main').hidden, false);
});

test('registration confirmation and password reset show translated feedback', async () => {
  const app = setup({ current: null }); await settle();
  app.click('#signup-tab');
  app.document.querySelector('#auth-email').value = 'new@example.test';
  app.document.querySelector('#auth-password').value = 'example-password';
  app.submit(); await settle();
  assert.equal(app.document.querySelector('#auth-message').textContent, app.translations.de.confirmEmail);
  assert.equal(app.document.querySelector('main').hidden, true);
  app.click('#forgot-password'); app.submit(); await settle();
  assert.equal(app.document.querySelector('#auth-message').textContent, app.translations.de.resetSent);
});
