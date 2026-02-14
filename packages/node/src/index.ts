import { ApolloServer } from "@apollo/server";
import { expressMiddleware } from "@as-integrations/express5";
import express from "express";
import cors from "cors";

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
  introspection: true, // allow introspection in all envs for now
});

// ── Express app ────────────────────────────────────────────────────────

async function main() {
  await server.start();

  const app = express();

  // ── Health / readiness (Phase 1.4) ─────────────────────────────────

  app.get("/health", async (_req, res) => {
    try {
      // Verify DB is reachable
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
