import { homedir } from "node:os";
import { execa } from "execa";
import { Hono } from "hono";

const apiRoutes = new Hono()
  .get("/cwd", async (c) => {
    return c.json({
      cwd: process.cwd(),
    });
  })
  .get("/homedir", (c) => {
    return c.json({
      homedir: homedir(),
    });
  })
  .get("/sg-check", async (c) => {
    const res = await execa`sg --version`.catch(() => ({ stderr: "error" }));

    return c.json({
      installed:
        !res.stderr && "stdout" in res && res.stdout.includes("ast-grep"),
    });
  });

const app = new Hono();
app.route("/api", apiRoutes);

export const createApp = () => {
  return app;
};

export type ApiRoutes = typeof apiRoutes;
