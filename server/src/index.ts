import { Hono } from "hono";
import { cors } from "hono/cors";
import { initializeSchema } from "./db/schema";
import { seedDatabase } from "./db/seed";
import boardRoutes from "./routes/boards";
import columnRoutes from "./routes/columns";
import cardRoutes from "./routes/cards";
import dependencyRoutes from "./routes/dependencies";
import { wsHandler, setServer } from "./ws/handler";
import type { WsData } from "./ws/types";

// Initialize database
initializeSchema();
seedDatabase();

// Create Hono app
const app = new Hono();
app.use("/*", cors());

// Mount routes
app.route("/api/boards", boardRoutes);
app.route("/api/columns", columnRoutes);
app.route("/api", cardRoutes);
app.route("/api", dependencyRoutes);

// Health check
app.get("/health", (c) => c.json({ status: "ok" }));

// Start server with HTTP + WebSocket
const server = Bun.serve({
  port: 3000,
  fetch(req, server) {
    const url = new URL(req.url);

    // Handle WebSocket upgrade
    if (url.pathname === "/ws") {
      const boardId = url.searchParams.get("boardId");
      const success = server.upgrade(req, {
        data: {
          boardId,
          userId: crypto.randomUUID(),
        } as WsData,
      });
      if (success) return undefined;
      return new Response("WebSocket upgrade failed", { status: 400 });
    }

    // Handle HTTP with Hono
    return app.fetch(req);
  },
  websocket: wsHandler,
});

setServer(server);

console.log(`BoardFlow server running on http://localhost:${server.port}`);
console.log(`WebSocket available at ws://localhost:${server.port}/ws`);
