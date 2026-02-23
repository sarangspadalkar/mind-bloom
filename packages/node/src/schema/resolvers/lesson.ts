import type { Context } from "../../context.js";
import type { Lesson } from "@mindbloom/database";

/**
 * Field resolvers for the Lesson type.
 */
export const lessonResolvers = {
  Lesson: {
    module: (parent: Lesson, _: unknown, ctx: Context) => {
      if (!parent.moduleId) return null;
      return ctx.prisma.module.findUnique({
        where: { id: parent.moduleId },
      });
    },
  },
};
