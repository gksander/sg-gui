import { hc } from "hono/client";
import { ApiRoutes } from "../server/app";
import { QueryClient } from "@tanstack/react-query";

export const honoClient = hc<ApiRoutes>("/api");

export const queryClient = new QueryClient();

export const QueryKeys = {
  cwd: () => ["project-path"],
  homedir: () => ["homedir"],
  sgCheck: () => ["sg-installed"],
};
