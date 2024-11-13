import { type ClientResponse, hc } from "hono/client";
import { ApiRoutes } from "../server/app";
import { QueryClient } from "@tanstack/react-query";

export const honoClient = hc<ApiRoutes>("/api");

export async function handleHonoResponse<TResponse, TStatus extends number>(
  res: ClientResponse<TResponse, TStatus, "json">,
) {
  if (!res.ok) {
    throw new Error(await res.text());
  }

  return res.json();
}

export const queryClient = new QueryClient();

export const QueryKeys = {
  cwd: () => ["project-path"],
  homedir: () => ["homedir"],
  sgCheck: () => ["sg-installed"],
  initMonaco: () => ["init-monaco"],
  scan: ({
    projectPath,
    globs,
    languageId,
    input,
  }: {
    projectPath: string;
    languageId: string;
    globs: string;
    input: string;
  }) => ["scan-results", projectPath, languageId, globs, input],
};
