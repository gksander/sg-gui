import { invoke } from "@tauri-apps/api/core";
import { Command } from "@tauri-apps/plugin-shell";
import { useCallback, useRef, useState } from "react";
import { setActiveProjectPath } from "../models/projects";
import { SGResult } from "../types";
import { CodeDiff } from "./CodeDiff";
import { ProjectHeader } from "./ProjectHeader";
import Editor from "@monaco-editor/react";
import { useDebouncedCallback } from "../utils/useDebouncedCallback";
import { RuleResults } from "./RuleResults";

type Props = {
  path: string;
};

export function ProjectView({ path }: Props) {
  const [input, setInput] = useState(DEFAULT_RULE);
  const [replace, setReplace] = useState("");
  const [results, setResults] = useState<Record<string, SGResult[]>>({});

  const onChange = useDebouncedCallback(
    useCallback((ruleString: string | undefined) => {
      if (ruleString) {
        setInput(ruleString.trim());
      }
    }, []),
    500,
  );

  return (
    <div className="h-screen overflow-hidden flex flex-col">
      <ProjectHeader path={path} />
      <div className="flex flex-row flex-1">
        <div className="flex-1 h-full overflow-auto relative">
          <Editor
            height="100%"
            language="yaml"
            defaultValue={input}
            options={{
              minimap: { enabled: false },
            }}
            onChange={onChange}
          />
        </div>

        <div className="flex-1 h-full relative">
          <RuleResults path={path} rule={input} />
        </div>
      </div>

      {/* <div className="p-8">

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
      </div>

      <Results results={results} projectPath={path} /> */}
    </div>
  );

  async function doThing() {
    const command = Command.create(
      "sg",
      [
        "--pattern",
        input,
        "--rewrite",
        replace,
        "--json=compact",
        // "--context=3",
      ],
      {
        cwd: path,
      },
    );

    const result = await command.execute();
    const rawResults = JSON.parse(result.stdout) as SGResult[];

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
  const scrollRef = useRef<HTMLDivElement>(null);

  const numFiles = Object.keys(results).length;
  const numResults = Object.values(results).flat().length;

  return (
    <div
      className="flex flex-col gap-3 bg-red-300 flex-1 h-screen overflow-auto"
      ref={scrollRef}
    >
      <div className="text-sm text-gray-500">
        <span>
          {numFiles} files with {numResults} results
        </span>
        <button onClick={() => replaceAll()}>Replace all</button>
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
}

const DEFAULT_RULE = `
rule:
  pattern: React.useMemo($FN, $DEPS)
`.trim();
