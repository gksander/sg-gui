import { ReplaceButton } from "@/components/ReplaceButton";
import { useMemo } from "react";
import { SGResult } from "../types";
import { CodeDiff } from "./CodeDiff";

type Props = {
  results: [string, SGResult[]][] | undefined;
  isReplacement: boolean;
  replaceBytes: (replacements: Record<string, SGResult[]>) => Promise<unknown>;
};

export function RuleResults({
  results: consumerResults,
  isReplacement,
  replaceBytes,
}: Props) {
  const results = consumerResults ?? [];
  const numFiles = results.length;
  const numResults = useMemo(
    () => results.reduce((acc, [_, results]) => acc + results.length, 0),
    [results],
  );

  // TODO: pretty this up
  if (numResults === 0) {
    return <div>No results</div>;
  }

  // TODO: need to infinite scroll this... rendering all the shit at once ain't great.

  return (
    <div className="absolute inset-0 overflow-auto pretty-scrollbar isolate">
      <div className="flex justify-between items-center mb-4 px-6 py-2">
        <span className="font-bold h-9 flex items-center">
          {numResults} matches in {numFiles} files
        </span>

        {isReplacement && <ReplaceButton onClick={replaceAll} multiple />}
      </div>

      {results.map(([file, results]) => (
        <FileResults
          key={file}
          file={file}
          results={results}
          isReplacement={isReplacement}
          replaceBytes={replaceBytes}
        />
      ))}
    </div>
  );

  function replaceAll() {
    return replaceBytes(Object.fromEntries(results));
  }
}

function FileResults({
  file,
  results,
  isReplacement,
  replaceBytes,
}: { file: string; results: SGResult[] } & Pick<
  Props,
  "isReplacement" | "replaceBytes"
>) {
  return (
    <div
      key={file}
      className="flex flex-col gap-3 mb-4 px-6 exiting-element"
      style={{ viewTransitionName: `file-results-${file}` }}
    >
      <div className="font-medium flex justify-between items-center sticky z-10 top-0 bg-background text-sm py-2">
        <span className="h-9 flex items-center">
          {file}
          {results.length > 1 &&
            ` (${results.length} ${results.length === 1 ? "result" : "results"})`}
        </span>

        {isReplacement && (
          <ReplaceButton
            onClick={(evt) => {
              const exitingElement =
                evt.currentTarget.closest(".exiting-element");
              if (exitingElement instanceof HTMLElement) {
                exitingElement.style.viewTransitionName = "exiting";
              }

              replaceAllInFile({ file, results });
            }}
            multiple={results.length > 1}
          />
        )}
      </div>

      {results.map((result) => (
        <CodeDiff key={result.id} change={result} replaceBytes={replaceBytes} />
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
    if (!isReplacement) return;

    replaceBytes({
      [file]: results,
    });
  }
}
