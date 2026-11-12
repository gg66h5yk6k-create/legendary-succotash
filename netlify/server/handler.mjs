const languages = new Set(['de', 'en', 'ar', 'ru', 'fr', 'tr', 'hi']);
const fields = new Set([...Array.from({ length: 21 }, (_, i) => String(i)).filter(i => i !== '4'), 'day', 'month', 'year']);
const json = (body, status = 200) => Response.json(body, { status, headers: { 'Cache-Control': 'no-store', 'Vary': 'Cookie, Authorization', 'X-Content-Type-Options': 'nosniff' } });

export function validateDocument(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) return null;
  if (!languages.has(input.language) || !Number.isInteger(input.step) || input.step < 0 || input.step > 4) return null;
  if (!input.values || typeof input.values !== 'object' || Array.isArray(input.values)) return null;
  const values = {};
  for (const [key, value] of Object.entries(input.values)) {
    if (!fields.has(key) || typeof value !== 'string' || value.length > 10000) return null;
    values[key] = value;
  }
  for (const [key, min, max] of [['day', 1, 31], ['month', 1, 12], ['year', 1920, new Date().getFullYear()]]) {
    if (values[key] && (!/^\d+$/.test(values[key]) || +values[key] < min || +values[key] > max)) return null;
  }
  if (values.day && values.month && values.year && new Date(+values.year, +values.month - 1, +values.day).getMonth() !== +values.month - 1) return null;
  return { values, language: input.language, step: input.step };
}

export function createHandler({ authenticate, store }) {
  return async request => {
    const url = new URL(request.url);
    if (url.pathname !== '/api/resume') return json({ error: 'not_found' }, 404);
    if (!['GET', 'PUT'].includes(request.method)) return json({ error: 'method_not_allowed' }, 405);
    try {
      // Cookie-authenticated writes must originate from the same site.
      if (request.method === 'PUT' && (request.headers.get('origin') !== url.origin || !request.headers.get('content-type')?.startsWith('application/json'))) return json({ error: 'forbidden' }, 403);
      const user = await authenticate(request);
      if (!user?.id || request.headers.get('x-account-id') !== user.id) return json({ error: 'unauthorized' }, 401);
      if (request.method === 'GET') {
        const row = await store.load(user.id);
        return json(row || { document: null, version: 0 });
      }
      const text = await request.text();
      if (text.length > 150000) return json({ error: 'too_large' }, 413);
      let body;
      try { body = JSON.parse(text); } catch { return json({ error: 'invalid_document' }, 400); }
      const document = validateDocument(body.document);
      if (!document || !Number.isInteger(body.version) || body.version < 0) return json({ error: 'invalid_document' }, 400);
      const saved = await store.save(user.id, document, body.version);
      if (!saved) return json({ error: 'conflict' }, 409);
      return json(saved);
    } catch {
      // Never expose identity responses, credentials, document contents or database errors.
      return json({ error: 'service_unavailable' }, 503);
    }
  };
}
