import { db, customersTable, revenueLogsTable } from "@workspace/db";
import { sql } from "drizzle-orm";
import { logger } from "./lib/logger";

const PLANS = ["Starter", "Growth", "Pro", "Enterprise"];
const PLAN_PRICES_CENTS: Record<string, number> = {
  Starter: 2900,
  Growth: 9900,
  Pro: 24900,
  Enterprise: 79900,
};

const FIRST_NAMES = [
  "Ava", "Noah", "Mia", "Liam", "Zoe", "Ethan", "Harper", "Luca",
  "Nora", "Oscar", "Iris", "Theo", "Lila", "Felix", "Sasha", "Jules",
  "Maya", "Ronan", "Kira", "Owen", "Ines", "Milo", "Tess", "Hugo",
  "Ada", "Rex", "June", "Cy", "Wren", "Otis",
];
const LAST_NAMES = [
  "Patel", "Nguyen", "Garcia", "Kim", "Okafor", "Müller", "Rossi",
  "Silva", "Tanaka", "Cohen", "Andersen", "Bennett", "Cruz", "Diaz",
  "Evans", "Foster", "Hassan", "Ito", "Jensen", "Khan",
];

function rand<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

async function main() {
  const [{ count }] = await db
    .select({ count: sql<number>`COUNT(*)::int` })
    .from(customersTable);

  if (Number(count) > 0) {
    logger.info({ count }, "Seed: customers already present, skipping");
    return;
  }

  logger.info("Seed: generating customers and revenue logs");

  const usedEmails = new Set<string>();
  const customers: Array<{
    name: string;
    email: string;
    status: string;
    plan: string;
    mrrCents: number;
    createdAt: Date;
  }> = [];

  for (let i = 0; i < 48; i++) {
    const first = rand(FIRST_NAMES);
    const last = rand(LAST_NAMES);
    let email = `${first.toLowerCase()}.${last.toLowerCase()}${i}@example.com`;
    while (usedEmails.has(email)) email = `${first.toLowerCase()}${randInt(100, 999)}@example.com`;
    usedEmails.add(email);

    const plan = rand(PLANS);
    const mrrCents = PLAN_PRICES_CENTS[plan];
    const status = Math.random() < 0.18 ? "inactive" : "active";

    const monthsAgo = randInt(0, 14);
    const createdAt = new Date();
    createdAt.setUTCMonth(createdAt.getUTCMonth() - monthsAgo);
    createdAt.setUTCDate(randInt(1, 27));

    customers.push({
      name: `${first} ${last}`,
      email,
      status,
      plan,
      mrrCents,
      createdAt,
    });
  }

  const inserted = await db.insert(customersTable).values(customers).returning();
  logger.info({ n: inserted.length }, "Seed: customers inserted");

  const now = new Date();
  const logs: Array<{
    customerId: number;
    amountCents: number;
    type: string;
    occurredAt: Date;
  }> = [];

  for (const c of inserted) {
    const monthlyTrendBoost = 1 + Math.random() * 0.05;
    for (let m = 11; m >= 0; m--) {
      const monthDate = new Date(
        Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - m, randInt(1, 27)),
      );
      if (monthDate < c.createdAt) continue;
      if (c.status === "inactive" && m < randInt(0, 3)) continue;

      const growth = Math.pow(monthlyTrendBoost, 11 - m);
      logs.push({
        customerId: c.id,
        amountCents: Math.round(c.mrrCents * growth),
        type: "subscription",
        occurredAt: monthDate,
      });

      if (Math.random() < 0.08) {
        logs.push({
          customerId: c.id,
          amountCents: randInt(2000, 15000),
          type: "one_time",
          occurredAt: monthDate,
        });
      }
      if (Math.random() < 0.03) {
        logs.push({
          customerId: c.id,
          amountCents: -Math.round(c.mrrCents * 0.5),
          type: "refund",
          occurredAt: monthDate,
        });
      }
    }
  }

  // Insert in chunks
  const CHUNK = 200;
  for (let i = 0; i < logs.length; i += CHUNK) {
    await db.insert(revenueLogsTable).values(logs.slice(i, i + CHUNK));
  }
  logger.info({ n: logs.length }, "Seed: revenue logs inserted");
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    logger.error({ err }, "Seed failed");
    process.exit(1);
  });
