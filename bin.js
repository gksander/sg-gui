#! /usr/bin/env node

import yargs from "yargs";
import { serve } from "@hono/node-server";
import { serveStatic } from "@hono/node-server/serve-static";

const argv = yargs(process.argv).argv;

async function main() {
  const { createApp } = await import("./dist/server/app.js");

  const app = createApp();
  app.use("*", serveStatic({ root: "./dist/client" }));

  const port = argv.port || 3000;

  serve({
    ...app,
    port,
  });
  console.log(`Server is running on http://localhost:${port}`);
}

main();
