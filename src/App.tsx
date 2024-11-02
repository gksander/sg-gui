import { QueryClientProvider } from "@tanstack/react-query";
import "@fontsource-variable/jetbrains-mono";
import "./App.css";
import { useActiveProjectPath } from "./models/projects";
import { queryClient } from "./queries";
import { NoActiveProject } from "./components/NoActiveProject";
import { ProjectView } from "./components/ProjectView";
import { Suspense } from "react";

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Suspense fallback={<div>Loading...</div>}>
        <BootstrapActiveProject />
      </Suspense>
    </QueryClientProvider>
  );
}

function BootstrapActiveProject() {
  const { data: activeProjectPath } = useActiveProjectPath();

  if (!activeProjectPath) {
    return <NoActiveProject />;
  }

  return <ProjectView path={activeProjectPath} key={activeProjectPath} />;
}

export default App;
