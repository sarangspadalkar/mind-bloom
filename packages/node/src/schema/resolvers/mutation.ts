import { GraphQLError } from "graphql";
import {
  signToken,
  hashPassword,
  comparePassword,
  RateLimiter,
} from "@mindbloom/common-backend";
import type { Context } from "../../context.js";

// ── Rate limiters (resolver-level, per IP) ─────────────────────────────
// These provide GraphQL-specific protection on top of the Express-level
// rate limiter, because all GraphQL operations share a single HTTP
// endpoint so transport-level limiting alone isn't granular enough.

const loginLimiter = new RateLimiter({
  maxAttempts: 5,
  windowMs: 60_000,
});
const registerLimiter = new RateLimiter({
  maxAttempts: 3,
  windowMs: 60_000,
});

// ── Input types ────────────────────────────────────────────────────────

interface RegisterInput {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  role?: "Student" | "Instructor" | "Admin";
}

// ── Helpers ────────────────────────────────────────────────────────────

function assertRateLimit(limiter: RateLimiter, key: string) {
  const { allowed, retryAfterMs } = limiter.check(key);
  if (!allowed) {
    throw new GraphQLError(
      "Too many attempts. Please try again later.",
      { extensions: { code: "RATE_LIMITED", retryAfterMs } }
    );
  }
}

const MIN_PASSWORD_LENGTH = 8;

// ── Resolvers ──────────────────────────────────────────────────────────

export const mutationResolvers = {
  Mutation: {
    register: async (
      _: unknown,
      { input }: { input: RegisterInput },
      ctx: Context
    ) => {
      assertRateLimit(registerLimiter, ctx.clientIp);

      if (input.password.length < MIN_PASSWORD_LENGTH) {
        throw new GraphQLError(
          `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`,
          { extensions: { code: "BAD_USER_INPUT", field: "password" } }
        );
      }

      const existing = await ctx.prisma.user.findUnique({
        where: { email: input.email },
        select: { id: true },
      });
      if (existing) {
        throw new GraphQLError(
          "An account with this email already exists.",
          { extensions: { code: "BAD_USER_INPUT", field: "email" } }
        );
      }

      const passwordHash = await hashPassword(input.password);

      const user = await ctx.prisma.user.create({
        data: {
          firstName: input.firstName,
          lastName: input.lastName,
          email: input.email,
          passwordHash,
          role: input.role ?? "Student",
        },
      });

      const token = await signToken({
        sub: user.id,
        email: user.email,
        role: user.role,
      });

      return { token, user };
    },

    login: async (
      _: unknown,
      { email, password }: { email: string; password: string },
      ctx: Context
    ) => {
      assertRateLimit(loginLimiter, ctx.clientIp);

      // Use the same generic message for "user not found" and "wrong password"
      // to prevent user-enumeration attacks.
      const INVALID = new GraphQLError("Invalid credentials.", {
        extensions: { code: "UNAUTHENTICATED" },
      });

      const user = await ctx.prisma.user.findUnique({
        where: { email },
      });
      if (!user) throw INVALID;

      const valid = await comparePassword(password, user.passwordHash);
      if (!valid) throw INVALID;

      const token = await signToken({
        sub: user.id,
        email: user.email,
        role: user.role,
      });

      return { token, user };
    },
  },
};
