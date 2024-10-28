import { Command } from "@tauri-apps/plugin-shell";
import { useState } from "react";
import { SGResult } from "../types";
import { setActiveProjectPath } from "../models/projects";

type Props = {
  path: string;
};

export function ProjectView({ path }: Props) {
  const [input, setInput] = useState("");
  const [results, setResults] = useState<SGResult[]>([]);

  return (
    <div className="p-8 flex flex-col gap-4">
      <div className="text-2xl font-bold">
        {path}
        <button onClick={() => setActiveProjectPath(null)}>
          Clear active project
        </button>
      </div>

      <div className="flex flex-row gap-4">
        <div>
          <p>Enter input</p>
          <div>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  doThing();
                }
              }}
            />
          </div>
          <button onClick={doThing}>Do a thing...</button>
        </div>
      </div>

      <div>
        {results.map((result) => (
          <div key={`${result.file}:${result.lines}`}>{result.text}</div>
        ))}
      </div>
    </div>
  );

  async function doThing() {
    const command = Command.create("sg", ["--pattern", input, "--json"], {
      cwd: path,
    });

    const result = await command.execute();
    const json = JSON.parse(result.stdout);
    setResults(json);
  }
}
