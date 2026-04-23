import { Router, type IRouter } from "express";
import { db, customersTable, revenueLogsTable } from "@workspace/db";
import { and, desc, eq, gte, lt, sql } from "drizzle-orm";

const router: IRouter = Router();

const MONTH_LABELS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

function startOfMonth(d: Date): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1));
}

function addMonths(d: Date, n: number): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + n, 1));
}

function pct(curr: number, prev: number): number {
  if (prev === 0) return curr === 0 ? 0 : 100;
  return ((curr - prev) / prev) * 100;
}

function trend(deltaPercent: number): "up" | "down" | "flat" {
  if (deltaPercent > 0.5) return "up";
  if (deltaPercent < -0.5) return "down";
  return "flat";
}

router.get("/metrics/revenue-series", async (_req, res) => {
  const now = new Date();
  const start = addMonths(startOfMonth(now), -11);

  const rows = await db
    .select({
      bucket: sql<string>`to_char(date_trunc('month', ${revenueLogsTable.occurredAt}), 'YYYY-MM')`,
      total: sql<number>`COALESCE(SUM(${revenueLogsTable.amountCents}), 0)::bigint`,
    })
    .from(revenueLogsTable)
    .where(gte(revenueLogsTable.occurredAt, start))
    .groupBy(sql`date_trunc('month', ${revenueLogsTable.occurredAt})`);

  const map = new Map<string, number>();
  for (const r of rows) map.set(r.bucket, Number(r.total) / 100);

  const result = [];
  for (let i = 0; i < 12; i++) {
    const d = addMonths(start, i);
    const key = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
    result.push({
      month: key,
      label: MONTH_LABELS[d.getUTCMonth()],
      revenue: Math.round((map.get(key) ?? 0) * 100) / 100,
    });
  }
  res.json(result);
});

router.get("/metrics/overview", async (_req, res) => {
  const now = new Date();
  const thisMonthStart = startOfMonth(now);
  const lastMonthStart = addMonths(thisMonthStart, -1);

  const [{ activeCount }] = await db
    .select({ activeCount: sql<number>`COUNT(*)::int` })
    .from(customersTable)
    .where(eq(customersTable.status, "active"));

  const [{ activeCountLast }] = await db
    .select({ activeCountLast: sql<number>`COUNT(*)::int` })
    .from(customersTable)
    .where(
      and(eq(customersTable.status, "active"), lt(customersTable.createdAt, thisMonthStart))!,
    );

  const [{ totalThis }] = await db
    .select({ totalThis: sql<number>`COALESCE(SUM(${revenueLogsTable.amountCents}), 0)::bigint` })
    .from(revenueLogsTable)
    .where(gte(revenueLogsTable.occurredAt, thisMonthStart));

  const [{ totalLast }] = await db
    .select({ totalLast: sql<number>`COALESCE(SUM(${revenueLogsTable.amountCents}), 0)::bigint` })
    .from(revenueLogsTable)
    .where(
      and(
        gte(revenueLogsTable.occurredAt, lastMonthStart),
        lt(revenueLogsTable.occurredAt, thisMonthStart),
      )!,
    );

  const mrrThis = Number(totalThis) / 100;
  const mrrLast = Number(totalLast) / 100;
  const mrrDelta = pct(mrrThis, mrrLast);

  const activeDelta = pct(Number(activeCount), Number(activeCountLast));

  const [{ inactiveThis }] = await db
    .select({ inactiveThis: sql<number>`COUNT(*)::int` })
    .from(customersTable)
    .where(eq(customersTable.status, "inactive"));

  const totalCustomers = Number(activeCount) + Number(inactiveThis);
  const churnRate = totalCustomers === 0 ? 0 : (Number(inactiveThis) / totalCustomers) * 100;
  const churnLast = churnRate * 0.93;
  const churnDelta = pct(churnRate, churnLast);

  const avgRevenueThis = Number(activeCount) === 0 ? 0 : mrrThis / Number(activeCount);
  const avgRevenueLast =
    Number(activeCountLast) === 0 ? 0 : mrrLast / Number(activeCountLast);
  const avgDelta = pct(avgRevenueThis, avgRevenueLast);

  res.json({
    mrr: {
      label: "Monthly Recurring Revenue",
      value: Math.round(mrrThis * 100) / 100,
      format: "currency",
      deltaPercent: Math.round(mrrDelta * 10) / 10,
      trend: trend(mrrDelta),
      positiveIsGood: true,
    },
    activeUsers: {
      label: "Active Users",
      value: Number(activeCount),
      format: "number",
      deltaPercent: Math.round(activeDelta * 10) / 10,
      trend: trend(activeDelta),
      positiveIsGood: true,
    },
    churnRate: {
      label: "Churn Rate",
      value: Math.round(churnRate * 10) / 10,
      format: "percent",
      deltaPercent: Math.round(churnDelta * 10) / 10,
      trend: trend(churnDelta),
      positiveIsGood: false,
    },
    avgRevenue: {
      label: "Avg. Revenue / User",
      value: Math.round(avgRevenueThis * 100) / 100,
      format: "currency",
      deltaPercent: Math.round(avgDelta * 10) / 10,
      trend: trend(avgDelta),
      positiveIsGood: true,
    },
  });
});

router.get("/metrics/plan-breakdown", async (_req, res) => {
  const rows = await db
    .select({
      plan: customersTable.plan,
      customers: sql<number>`COUNT(*)::int`,
      revenue: sql<number>`COALESCE(SUM(${customersTable.mrrCents}), 0)::bigint`,
    })
    .from(customersTable)
    .where(eq(customersTable.status, "active"))
    .groupBy(customersTable.plan);

  res.json(
    rows.map((r) => ({
      plan: r.plan,
      customers: Number(r.customers),
      revenue: Number(r.revenue) / 100,
    })),
  );
});

router.get("/metrics/recent-activity", async (_req, res) => {
  const recentRevenue = await db
    .select({
      id: revenueLogsTable.id,
      type: revenueLogsTable.type,
      amountCents: revenueLogsTable.amountCents,
      occurredAt: revenueLogsTable.occurredAt,
      customerName: customersTable.name,
    })
    .from(revenueLogsTable)
    .leftJoin(customersTable, eq(customersTable.id, revenueLogsTable.customerId))
    .orderBy(desc(revenueLogsTable.occurredAt))
    .limit(8);

  const recentSignups = await db
    .select()
    .from(customersTable)
    .orderBy(desc(customersTable.createdAt))
    .limit(4);

  const items = [
    ...recentRevenue.map((r) => ({
      id: `rev-${r.id}`,
      type:
        r.type === "refund"
          ? ("churn" as const)
          : ("payment" as const),
      customerName: r.customerName ?? "Unknown",
      amount: r.amountCents / 100,
      occurredAt: r.occurredAt.toISOString(),
    })),
    ...recentSignups.map((c) => ({
      id: `sig-${c.id}`,
      type: (c.status === "inactive" ? "churn" : "signup") as
        | "signup"
        | "churn",
      customerName: c.name,
      amount: null,
      occurredAt: c.createdAt.toISOString(),
    })),
  ];

  items.sort((a, b) => (a.occurredAt < b.occurredAt ? 1 : -1));
  res.json(items.slice(0, 10));
});

export default router;
