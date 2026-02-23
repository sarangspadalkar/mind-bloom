import "dotenv/config";

import { ApolloServer } from "@apollo/server";
import { expressMiddleware } from "@as-integrations/express5";
import express from "express";
import cors from "cors";
import rateLimit from "express-rate-limit";

import { typeDefs } from "./schema/typeDefs.js";
import { resolvers } from "./schema/resolvers/index.js";
import { createContext, type Context } from "./context.js";
import { prisma } from "@mindbloom/database";

// ── Configuration ──────────────────────────────────────────────────────

const PORT = parseInt(process.env.PORT ?? "4000", 10);

// ── Apollo Server ──────────────────────────────────────────────────────

const server = new ApolloServer<Context>({
  typeDefs,
  resolvers,
  introspection: true,
});

// ── Rate limiting ──────────────────────────────────────────────────────
// Defence-in-depth: this is a coarse transport-level limiter that caps
// total requests per IP.  Auth mutations have their own stricter
// per-operation limiter inside the resolver (see mutation.ts).

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { errors: [{ message: "Too many requests, please try again later." }] },
});

// ── Express app ────────────────────────────────────────────────────────

async function main() {
  await server.start();

  const app = express();

  // ── Health / readiness ─────────────────────────────────────────────

  app.get("/health", async (_req, res) => {
    try {
      await prisma.$queryRawUnsafe("SELECT 1");
      res.json({ status: "ok", db: "connected" });
    } catch (err) {
      res.status(503).json({
        status: "error",
        db: "unreachable",
        message: err instanceof Error ? err.message : "Unknown error",
      });
    }
  });

  // ── GraphQL endpoint ───────────────────────────────────────────────

  app.use(
    "/graphql",
    cors<cors.CorsRequest>(),
    express.json(),
    apiLimiter,
    expressMiddleware(server, {
      context: createContext,
    })
  );

  // ── Start ──────────────────────────────────────────────────────────

  app.listen(PORT, () => {
    console.log(`\n🌱 MindBloom API ready`);
    console.log(`   GraphQL : http://localhost:${PORT}/graphql`);
    console.log(`   Health  : http://localhost:${PORT}/health\n`);
  });
}

main().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
