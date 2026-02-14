/**
 * @mindbloom/database
 *
 * Re-exports the singleton Prisma client and all generated types so that
 * consumer packages can import everything from one place:
 *
 *   import { prisma, PrismaClient, User, Course } from "@mindbloom/database";
 */

// Singleton client instance — ready to use
export { prisma } from "./client.js";

// PrismaClient class + all generated model types, enums, and input types
export * from "../generated/prisma/index.js";
