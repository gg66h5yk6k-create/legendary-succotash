import { getStore } from '@netlify/blobs';
import { createHash } from 'node:crypto';
import { createAttachmentHandler } from './attachments.mjs';
import { eq, and, sql } from 'drizzle-orm';
import { db } from '../../db/index.ts';
import { resumes, attachments } from '../../db/schema.ts';
import { createHandler } from './handler.mjs';

async function authenticate(request) {
  const cookie = request.headers.get('cookie') || '';
  const match = cookie.match(/(?:^|;\s*)nf_jwt=([^;]+)/);
  const authorization = request.headers.get('authorization');
  const token = authorization?.startsWith('Bearer ') ? authorization.slice(7) : match ? decodeURIComponent(match[1]) : null;
  if (!token) return null;
  // Validate credentials against Identity, never trust decoded JWT claims or a client-supplied ID.
  const identity = new URL('/.netlify/identity/user', process.env.URL || 'https://cv26liz.netlify.app');
  const response = await fetch(identity, { headers: { Authorization: `Bearer ${token}` }, signal: AbortSignal.timeout(8000) });
  if (response.status === 401 || response.status === 403) return null;
  if (!response.ok) throw new Error('Identity unavailable');
  const user = await response.json();
  return typeof user.id === 'string' && user.id ? { id: user.id } : null;
}
const store = {
  async load(userId) {
    const [row] = await db.select({ document: resumes.document, version: resumes.version }).from(resumes).where(eq(resumes.userId, userId)).limit(1);
    return row;
  },
  async save(userId, document, version) {
    if (version === 0) {
      const [row] = await db.insert(resumes).values({ userId, document }).onConflictDoNothing().returning({ version: resumes.version });
      return row;
    }
    const [row] = await db.update(resumes).set({ document, version: sql`${resumes.version} + 1`, updatedAt: new Date() }).where(and(eq(resumes.userId, userId), eq(resumes.version, version))).returning({ version: resumes.version });
    return row;
  },
};
const resumeHandler = createHandler({ authenticate, store });
const records = {
  list: userId => db.select({ id: attachments.id, name: attachments.name, contentType: attachments.contentType, size: attachments.size }).from(attachments).where(eq(attachments.userId, userId)).orderBy(attachments.createdAt, attachments.id),
  get: async (userId, id) => (await db.select().from(attachments).where(and(eq(attachments.userId, userId), eq(attachments.id, id))).limit(1))[0],
  add: row => db.insert(attachments).values(row),
  remove: (userId, id) => db.delete(attachments).where(and(eq(attachments.userId, userId), eq(attachments.id, id))),
};
const namespace = process.env.CONTEXT === 'production' ? 'application-files' : `application-files-${createHash('sha256').update(process.env.NETLIFY_DB_BRANCH || process.env.BRANCH || process.env.CONTEXT || 'dev').digest('hex').slice(0, 20)}`;
// Immediate downloads after upload require strong consistency.
const attachmentHandler = createAttachmentHandler({ authenticate, records, files: {
  get: (...args) => getStore({ name: namespace, consistency: 'strong' }).get(...args),
  set: (...args) => getStore({ name: namespace, consistency: 'strong' }).set(...args),
  delete: (...args) => getStore({ name: namespace, consistency: 'strong' }).delete(...args),
} });
export default request => new URL(request.url).pathname.startsWith('/api/attachments') ? attachmentHandler(request) : resumeHandler(request);
export const config = { path: '/api/*' };
