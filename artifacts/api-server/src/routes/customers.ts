import { Router, type IRouter } from "express";
import { db, customersTable, revenueLogsTable } from "@workspace/db";
import { and, desc, eq, ilike, or, sql } from "drizzle-orm";
import {
  ListCustomersQueryParams,
  CreateCustomerBody,
  GetCustomerParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

function toApiCustomer(row: typeof customersTable.$inferSelect) {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    status: row.status as "active" | "inactive",
    plan: row.plan,
    mrr: row.mrrCents / 100,
    createdAt: row.createdAt.toISOString(),
  };
}

router.get("/customers", async (req, res) => {
  const params = ListCustomersQueryParams.parse({
    search: req.query.search,
    status: req.query.status,
  });

  const conditions = [];
  if (params.search && params.search.trim().length > 0) {
    const q = `%${params.search.trim()}%`;
    conditions.push(or(ilike(customersTable.name, q), ilike(customersTable.email, q))!);
  }
  if (params.status && params.status !== "all") {
    conditions.push(eq(customersTable.status, params.status));
  }

  const rows = await db
    .select()
    .from(customersTable)
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(desc(customersTable.createdAt))
    .limit(500);

  res.json(rows.map(toApiCustomer));
});

router.post("/customers", async (req, res) => {
  const body = CreateCustomerBody.parse(req.body);
  const [row] = await db
    .insert(customersTable)
    .values({
      name: body.name,
      email: body.email,
      status: body.status,
      plan: body.plan,
      mrrCents: Math.round(body.mrr * 100),
    })
    .returning();
  res.status(201).json(toApiCustomer(row));
});

router.get("/customers/:id", async (req, res) => {
  const { id } = GetCustomerParams.parse({ id: Number(req.params.id) });
  const [customer] = await db
    .select()
    .from(customersTable)
    .where(eq(customersTable.id, id));

  if (!customer) {
    res.status(404).json({ message: "Customer not found" });
    return;
  }

  const recentLogs = await db
    .select()
    .from(revenueLogsTable)
    .where(eq(revenueLogsTable.customerId, id))
    .orderBy(desc(revenueLogsTable.occurredAt))
    .limit(10);

  const [{ total }] = await db
    .select({ total: sql<number>`COALESCE(SUM(${revenueLogsTable.amountCents}), 0)::int` })
    .from(revenueLogsTable)
    .where(eq(revenueLogsTable.customerId, id));

  res.json({
    customer: toApiCustomer(customer),
    lifetimeValue: Number(total) / 100,
    recentRevenue: recentLogs.map((l) => ({
      id: l.id,
      customerId: l.customerId,
      customerName: customer.name,
      amount: l.amountCents / 100,
      type: l.type as "subscription" | "one_time" | "refund",
      occurredAt: l.occurredAt.toISOString(),
    })),
  });
});

export default router;
