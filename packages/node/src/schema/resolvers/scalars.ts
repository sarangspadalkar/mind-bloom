import { GraphQLScalarType, Kind } from "graphql";

/**
 * Custom DateTime scalar — serialises JavaScript Date objects to ISO-8601
 * strings and parses incoming strings back to Date objects.
 */
export const DateTimeScalar = new GraphQLScalarType({
  name: "DateTime",
  description: "ISO-8601 date-time string (e.g. 2025-06-15T09:30:00.000Z)",

  // Server → Client: Date → string
  serialize(value: unknown): string {
    if (value instanceof Date) return value.toISOString();
    if (typeof value === "string") return new Date(value).toISOString();
    throw new TypeError(`DateTime cannot serialize non-date value: ${value}`);
  },

  // Client variable → Server: string → Date
  parseValue(value: unknown): Date {
    if (typeof value !== "string") {
      throw new TypeError(`DateTime can only parse string values, got: ${typeof value}`);
    }
    const date = new Date(value);
    if (isNaN(date.getTime())) {
      throw new TypeError(`DateTime cannot parse invalid date string: ${value}`);
    }
    return date;
  },

  // Inline literal → Server: string → Date
  parseLiteral(ast): Date | null {
    if (ast.kind === Kind.STRING) {
      return new Date(ast.value);
    }
    return null;
  },
});
