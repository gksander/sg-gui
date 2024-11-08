#! /usr/bin/env node

import { serve } from "@hono/node-server";
import { serveStatic } from "@hono/node-server/serve-static";

async function main() {
  const { createApp } = await import("./dist/server/app.js");

  const app = createApp();
  app.use("*", serveStatic({ root: "./dist/client" }));

  serve({
    ...app,
    port: 3000,
  });
  console.log("Server is running on port 3000");
}

main();
