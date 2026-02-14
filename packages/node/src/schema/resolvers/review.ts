import type { Context } from "../../context.js";
import type { Review } from "@mindbloom/database";

/**
 * Field resolvers for the Review type.
 */
export const reviewResolvers = {
  Review: {
    user: (parent: Review, _: unknown, ctx: Context) => {
      return ctx.prisma.user.findUniqueOrThrow({
        where: { id: parent.userId },
      });
    },

    course: (parent: Review, _: unknown, ctx: Context) => {
      return ctx.prisma.course.findUniqueOrThrow({
        where: { id: parent.courseId },
      });
    },
  },
};
