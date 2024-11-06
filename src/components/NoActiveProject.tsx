import { open } from "@tauri-apps/plugin-dialog";
import { setActiveProjectPath } from "../lib/projects";

// TODO: pretty this up, auto-trigger it...?
export function NoActiveProject() {
  return (
    <div className="flex flex-col items-center justify-center h-full">
      <div>No active project</div>
      <button onClick={handleOpenProject}>Open project</button>
    </div>
  );

  async function handleOpenProject() {
    const selected = await open({
      directory: true,
      multiple: false,
    });

    if (selected) {
      setActiveProjectPath(selected);
    }
  }
}
