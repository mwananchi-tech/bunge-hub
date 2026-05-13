import postgres from "postgres";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not set");
}

// Singleton connection — Vite HMR can re-import modules, guard against
// creating multiple pools in development.
declare global {
  var __db: postgres.Sql | undefined;
}

export const db: postgres.Sql =
  global.__db ??
  (global.__db = postgres(process.env.DATABASE_URL, {
    max: 10,
    idle_timeout: 30,
    transform: postgres.camel,
  }));
