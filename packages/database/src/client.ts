import { PrismaClient } from "../generated/prisma/index.js";

/**
 * Singleton PrismaClient instance.
 *
 * In development, we store the client on `globalThis` so that hot-reloading
 * (e.g. via tsx watch) does not create a new connection pool on every restart.
 */
const globalForPrisma = globalThis as unknown as {
  __prisma: PrismaClient | undefined;
};

export const prisma: PrismaClient =
  globalForPrisma.__prisma ??
  new PrismaClient({
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "warn", "error"]
        : ["warn", "error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.__prisma = prisma;
}
