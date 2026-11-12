import { pgTable, text, jsonb, integer, timestamp } from 'drizzle-orm/pg-core';

export const resumes = pgTable('resumes', {
  userId: text('user_id').primaryKey(),
  document: jsonb('document').notNull(),
  version: integer('version').notNull().default(1),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});
