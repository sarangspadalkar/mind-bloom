import type { Context } from "../../context.js";

const SCHEMA_VERSION = "1.0.0";

/**
 * Root Query resolvers.
 *
 * These are the entry points into the graph. Each resolver fetches from
 * Prisma and returns a "flat" model object; relation fields (e.g.
 * Course.instructor) are resolved by their own field resolvers.
 */
export const queryResolvers = {
  Query: {
    // ── Ops ────────────────────────────────────────────────────────
    _health: () => "OK",
    _version: () => SCHEMA_VERSION,

    // ── Users ──────────────────────────────────────────────────────

    user: async (_: unknown, args: { id: string }, ctx: Context) => {
      return ctx.prisma.user.findUnique({ where: { id: args.id } });
    },

    /** Returns null until authentication is implemented in Phase 2. */
    me: async (_: unknown, __: unknown, ctx: Context) => {
      // ctx.user will be populated in Phase 2
      if (!ctx.user) return null;
      return ctx.prisma.user.findUnique({ where: { id: ctx.user.id } });
    },

    // ── Courses ────────────────────────────────────────────────────

    courses: async (
      _: unknown,
      args: { limit?: number; offset?: number },
      ctx: Context
    ) => {
      return ctx.prisma.course.findMany({
        take: args.limit ?? 20,
        skip: args.offset ?? 0,
        orderBy: { createdAt: "desc" },
      });
    },

    course: async (_: unknown, args: { id: string }, ctx: Context) => {
      return ctx.prisma.course.findUnique({ where: { id: args.id } });
    },

    // ── Modules ────────────────────────────────────────────────────

    modules: async (
      _: unknown,
      args: { courseId: string },
      ctx: Context
    ) => {
      return ctx.prisma.module.findMany({
        where: { courseId: args.courseId },
        orderBy: { position: "asc" },
      });
    },

    module: async (_: unknown, args: { id: string }, ctx: Context) => {
      return ctx.prisma.module.findUnique({ where: { id: args.id } });
    },

    // ── Lessons ────────────────────────────────────────────────────

    lesson: async (_: unknown, args: { id: string }, ctx: Context) => {
      return ctx.prisma.lesson.findUnique({ where: { id: args.id } });
    },
  },
};
