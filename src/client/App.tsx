import { QueryClientProvider, useSuspenseQueries } from "@tanstack/react-query";
import { honoClient, queryClient, QueryKeys } from "./client.ts";
import { Suspense } from "react";
import "@fontsource-variable/jetbrains-mono";
import "./App.css";
import { NoSgInstalledView } from "@/client/components/NoSgInstalledView.tsx";

function App() {
  return (
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
    ],
  });

  if (!sgInstalled) {
    return <NoSgInstalledView />;
  }

  return (
    <div>
      <div>{projectPath}</div>
      <div>Home dir: {homedir}</div>
      <div>SG installed? {sgInstalled ? "yes" : "no"}</div>
    </div>
  );
}

export default App;
