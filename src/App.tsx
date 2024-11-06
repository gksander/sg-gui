import {
  QueryClientProvider,
  useSuspenseQueries,
  useSuspenseQuery,
} from "@tanstack/react-query";
import "@fontsource-variable/jetbrains-mono";
import "./App.css";
import { useActiveProjectPath } from "./models/projects";
import { queryClient } from "./queries";
import { NoActiveProject } from "./components/NoActiveProject";
import { ProjectView } from "./components/ProjectView";
import { Suspense } from "react";
import { initMonacoWithShiki } from "@/lib/shiki";
import { homeDir } from "@tauri-apps/api/path";

function App() {
  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <div
        className="h-9 border-b border-background-alt/50 bg-transparent select-none"
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

  const [_, { data: homedir }] = useSuspenseQueries({
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
    ],
  });

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
