import { sql } from "drizzle-orm";
import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";

export const accountTypes = ["asset", "liability", "equity", "revenue", "expense"] as const;
export type AccountType = (typeof accountTypes)[number];

export const accounts = sqliteTable("accounts", {
  id: integer("id", { mode: "number" }).primaryKey({ autoIncrement: true }),
  code: text("code").notNull().unique(),
  name: text("name").notNull(),
  type: text("type", { enum: accountTypes }).notNull(),
  subtype: text("subtype"),
  description: text("description"),
  parentId: integer("parent_id"),
  isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
  openingBalance: real("opening_balance").notNull().default(0),
  currentBalance: real("current_balance").notNull().default(0),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
});

export const journalEntries = sqliteTable("journal_entries", {
  id: integer("id", { mode: "number" }).primaryKey({ autoIncrement: true }),
  entryNumber: text("entry_number").notNull().unique(),
  date: integer("date", { mode: "timestamp" }).notNull(),
  description: text("description").notNull(),
  reference: text("reference"),
  totalAmount: real("total_amount").notNull().default(0),
  isPosted: integer("is_posted", { mode: "boolean" }).notNull().default(false),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
});

export const journalEntryLines = sqliteTable("journal_entry_lines", {
  id: integer("id", { mode: "number" }).primaryKey({ autoIncrement: true }),
  journalEntryId: integer("journal_entry_id").notNull(),
  accountId: integer("account_id").notNull(),
  debit: real("debit").notNull().default(0),
  credit: real("credit").notNull().default(0),
  description: text("description"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
});

export type Account = typeof accounts.$inferSelect;
export type NewAccount = typeof accounts.$inferInsert;
