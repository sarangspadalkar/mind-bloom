import type { Context } from "../../context.js";
import type { Course } from "@mindbloom/database";

/**
 * Field resolvers for the Course type.
 *
 * The parent object is the Prisma Course row (scalars only — no relations
 * included). Each field resolver loads the related data on demand.
 */
export const courseResolvers = {
  Course: {
    instructor: (parent: Course, _: unknown, ctx: Context) => {
      return ctx.prisma.user.findUniqueOrThrow({
        where: { id: parent.userId },
      });
    },

    modules: (parent: Course, _: unknown, ctx: Context) => {
      return ctx.prisma.module.findMany({
        where: { courseId: parent.id },
        orderBy: { position: "asc" },
      });
    },

    enrollments: (parent: Course, _: unknown, ctx: Context) => {
      return ctx.prisma.enrollment.findMany({
        where: { courseId: parent.id },
      });
    },

    reviews: (parent: Course, _: unknown, ctx: Context) => {
      return ctx.prisma.review.findMany({
        where: { courseId: parent.id },
        orderBy: { createdAt: "desc" },
      });
    },
  },
};
