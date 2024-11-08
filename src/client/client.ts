import { hc } from "hono/client";
import { ApiRoutes } from "../server/app";

export const honoClient = hc<ApiRoutes>("/api");
