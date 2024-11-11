import { QueryClientProvider, useSuspenseQueries } from "@tanstack/react-query";
import { honoClient, queryClient, QueryKeys } from "./client.ts";
import { Suspense } from "react";
// @ts-expect-error types mad, don't really care.
import "@fontsource-variable/jetbrains-mono";
import "./App.css";
import { NoSgInstalledView } from "@/client/components/NoSgInstalledView.tsx";
import { ProjectView } from "@/client/components/ProjectView.tsx";
import { initMonacoWithShiki } from "@/client/lib/shiki.ts";

function App() {
  return (
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
        queryFn: () => honoClient.cwd.$get().then((res) => res.json()),
        staleTime: Infinity,
      },
      {
        queryKey: QueryKeys.homedir(),
        queryFn: () => honoClient.homedir.$get().then((res) => res.json()),
        staleTime: Infinity,
      },
      {
        queryKey: QueryKeys.sgCheck(),
        queryFn: () => honoClient["sg-check"].$get().then((res) => res.json()),
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

export default App;
