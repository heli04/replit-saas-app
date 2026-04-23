import { pgTable, serial, text, timestamp, integer } from "drizzle-orm/pg-core";

export const customersTable = pgTable("customers", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  status: text("status").notNull().default("active"),
  plan: text("plan").notNull().default("starter"),
  mrrCents: integer("mrr_cents").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type CustomerRow = typeof customersTable.$inferSelect;
export type InsertCustomer = typeof customersTable.$inferInsert;
