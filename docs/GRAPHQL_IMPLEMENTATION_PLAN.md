# MindBloom — GraphQL Implementation Plan

A phased plan to implement **production-grade GraphQL** on MindBloom. Each phase is **small, reviewable, and approvable** before moving to the next.

---

## How to use this plan

- Work through **one phase at a time**.
- **Review and approve** the changes (e.g. run the app, test manually, or review the PR) before starting the next phase.
- Check off the deliverables when done. Dependencies flow downward: Phase 1.1 → 1.2 → 1.3 → 1.4, then Phase 2.1 → 2.2 → etc.

---

## Current state

- **Existing**: Prisma schema (User, Course, Module, Lesson, Enrollment, Review, `RoleEnum`), `packages/database` with TypeGraphQL-Prisma, stub packages (`node`, `web`, `common/backend`, `common/universal`).
- **Gap**: No GraphQL server, no auth, no federation. This plan fills that gap in small steps.

---

# Phase 1 — GraphQL foundation (single service)

## Phase 1.1 — Server shell & monorepo wiring

**Goal**: One runnable GraphQL server that responds with a minimal schema. No database yet.

**Scope**:
- Add a GraphQL server (Apollo Server or GraphQL Yoga) in `packages/node` (or a new `packages/api`).
- Expose a single root field (e.g. `version: String` or `_health: String`) so you can query `{ version }` and get a response.
- Ensure the monorepo runs: e.g. `npm run dev` from root or from `packages/node` starts the server.
- Wire `packages/database` as a dependency where the server will live (for the next phase).

**Deliverables**:
- [ ] GraphQL server dependency added (e.g. `@apollo/server` or `graphql-yoga`).
- [ ] Server starts and serves HTTP (e.g. port 4000).
- [ ] One query resolvable (e.g. `version` or `_health`).
- [ ] README or script to run the server.

**Approve before**: Phase 1.2

---

## Phase 1.2 — Core schema (types only)

**Goal**: Full schema for domain types and enums; no resolvers yet (or stubs that return null).

**Scope**:
- Define GraphQL types: `User`, `Course`, `Module`, `Lesson`, `Enrollment`, `Review`, and enum `Role`. Match your Prisma model names/fields where it makes sense.
- Add **query** placeholders only, e.g. `user(id)`, `course(id)`, `courses`, `me` — resolvers can throw "not implemented" or return null for now.
- No mutations in this phase.
- Schema can be SDL in a file (e.g. `packages/node/src/schema.graphql`) or built via TypeGraphQL from Prisma; your choice.

**Deliverables**:
- [ ] All core types and `Role` enum in schema.
- [ ] Query roots declared (even if resolvers are stubs).
- [ ] Schema is loadable by the server (introspection works).

**Approve before**: Phase 1.3

---

## Phase 1.3 — Resolvers + Prisma (read-only)

**Goal**: Queries resolve real data from PostgreSQL via Prisma.

**Scope**:
- Use Prisma client from `packages/database` (generate client if needed).
- Implement resolvers for: at least `course(id)`, `courses`, and one nested relation (e.g. `Course.modules` or `Course.instructor`).
- Optionally: `user(id)`, `me` (can return null if no auth yet). Keep it read-only; no mutations.

**Deliverables**:
- [ ] Prisma client generated and used in resolvers.
- [ ] `course` / `courses` return real data.
- [ ] At least one relation (e.g. course → modules or instructor) works.
- [ ] No mutations yet.

**Approve before**: Phase 1.4

---

## Phase 1.4 — Health & ops

**Goal**: Simple health/readiness and a way to confirm schema for ops or tooling.

**Scope**:
- Add a non-GraphQL HTTP route (e.g. `GET /health` or `GET /ready`) that returns 200 when the app and DB are reachable.
- Optionally: keep a `version` or `_schemaVersion` field on the GraphQL schema for quick checks.

**Deliverables**:
- [ ] `GET /health` (or `/ready`) returns 200 and optionally checks DB.
- [ ] Schema is stable and introspectable.

**Approve before**: Phase 2.1

---

# Phase 2 — Authentication

## Phase 2.1 — Shared auth package (JWT only)

**Goal**: Reusable JWT sign/verify and user-from-token logic; no GraphQL yet.

**Scope**:
- In `packages/common/backend` (or `packages/auth`): add utilities to **sign** a JWT (e.g. `userId`, `email`, `role`) and **verify** a token and return payload or null.
- Use a secret from env (e.g. `JWT_SECRET`); support expiry. No login/register logic yet — just the crypto/contract.
- Optional: add a simple password hash/compare (e.g. bcrypt) in the same package for use in Phase 2.3.

**Deliverables**:
- [ ] `signToken(payload)` and `verifyToken(token)` in shared package.
- [ ] Token payload shape documented (e.g. `{ sub: userId, role, email }`).
- [ ] Package is importable from `packages/node`.

**Approve before**: Phase 2.2

---

## Phase 2.2 — Context middleware (user from token)

**Goal**: Every GraphQL request gets `context.user` when a valid Bearer token is present.

**Scope**:
- In the GraphQL server: before running the schema, read `Authorization: Bearer <token>`, call shared `verifyToken`, load user from DB by id (optional but recommended), attach to `context.user`. If no token or invalid, `context.user = null`.
- Do not add login/register yet — you can test by manually creating a JWT and sending it in the client.

**Deliverables**:
- [ ] Middleware parses `Authorization` and sets `context.user` (or null).
- [ ] Resolvers can access `context.user` (e.g. use it in a stub `me` query later).

**Approve before**: Phase 2.3

---

## Phase 2.3 — Login & register mutations

**Goal**: Clients can register and log in; receive tokens and optionally current user.

**Scope**:
- Add mutations: `register(input: RegisterInput): AuthPayload`, `login(email, password): AuthPayload`.
- `AuthPayload`: e.g. `{ token: String!, user: User }`. Optionally `refreshToken` and HTTP-only cookie in a later phase.
- Register: validate input, hash password, create user in DB, return signed JWT + user.
- Login: find user by email, compare password, return JWT + user. Use generic "Invalid credentials" message on failure (no user-not-found vs wrong-password).

**Deliverables**:
- [ ] `register` and `login` mutations implemented.
- [ ] Passwords hashed (e.g. bcrypt); never returned in GraphQL.
- [ ] Auth errors are generic in production.

**Approve before**: Phase 2.4

---

## Phase 2.4 — Auth security hardening

**Goal**: Rate limiting and safe error handling for auth.

**Scope**:
- Apply rate limiting to login and register (e.g. by IP or by email). Reject with 429 or a clear message when exceeded.
- Ensure login/register never leak "user not found" vs "wrong password"; use one generic message.
- Optional: rate limit the whole GraphQL endpoint (e.g. by IP) with a higher threshold.

**Deliverables**:
- [ ] Rate limit on login/register.
- [ ] No sensitive auth details in error messages or logs.

**Approve before**: Phase 3.1

---

# Phase 3 — Authorization (RBAC + resource-level)

## Phase 3.1 — Role directives

**Goal**: Coarse-grained protection using `@requireAuth` and `@requireRole`.

**Scope**:
- Implement two mechanisms (directives or middleware):  
  - **@requireAuth**: reject if `context.user == null` (return `UNAUTHENTICATED`-style error).  
  - **@requireRole(roles: [Role])**: reject if user is not in the list (return `FORBIDDEN`-style error).
- Apply them to a few fields or types (e.g. `me` requires auth; a future admin query requires Admin). You can expand usage in 3.2.

**Deliverables**:
- [ ] `@requireAuth` and `@requireRole(roles)` implemented and documented.
- [ ] At least one query/mutation protected; unauthenticated/wrong-role requests get proper error codes.

**Approve before**: Phase 3.2

---

## Phase 3.2 — RBAC matrix (apply to schema)

**Goal**: All mutations and sensitive queries are protected by role.

**Scope**:
- Define and document the matrix: Student / Instructor / Admin vs operations (e.g. create course = Instructor or Admin only; delete user = Admin only).
- Apply `@requireAuth` / `@requireRole` to every mutation and to sensitive queries (e.g. list all users = Admin only).
- Public reads (e.g. list courses, get course by id) can stay open; protect "my enrollments", "me", etc.

**Deliverables**:
- [ ] Role × operation matrix documented (e.g. in README or `docs/authorization.md`).
- [ ] Schema fully protected according to the matrix.

**Approve before**: Phase 3.3

---

## Phase 3.3 — Resource-level (ownership) checks

**Goal**: Users can only change resources they own (or are Admin).

**Scope**:
- For mutations that update/delete a course: load the course, check `course.userId === context.user.id` or user is Admin; else `FORBIDDEN`.
- Same idea for enrollment (own enrollment only) and review (own review only). Add these checks in resolvers or a small authorizer helper.

**Deliverables**:
- [ ] Update/delete course checks ownership (or Admin).
- [ ] Enrollment and review mutations restricted to owner (or Admin) where applicable.

**Approve before**: Phase 3.4

---

## Phase 3.4 — Consistent error codes

**Goal**: Clients can rely on error codes for auth/authz.

**Scope**:
- Ensure all auth/authz errors use a consistent shape: e.g. `extensions.code: "UNAUTHENTICATED"` or `"FORBIDDEN"`, and optional `extensions.field` for validation.
- Document the codes (e.g. in `docs/errors.md` or README) so you can reference them in the frontend or in interviews.

**Deliverables**:
- [ ] `UNAUTHENTICATED` and `FORBIDDEN` (and any other codes) used consistently.
- [ ] Error codes documented.

**Approve before**: Phase 4.1

---

# Phase 4 — Federated schema (Apollo Federation v2)

## Phase 4.1 — Users subgraph

**Goal**: First subgraph: User entity + auth operations.

**Scope**:
- Create `packages/subgraph-users` (or similar). Expose a federated subgraph with:  
  - Entity `User @key(fields: "id")` with fields you need (id, email, role, etc.).  
  - Queries: `me`, `user(id)` (for entity resolution).  
  - Mutations: `login`, `register`.
- Subgraph runs on its own port (e.g. 4001). No gateway yet; you can test by querying this subgraph directly.

**Deliverables**:
- [ ] Users subgraph runs and exposes User + auth.
- [ ] `_entities` / reference resolver for User by `id` works (test with a query that requests `user(id) { id email }`).

**Approve before**: Phase 4.2

---

## Phase 4.2 — Catalog subgraph

**Goal**: Second subgraph: Course, Module, Lesson.

**Scope**:
- Create `packages/subgraph-catalog`. Expose:  
  - Entities: `Course @key(fields: "id")`, `Module`, `Lesson` (and relations).  
  - Queries: e.g. `course(id)`, `courses`, `module(id)`, etc.
- No user-specific data in this subgraph; no enrollments or reviews here.

**Deliverables**:
- [ ] Catalog subgraph runs (e.g. port 4002).
- [ ] Course and modules/lessons resolvable; entity keys in place.

**Approve before**: Phase 4.3

---

## Phase 4.3 — Learning subgraph (enrollments & reviews)

**Goal**: Third subgraph: Enrollment, Review; extends User and Course.

**Scope**:
- Create `packages/subgraph-learning`. Expose:  
  - `Enrollment`, `Review` (and mutations like enroll, submitReview).  
  - Extend `User` with e.g. `enrollments: [Enrollment]` and `Course` with `reviews: [Review]` (and maybe `enrollments`).  
  - Reference resolvers: resolve User and Course by id (return `{ __typename, id }`) so the gateway can merge.
- Subgraph runs on its own port (e.g. 4003).

**Deliverables**:
- [ ] Learning subgraph runs.
- [ ] Extended fields on User and Course work when this subgraph is composed.
- [ ] Enroll and review mutations work when called via this subgraph.

**Approve before**: Phase 4.4

---

## Phase 4.4 — Gateway + composition + auth

**Goal**: Single entry point; auth at gateway and forwarded to subgraphs.

**Scope**:
- Add `packages/gateway` (Apollo Router or Apollo Server gateway). Compose the supergraph from the three subgraphs (rover or config).
- Gateway validates JWT and forwards user identity to subgraphs (e.g. custom header `x-user-id`, `x-user-role`). Subgraphs read these headers and set `context.user` (no JWT verification in subgraphs if you trust the gateway).
- Document how to run: gateway + subgraph-users + subgraph-catalog + subgraph-learning, and how auth flows.

**Deliverables**:
- [ ] Gateway composes all subgraphs and serves one endpoint.
- [ ] Auth validated at gateway; user id/role passed to subgraphs.
- [ ] One cross-subgraph query works (e.g. `me { id email enrollments { course { title } } }`).
- [ ] README section: run gateway + subgraphs, auth flow.

**Approve before**: Phase 4.5

---

## Phase 4.5 — Federation docs & ops

**Goal**: Clear docs for future you and for interviews.

**Scope**:
- Document which subgraph owns which types and mutations.
- Optional: add a script or docker-compose to start all services locally. Optional: rover in CI to validate composition.

**Deliverables**:
- [ ] Ownership table or doc (e.g. `docs/federation.md`).
- [ ] Easy way to run full stack locally (script or compose).

**Approve before**: Phase 5.1

---

# Phase 5 — Advanced (performance, safety, testing)

## Phase 5.1 — DataLoader (N+1 prevention)

**Goal**: At least one relation uses batching to avoid N+1.

**Scope**:
- Add DataLoader (or similar) for a hot path: e.g. `Course.instructor` (batch load users by id) or `User.enrollments` (batch load enrollments by userId).
- Add a short code comment explaining why this loader exists and how it batches.

**Deliverables**:
- [ ] One or two DataLoaders implemented and used in resolvers.
- [ ] Comment or doc explaining the N+1 fix.

**Approve before**: Phase 5.2

---

## Phase 5.2 — Query complexity

**Goal**: Reject overly complex queries.

**Scope**:
- Integrate `graphql-query-complexity` (or equivalent). Assign weights to list fields and depth; set a max complexity; return a clear error when exceeded.
- Tune the limit so normal usage is allowed and abusive queries are rejected.

**Deliverables**:
- [ ] Complexity rule enabled with a ceiling.
- [ ] Example of a query that is allowed and one that is rejected (optional: in docs).

**Approve before**: Phase 5.3

---

## Phase 5.3 — Error handling & logging

**Goal**: Consistent errors and structured logs.

**Scope**:
- Ensure all errors (validation, not found, server) have a consistent format and optional `extensions.code`.
- Add structured logging (e.g. request id, operation name, user id); no passwords or tokens in logs.
- Optional: persisted operations or allowlist in a later iteration.

**Deliverables**:
- [ ] Error format documented; codes used consistently.
- [ ] Logging in place; no sensitive data in logs.

**Approve before**: Phase 5.4

---

## Phase 5.4 — Testing

**Goal**: Unit and integration tests you can run in CI.

**Scope**:
- **Unit**: Test auth helpers (sign/verify, password hash) and at least one authorizer or resolver with mocked context and DB.
- **Integration**: Test GraphQL endpoint with a test DB: login, a protected query (with/without token), and one mutation (e.g. create course as Instructor).
- Optional: schema snapshot or contract test so breaking changes are caught.

**Deliverables**:
- [ ] Unit tests for auth and at least one resolver/authorizer.
- [ ] Integration test(s) for login + protected operation + one mutation.
- [ ] `npm test` (or equivalent) runs the suite.

**Approve before**: Phase 5.5 (optional)

---

## Phase 5.5 — Optional extras

**Goal**: Differentiators for senior profile (pick what you have time for).

**Options** (implement any subset):
- **Subscriptions**: One use case (e.g. “new review on a course”) with authenticated WebSocket.
- **Persisted operations**: Allow only pre-registered operation IDs in production.
- **Metrics**: Simple metrics (e.g. query latency, error count) and optional Prometheus endpoint.
- **README polish**: Architecture diagram, “How to run”, “Auth flow”, “Authorization matrix” in the main README.

**Deliverables**:
- [ ] At least one optional item implemented or documented.

---

# Quick reference: phase order

| Phase   | Name                          | Approve before   |
|---------|--------------------------------|------------------|
| 1.1     | Server shell                   | 1.2              |
| 1.2     | Core schema                    | 1.3              |
| 1.3     | Resolvers + Prisma (read)      | 1.4              |
| 1.4     | Health & ops                   | 2.1              |
| 2.1     | Shared auth (JWT)              | 2.2              |
| 2.2     | Context middleware             | 2.3              |
| 2.3     | Login & register               | 2.4              |
| 2.4     | Auth security                  | 3.1              |
| 3.1     | Role directives                | 3.2              |
| 3.2     | RBAC matrix                    | 3.3              |
| 3.3     | Resource-level checks          | 3.4              |
| 3.4     | Error codes                    | 4.1              |
| 4.1     | Users subgraph                 | 4.2              |
| 4.2     | Catalog subgraph               | 4.3              |
| 4.3     | Learning subgraph              | 4.4              |
| 4.4     | Gateway + auth                 | 4.5              |
| 4.5     | Federation docs                | 5.1              |
| 5.1     | DataLoader                     | 5.2              |
| 5.2     | Query complexity               | 5.3              |
| 5.3     | Errors & logging               | 5.4              |
| 5.4     | Testing                        | —                |
| 5.5     | Optional extras                | —                |

---

# Interview talking points (unchanged)

- **Schema-first**: How the schema drives clients and servers; single source of truth.
- **Auth**: JWT at gateway vs subgraphs; context; no leaks in errors.
- **Authorization**: Directives vs resolver checks; role vs resource-level; consistency in federation.
- **Federation**: Domain split; entity resolution; auth forwarding.
- **Production**: Complexity limits, DataLoader, error handling, observability.

Use this plan as a roadmap and as a script for your README and resume: *“Implemented a federated GraphQL platform with JWT auth, RBAC, and query complexity controls.”*
