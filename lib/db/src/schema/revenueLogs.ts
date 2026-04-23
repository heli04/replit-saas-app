import { pgTable, serial, integer, text, timestamp } from "drizzle-orm/pg-core";
import { customersTable } from "./customers";

export const revenueLogsTable = pgTable("revenue_logs", {
  id: serial("id").primaryKey(),
  customerId: integer("customer_id")
    .notNull()
    .references(() => customersTable.id, { onDelete: "cascade" }),
  amountCents: integer("amount_cents").notNull(),
  type: text("type").notNull().default("subscription"),
  occurredAt: timestamp("occurred_at", { withTimezone: true }).notNull().defaultNow(),
});

export type RevenueLogRow = typeof revenueLogsTable.$inferSelect;
export type InsertRevenueLog = typeof revenueLogsTable.$inferInsert;
