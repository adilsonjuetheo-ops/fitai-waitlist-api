import { pgTable, serial, text, timestamp, pgEnum } from 'drizzle-orm/pg-core';

export const profileEnum = pgEnum('profile_type', ['user', 'personal', 'gym']);

export const waitlist = pgTable('waitlist', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  profile: profileEnum('profile').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export type WaitlistRow = typeof waitlist.$inferSelect;
export type NewWaitlistRow = typeof waitlist.$inferInsert;
