import { cors } from "jsr:@hono/hono@^4.9.6/cors";
import { observedChatHandler } from "./api-chat.ts";
import { Hono } from "jsr:@hono/hono@^4.9.6";

const app = new Hono();

app.use("*", cors({
  origin: "*",
  allowMethods: ["POST", "OPTIONS"],
  allowHeaders: ["Content-Type", "Authorization"],
}));

// Add chat route
app.post("/api/chat", observedChatHandler);

// Start the server
const port = parseInt(Deno.env.get("PORT") || "8000");

Deno.serve({ port }, app.fetch);