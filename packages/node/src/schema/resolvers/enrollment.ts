import type { Context } from "../../context.js";
import type { Enrollment } from "@mindbloom/database";

/**
 * Field resolvers for the Enrollment type.
 */
export const enrollmentResolvers = {
  Enrollment: {
    user: (parent: Enrollment, _: unknown, ctx: Context) => {
      return ctx.prisma.user.findUniqueOrThrow({
        where: { id: parent.userId },
      });
    },

    course: (parent: Enrollment, _: unknown, ctx: Context) => {
      return ctx.prisma.course.findUniqueOrThrow({
        where: { id: parent.courseId },
      });
    },
  },
};
