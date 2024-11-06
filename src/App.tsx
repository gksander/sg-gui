import { NoSgInstalledView } from "@/components/NoSgInstalledView";
import { sgCheckQuery } from "@/lib/models/sgCheck";
import { initMonacoWithShiki } from "@/lib/shiki";
import "@fontsource-variable/jetbrains-mono";
import { QueryClientProvider, useSuspenseQueries } from "@tanstack/react-query";
import { homeDir } from "@tauri-apps/api/path";
import { Suspense } from "react";
import "./App.css";
import { NoActiveProject } from "./components/NoActiveProject";
import { ProjectView } from "./components/ProjectView";
import { useActiveProjectPath } from "./lib/models/projects";
import { queryClient } from "./lib/queryClient";

function App() {
  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <div
        className="h-9 border-b bg-transparent select-none"
        data-tauri-drag-region
        id="app-titlebar"
      />
      <div className="flex-1 overflow-hidden">
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
    </div>
  );
}

function BootstrapActiveProject() {
  const { data: activeProjectPath } = useActiveProjectPath();

  const [_, { data: homedir }, { data: sgInstalled }] = useSuspenseQueries({
    queries: [
      {
        queryKey: ["init-monaco"],
        queryFn: async () => {
          await initMonacoWithShiki();
          return { ok: true };
        },
      },
      {
        queryKey: ["homeDir"],
        queryFn: () => homeDir(),
      },
      sgCheckQuery(),
    ],
  });

  if (!sgInstalled) {
    return <NoSgInstalledView />;
  }

  if (!activeProjectPath) {
    return <NoActiveProject />;
  }

  return (
    <ProjectView
      path={activeProjectPath}
      homedir={homedir}
      key={activeProjectPath}
    />
  );
}

export default App;
