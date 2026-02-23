/**
 * GraphQL Schema Definition Language (SDL) — the single source of truth
 * for the MindBloom API contract.
 *
 * Schema-first: we author the SDL first, then implement resolvers to match.
 * This makes the API shape explicit, enables client code-gen, and aligns
 * with Apollo Federation conventions for later phases.
 */

export const typeDefs = `#graphql

  # ───────────────────────────── Scalars ─────────────────────────────

  """ISO-8601 date-time string (e.g. 2025-06-15T09:30:00.000Z)"""
  scalar DateTime

  # ───────────────────────────── Enums ───────────────────────────────

  enum Role {
    Student
    Instructor
    Admin
  }

  # ───────────────────────────── Types ───────────────────────────────

  type User {
    id: ID!
    createdAt: DateTime!
    updatedAt: DateTime!
    firstName: String!
    lastName: String!
    email: String!
    role: Role!

    """Courses this user teaches (Instructor only)"""
    courses: [Course!]!

    """Enrollments for this user (Student)"""
    enrollments: [Enrollment!]!

    """Reviews written by this user"""
    reviews: [Review!]!
  }

  type Course {
    id: ID!
    createdAt: DateTime!
    updatedAt: DateTime!
    title: String!
    price: Int!

    """The instructor who created this course"""
    instructor: User!

    """Ordered list of modules in this course"""
    modules: [Module!]!

    """Students enrolled in this course"""
    enrollments: [Enrollment!]!

    """Reviews left on this course"""
    reviews: [Review!]!
  }

  type Module {
    id: ID!
    createdAt: DateTime!
    updatedAt: DateTime!
    title: String!
    position: Int!

    """The course this module belongs to"""
    course: Course

    """Ordered list of lessons in this module"""
    lessons: [Lesson!]!
  }

  type Lesson {
    id: ID!
    createdAt: DateTime!
    updatedAt: DateTime!
    title: String!
    position: Int!

    """The module this lesson belongs to"""
    module: Module
  }

  type Enrollment {
    id: ID!
    createdAt: DateTime!
    updatedAt: DateTime!
    enrolledAt: DateTime!
    progress: Int!

    """The enrolled user"""
    user: User!

    """The course they are enrolled in"""
    course: Course!
  }

  type Review {
    id: ID!
    createdAt: DateTime!
    updatedAt: DateTime!
    rating: Int!
    comment: String!

    """The user who wrote this review"""
    user: User!

    """The course this review is for"""
    course: Course!
  }

  # ───────────────────────────── Auth ───────────────────────────────

  """Returned by login and register mutations"""
  type AuthPayload {
    """JWT access token"""
    token: String!
    """The authenticated user"""
    user: User!
  }

  input RegisterInput {
    firstName: String!
    lastName: String!
    email: String!
    """Must be at least 8 characters"""
    password: String!
    """Defaults to Student if not provided"""
    role: Role = Student
  }

  # ───────────────────────────── Queries ─────────────────────────────

  type Query {
    """Health check — returns OK if the service is running"""
    _health: String!

    """Schema version identifier"""
    _version: String!

    # ── Users ──

    """Get a user by ID"""
    user(id: ID!): User

    """Get the currently authenticated user (returns null if not logged in)"""
    me: User

    # ── Courses ──

    """List courses with optional pagination"""
    courses(limit: Int, offset: Int): [Course!]!

    """Get a single course by ID"""
    course(id: ID!): Course

    # ── Modules ──

    """List modules for a given course, ordered by position"""
    modules(courseId: ID!): [Module!]!

    """Get a single module by ID"""
    module(id: ID!): Module

    # ── Lessons ──

    """Get a single lesson by ID"""
    lesson(id: ID!): Lesson
  }

  # ───────────────────────────── Mutations ───────────────────────────

  type Mutation {
    """Register a new user account"""
    register(input: RegisterInput!): AuthPayload!

    """Log in with email and password"""
    login(email: String!, password: String!): AuthPayload!
  }
`;
