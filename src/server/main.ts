import { serve } from "@hono/node-server";
import { createApp } from "./app.js";

const app = createApp();

serve({
  ...app,
  port: 3001,
});
