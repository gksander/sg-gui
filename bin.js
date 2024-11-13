#! /usr/bin/env node

import yargs from "yargs";
import path from "node:path";
import { serve } from "@hono/node-server";
import { serveStatic } from "@hono/node-server/serve-static";
import { execa } from "execa";

const argv = yargs(process.argv).argv;

async function main() {
  const { createApp } = await import("./dist/server/app.js");

  const app = createApp();
  app.use(
    "*",
    serveStatic({
      root: path.relative(
        process.cwd(),
        path.resolve(import.meta.dirname, "dist/client"),
      ),
    }),
  );

  const port = argv.port || 6169;

  serve({
    ...app,
    port,
  });
  console.log(`Server is running on http://localhost:${port}`);

  try {
    execa`open http://localhost:${port}`;
  } catch {}
}

main();
