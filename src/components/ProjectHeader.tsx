import { setActiveProjectPath } from "../models/projects";

type Props = {
  path: string;
};

export function ProjectHeader({ path }: Props) {
  return (
    <div className="p-2 border-b flex justify-between">
      {path}

      <button onClick={() => setActiveProjectPath(null)}>
        Clear active project
      </button>
    </div>
  );
}
