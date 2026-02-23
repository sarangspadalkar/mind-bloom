import type { Request } from "express";
import { prisma, type PrismaClient } from "@mindbloom/database";
import { verifyToken } from "@mindbloom/common-backend";

// ── Public types ───────────────────────────────────────────────────────

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
  /** Client IP — used for rate limiting in auth resolvers. */
  clientIp: string;
}

// ── Helpers ────────────────────────────────────────────────────────────

/**
 * Extract the Bearer token from the Authorization header, verify it,
 * and load the user from the database to confirm they still exist.
 *
 * We deliberately do a DB lookup rather than blindly trusting the JWT:
 * this ensures that deleted/disabled users are rejected even if their
 * token hasn't expired yet.
 */
async function getUserFromRequest(
  req: Request
): Promise<ContextUser | null> {
  const header = req.headers["authorization"];
  if (!header?.startsWith("Bearer ")) return null;

  const token = header.slice(7);
  const payload = await verifyToken(token);
  if (!payload) return null;

  const user = await prisma.user.findUnique({
    where: { id: payload.sub },
    select: { id: true, email: true, role: true },
  });

  if (!user) return null;

  return { id: user.id, email: user.email, role: user.role };
}

// ── Context factory ────────────────────────────────────────────────────

/**
 * Builds a fresh context for each incoming GraphQL request.
 */
export async function createContext({
  req,
}: {
  req: Request;
}): Promise<Context> {
  const user = await getUserFromRequest(req);

  return {
    prisma,
    user,
    clientIp: req.ip ?? req.socket?.remoteAddress ?? "unknown",
  };
}
