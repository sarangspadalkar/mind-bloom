import { DateTimeScalar } from "./scalars.js";
import { queryResolvers } from "./query.js";
import { courseResolvers } from "./course.js";
import { userResolvers } from "./user.js";
import { moduleResolvers } from "./module.js";
import { lessonResolvers } from "./lesson.js";
import { enrollmentResolvers } from "./enrollment.js";
import { reviewResolvers } from "./review.js";

/**
 * Merged resolver map.
 *
 * Each domain file exports resolvers for one GraphQL type. We merge them
 * here into the single resolver tree that Apollo Server expects.
 */
export const resolvers = {
  // Custom scalars
  DateTime: DateTimeScalar,

  // Root queries
  ...queryResolvers,

  // Type-level field resolvers
  ...courseResolvers,
  ...userResolvers,
  ...moduleResolvers,
  ...lessonResolvers,
  ...enrollmentResolvers,
  ...reviewResolvers,
};
