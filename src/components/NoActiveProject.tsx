import { open } from "@tauri-apps/plugin-dialog";
import { setActiveProjectPath } from "../models/projects";

export function NoActiveProject() {
  return (
    <div>
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
