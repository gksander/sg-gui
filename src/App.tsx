import { QueryClientProvider } from "@tanstack/react-query";
import "./App.css";
import { useActiveProjectPath } from "./models/projects";
import { queryClient } from "./queries";
import { NoActiveProject } from "./components/NoActiveProject";
import { ProjectView } from "./components/ProjectView";
import { Suspense } from "react";
/**
 * TODO: wrap in
 * @returns TODO:
 */
function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <div className="dark">
        <BootstrapActiveProject />
      </div>
    </QueryClientProvider>
  );
}

function BootstrapActiveProject() {
  const { data: activeProjectPath, isLoading } = useActiveProjectPath();

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!activeProjectPath) {
    return <NoActiveProject />;
  }
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ProjectView path={activeProjectPath} />
    </Suspense>
  );
}

export default App;
