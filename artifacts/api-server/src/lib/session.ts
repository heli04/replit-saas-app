import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import { pool } from "@workspace/db";
import { logger } from "./logger";

declare module "express-session" {
  interface SessionData {
    userId?: number;
  }
}

const PgStore = connectPgSimple(session);

const sessionSecret = process.env["SESSION_SECRET"];
if (!sessionSecret) {
  throw new Error("SESSION_SECRET environment variable is required");
}

export const sessionMiddleware: ReturnType<typeof session> = session({
  name: "pulse.sid",
  secret: sessionSecret,
  resave: false,
  saveUninitialized: false,
  rolling: true,
  cookie: {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 1000 * 60 * 60 * 24 * 7,
  },
  store: new PgStore({
    pool,
    tableName: "user_sessions",
    createTableIfMissing: false,
    errorLog: (err) => logger.error({ err }, "session store error"),
  }),
});
