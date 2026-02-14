import type { Context } from "../../context.js";
import type { User } from "@mindbloom/database";

/**
 * Field resolvers for the User type.
 *
 * The parent object is the Prisma User row (scalars only).
 * Sensitive fields like passwordHash are never exposed in the schema.
 */
export const userResolvers = {
  User: {
    courses: (parent: User, _: unknown, ctx: Context) => {
      return ctx.prisma.course.findMany({
        where: { userId: parent.id },
        orderBy: { createdAt: "desc" },
      });
    },

    enrollments: (parent: User, _: unknown, ctx: Context) => {
      return ctx.prisma.enrollment.findMany({
        where: { userId: parent.id },
      });
    },

    reviews: (parent: User, _: unknown, ctx: Context) => {
      return ctx.prisma.review.findMany({
        where: { userId: parent.id },
        orderBy: { createdAt: "desc" },
      });
    },
  },
};
