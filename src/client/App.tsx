import { QueryClientProvider, useSuspenseQueries } from "@tanstack/react-query";
import {
  handleHonoResponse,
  honoClient,
  queryClient,
  QueryKeys,
} from "./client.ts";
import { Suspense } from "react";
// @ts-expect-error types mad, don't really care.
import "@fontsource-variable/jetbrains-mono";
import "./App.css";
import { NoSgInstalledView } from "@/client/components/NoSgInstalledView.tsx";
import { ProjectView } from "@/client/components/ProjectView.tsx";
import { initMonacoWithShiki } from "@/client/lib/shiki.ts";
import { Helmet, HelmetProvider } from "react-helmet-async";

export function App() {
  return (
    <HelmetProvider>
      <Helmet>
        <title>SG GUI</title>
      </Helmet>

      <div className="flex flex-col h-screen overflow-hidden">
        <QueryClientProvider client={queryClient}>
          <Suspense
            fallback={
              <div className="w-full h-full flex items-center justify-center">
                Loading...
              </div>
            }
          >
            <BootstrapActiveProject />
          </Suspense>
        </QueryClientProvider>
      </div>
    </HelmetProvider>
  );
}

function BootstrapActiveProject() {
  const [
    {
      data: { cwd: projectPath },
    },
    {
      data: { homedir },
    },
    {
      data: { installed: sgInstalled },
    },
  ] = useSuspenseQueries({
    queries: [
      {
        queryKey: QueryKeys.cwd(),
        queryFn: () => honoClient.cwd.$get().then(handleHonoResponse),
        staleTime: Infinity,
      },
      {
        queryKey: QueryKeys.homedir(),
        queryFn: () => honoClient.homedir.$get().then(handleHonoResponse),
        staleTime: Infinity,
      },
      {
        queryKey: QueryKeys.sgCheck(),
        queryFn: () => honoClient["sg-check"].$get().then(handleHonoResponse),
      },
      {
        queryKey: QueryKeys.initMonaco(),
        queryFn: async () => {
          await initMonacoWithShiki();
          return { ok: true };
        },
      },
    ],
  });

  if (!sgInstalled) {
    return <NoSgInstalledView />;
  }

  return <ProjectView path={projectPath} homedir={homedir} />;
}
