import type { Request } from "express";
import { prisma, type PrismaClient } from "@mindbloom/database";

// ── Public types ───────────────────────────────────────────────────────

/**
 * Shape of the authenticated user attached to the request context.
 * Populated by the auth middleware in Phase 2; null until then.
 */
export interface ContextUser {
  id: string;
  email: string;
  role: string;
}

/**
 * GraphQL context available in every resolver.
 */
export interface Context {
  prisma: PrismaClient;
  /** The authenticated user, or null for anonymous requests. */
  user: ContextUser | null;
}

// ── Context factory ────────────────────────────────────────────────────

/**
 * Builds a fresh context for each incoming GraphQL request.
 *
 * Phase 1: user is always null.
 * Phase 2: we will parse the Authorization header here and resolve the user.
 */
export async function createContext({
  req: _req,
}: {
  req: Request;
}): Promise<Context> {
  // Phase 2 will add: const user = await getUserFromToken(req);
  return {
    prisma,
    user: null,
  };
}
