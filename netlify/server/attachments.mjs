import { randomUUID } from 'node:crypto';
import { PDFDocument } from 'pdf-lib';
const MAX_SIZE = 10 * 1024 * 1024;
const json = (body, status = 200) => Response.json(body, { status, headers: { 'Cache-Control': 'no-store', Vary: 'Cookie, Authorization' } });
export function createAttachmentHandler({ authenticate, records, files }) {
  return async request => {
    const url = new URL(request.url);
    if (!/^\/api\/attachments(?:\/[a-f0-9-]{36})?$/.test(url.pathname)) return json({ error: 'not_found' }, 404);
    const id = url.pathname.split('/')[3];
    try {
      if (!['GET', 'POST', 'DELETE'].includes(request.method)) return json({ error: 'method_not_allowed' }, 405);
      if (request.method !== 'GET' && request.headers.get('origin') !== url.origin) return json({ error: 'forbidden' }, 403);
      const user = await authenticate(request);
      if (!user?.id || request.headers.get('x-account-id') !== user.id) return json({ error: 'unauthorized' }, 401);
      if (request.method === 'GET' && !id) return json(await records.list(user.id));
      if (id) {
        const row = await records.get(user.id, id);
        if (!row) return json({ error: 'not_found' }, 404);
        const key = `${user.id}/${row.id}`;
        if (request.method === 'DELETE') {
          await files.delete(key); await records.remove(user.id, id);
          return json({ deleted: true });
        }
        if (request.method !== 'GET') return json({ error: 'method_not_allowed' }, 405);
        const data = await files.get(key, { type: 'arrayBuffer' });
        if (!data) return json({ error: 'not_found' }, 404);
        return new Response(data, { headers: { 'Content-Type': row.contentType, 'Content-Disposition': `attachment; filename*=UTF-8''${encodeURIComponent(row.name)}`, 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff', 'Content-Security-Policy': "default-src 'none'; sandbox" } });
      }
      if (request.method !== 'POST') return json({ error: 'not_found' }, 404);
      if (+(request.headers.get('content-length') || 0) > MAX_SIZE + 65536) return json({ error: 'too_large' }, 413);
      const chunks = []; let length = 0;
      if (!request.body) return json({ error: 'invalid_file' }, 400);
      const reader = request.body.getReader();
      while (true) {
        const { done, value } = await reader.read(); if (done) break;
        length += value.byteLength;
        if (length > MAX_SIZE + 65536) { await reader.cancel(); return json({ error: 'too_large' }, 413); }
        chunks.push(value);
      }
      const form = await new Response(new Blob(chunks), { headers: { 'Content-Type': request.headers.get('content-type') || '' } }).formData();
      const file = form.get('file');
      if (!file || typeof file.arrayBuffer !== 'function' || !file.size || file.size > MAX_SIZE) return json({ error: 'invalid_file' }, 400);
      const contentType = file.type;
      if (!['application/pdf', 'image/png', 'image/jpeg'].includes(contentType)) return json({ error: 'invalid_file' }, 400);
      const data = await file.arrayBuffer();
      const bytes = new Uint8Array(data);
      if (contentType === 'application/pdf') {
        if (new TextDecoder().decode(bytes.slice(0, 5)) !== '%PDF-') return json({ error: 'invalid_file' }, 400);
        try { const pdf = await PDFDocument.load(data); if (!pdf.getPageCount()) return json({ error: 'invalid_file' }, 400); } catch { return json({ error: 'invalid_file' }, 400); }
      } else if (contentType === 'image/png' ? ![137,80,78,71,13,10,26,10].every((b,i) => bytes[i] === b) : !(bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255)) return json({ error: 'invalid_file' }, 400);
      const row = { id: randomUUID(), userId: user.id, name: file.name.replace(/[\u0000-\u001f\u007f/\\]/g, '_').slice(0, 180) || 'Dokument', contentType, size: file.size };
      const key = `${user.id}/${row.id}`;
      await files.set(key, data);
      try { await records.add(row); } catch (error) { await files.delete(key); throw error; }
      return json({ id: row.id, name: row.name, contentType, size: row.size }, 201);
    } catch { return json({ error: 'service_unavailable' }, 503); }
  };
}
