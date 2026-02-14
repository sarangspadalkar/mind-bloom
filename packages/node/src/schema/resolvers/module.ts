import type { Context } from "../../context.js";
import type { Module } from "@mindbloom/database";

/**
 * Field resolvers for the Module type.
 */
export const moduleResolvers = {
  Module: {
    course: (parent: Module, _: unknown, ctx: Context) => {
      if (!parent.courseId) return null;
      return ctx.prisma.course.findUnique({
        where: { id: parent.courseId },
      });
    },

    lessons: (parent: Module, _: unknown, ctx: Context) => {
      return ctx.prisma.lesson.findMany({
        where: { moduleId: parent.id },
        orderBy: { position: "asc" },
      });
    },
  },
};
