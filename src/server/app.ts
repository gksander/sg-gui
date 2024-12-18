import { homedir } from "node:os";
import { execa } from "execa";
import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { execSgQuery, execSgQueryArgsSchema } from "./services/sg.js";
import {
  replaceBytes,
  replaceBytesArgsSchema,
} from "./services/replaceBytes.js";

const apiRoutes = new Hono()
  /**
   * Get cwd of process to determine what project path we're looking at
   */
  .get("/cwd", async (c) => {
    return c.json({
      cwd: process.env.DIR || process.cwd(),
    });
  })
  /**
   * Get the homedir for user for prettying up some paths in the UI
   */
  .get("/homedir", (c) => {
    return c.json({
      homedir: homedir(),
    });
  })
  /**
   * Check that `sg` is installed and can be executed
   */
  .get("/sg-check", async (c) => {
    const res = await execa`sg --version`.catch(() => ({ stderr: "error" }));

    return c.json({
      installed:
        !res.stderr && "stdout" in res && res.stdout.includes("ast-grep"),
    });
  })
  /**
   * Execute ast-grep query and return results
   */
  .post(
    "/exec-sg-query",
    zValidator("json", execSgQueryArgsSchema),
    async (c) => {
      const validated = c.req.valid("json");
      return c.json(await execSgQuery(validated));
    },
  )
  /**
   * Replacing bytes
   */
  .post(
    "/replace-bytes",
    zValidator("json", replaceBytesArgsSchema),
    async (c) => {
      const validated = c.req.valid("json");
      await replaceBytes(validated);

      return c.json({
        success: true,
      });
    },
  );

export const createApp = () => {
  const app = new Hono();
  app.route("/api", apiRoutes);

  return app;
};

export type ApiRoutes = typeof apiRoutes;
