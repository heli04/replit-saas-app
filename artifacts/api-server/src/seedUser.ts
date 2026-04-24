import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { db, usersTable } from "@workspace/db";
import { logger } from "./lib/logger";

const DEMO_EMAIL = "admin@pulse.app";
const DEMO_PASSWORD = "demo1234";
const DEMO_NAME = "Pulse Admin";

async function main() {
  const [existing] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.email, DEMO_EMAIL))
    .limit(1);

  if (existing) {
    logger.info({ email: DEMO_EMAIL }, "Seed: demo user already present");
    return;
  }

  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);
  await db.insert(usersTable).values({
    email: DEMO_EMAIL,
    name: DEMO_NAME,
    passwordHash,
  });
  logger.info({ email: DEMO_EMAIL }, "Seed: demo user created");
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    logger.error({ err }, "Seed user failed");
    process.exit(1);
  });
