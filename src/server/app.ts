import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";

const apiRoutes = new Hono().get(
  "/blah",
  zValidator("query", z.object({ name: z.string() })),
  async (c) => {
    const data = c.req.valid("query");

    return c.json({
      shit: data.name,
    });
  }
);

const app = new Hono();
app.route("/api", apiRoutes);

export const createApp = () => {
  return app;
};

export type ApiRoutes = typeof apiRoutes;
