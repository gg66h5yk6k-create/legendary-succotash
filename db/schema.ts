import { pgTable, text, jsonb, integer, timestamp } from 'drizzle-orm/pg-core';

export const resumes = pgTable('resumes', {
  userId: text('user_id').primaryKey(),
  document: jsonb('document').notNull(),
  version: integer('version').notNull().default(1),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const attachments = pgTable('application_attachments', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull(),
  name: text('name').notNull(),
  contentType: text('content_type').notNull(),
  size: integer('size').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});
