import { Router, type IRouter } from "express";
import { db, revenueLogsTable, customersTable } from "@workspace/db";
import { desc, eq } from "drizzle-orm";
import { ListRevenueLogsQueryParams } from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/revenue", async (req, res) => {
  const params = ListRevenueLogsQueryParams.parse({
    limit: req.query.limit !== undefined ? Number(req.query.limit) : undefined,
  });
  const limit = params.limit ?? 50;

  const rows = await db
    .select({
      id: revenueLogsTable.id,
      customerId: revenueLogsTable.customerId,
      amountCents: revenueLogsTable.amountCents,
      type: revenueLogsTable.type,
      occurredAt: revenueLogsTable.occurredAt,
      customerName: customersTable.name,
    })
    .from(revenueLogsTable)
    .leftJoin(customersTable, eq(customersTable.id, revenueLogsTable.customerId))
    .orderBy(desc(revenueLogsTable.occurredAt))
    .limit(limit);

  res.json(
    rows.map((r) => ({
      id: r.id,
      customerId: r.customerId,
      customerName: r.customerName ?? "Unknown",
      amount: r.amountCents / 100,
      type: r.type as "subscription" | "one_time" | "refund",
      occurredAt: r.occurredAt.toISOString(),
    })),
  );
});

export default router;
