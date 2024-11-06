import { QueryClientProvider, useSuspenseQuery } from "@tanstack/react-query";
import "@fontsource-variable/jetbrains-mono";
import "./App.css";
import { useActiveProjectPath } from "./models/projects";
import { queryClient } from "./queries";
import { NoActiveProject } from "./components/NoActiveProject";
import { ProjectView } from "./components/ProjectView";
import { Suspense } from "react";
import { initMonacoWithShiki } from "@/lib/shiki";

function App() {
  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <div className="h-8 bg-transparent select-none" data-tauri-drag-region />
      <div className="flex-1 overflow-hidden">
        <QueryClientProvider client={queryClient}>
          <Suspense fallback={<div>Loading...</div>}>
            <BootstrapActiveProject />
          </Suspense>
        </QueryClientProvider>
      </div>
    </div>
  );
}

function BootstrapActiveProject() {
  const { data: activeProjectPath } = useActiveProjectPath();

  useSuspenseQuery({
    queryKey: ["init-monaco"],
    queryFn: async () => {
      await initMonacoWithShiki();
      return { ok: true };
    },
  });

  if (!activeProjectPath) {
    return <NoActiveProject />;
  }

  return <ProjectView path={activeProjectPath} key={activeProjectPath} />;
}

export default App;
