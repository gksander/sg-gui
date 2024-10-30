import { Command } from "@tauri-apps/plugin-shell";
import { memo, useState } from "react";
import { SGResult } from "../types";
import { setActiveProjectPath } from "../models/projects";
import ReactDiffViewer, { DiffMethod } from "react-diff-viewer";
import { CodeDiff } from "./CodeDiff";
import { invoke } from "@tauri-apps/api/core";

type Props = {
  path: string;
};

export function ProjectView({ path }: Props) {
  const [input, setInput] = useState("");
  const [replace, setReplace] = useState("");
  const [results, setResults] = useState<Record<string, SGResult[]>>({});

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
              placeholder="Search"
            />
          </div>

          <p>Enter replacement</p>
          <div>
            <input
              type="text"
              value={replace}
              onChange={(e) => setReplace(e.target.value)}
              placeholder="Replace"
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

      <Results results={results} projectPath={path} />
    </div>
  );

  async function doThing() {
    const command = Command.create(
      "sg",
      ["--pattern", input, "--rewrite", replace, "--json=compact"],
      {
        cwd: path,
      },
    );

    const result = await command.execute();
    const rawResults = JSON.parse(result.stdout) as SGResult[];

    console.log(rawResults);

    const fileResults = rawResults.reduce<Record<string, SGResult[]>>(
      (acc, result) => {
        if (!acc[result.file]) {
          acc[result.file] = [result];
          return acc;
        }

        const enteringByteOffset = result.range.byteOffset.start;
        const insertIndex = acc[result.file].findIndex((otherResult) => {
          return otherResult.range.byteOffset.start > enteringByteOffset;
        });

        if (insertIndex !== -1) {
          acc[result.file].splice(insertIndex, 0, result);
        } else {
          acc[result.file].push(result);
        }

        return acc;
      },
      {},
    );

    const orderedResults = Object.entries(fileResults).sort((a, b) =>
      a[0].localeCompare(b[0]),
    );

    setResults(Object.fromEntries(orderedResults));
  }
}

function Results({
  results,
  projectPath,
}: {
  results: Record<string, SGResult[]>;
  projectPath: string;
}) {
  const numFiles = Object.keys(results).length;
  const numResults = Object.values(results).flat().length;

  return (
    <div className="flex flex-col gap-3">
      <div className="text-sm text-gray-500">
        {numFiles} files with {numResults} results
      </div>

      {Object.entries(results).map(([file, results]) => (
        <div key={file} className="flex flex-col gap-2">
          <div className="text-lg font-bold flex gap-3">
            {file} ({results.length} results)
            <button onClick={() => replaceAllInFile({ file, results })}>
              Replace all
            </button>
          </div>
          {results.map((result) => (
            <CodeDiff key={`${result.file}:${result.lines}`} change={result} />
          ))}
        </div>
      ))}
    </div>
  );

  function replaceAllInFile({
    file,
    results,
  }: {
    file: string;
    results: SGResult[];
  }) {
    return invoke("replace_bytes_in_file", {
      file,
      projectPath,
      bytesToReplace: results.map((result) => [
        result.range.byteOffset.start,
        result.range.byteOffset.end,
        result.replacement,
      ]),
    })
      .then((res) => {
        console.log(res);
      })
      .catch((err) => {
        console.error(err);
      });
  }
}
