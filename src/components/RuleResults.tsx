import { Button } from "@/components/ui/button";
import { SGResult } from "../types";
import { CodeDiff } from "./CodeDiff";
import { ReplaceButton } from "@/components/ReplaceButton";

type Props = {
  results: [string, SGResult[]][] | undefined;
  isReplacement: boolean;
  replaceBytes: (
    replacements: Record<string, [number, number, string][]>,
  ) => Promise<unknown>;
};

export function RuleResults({
  results: consumerResults,
  isReplacement,
  replaceBytes,
}: Props) {
  const results = consumerResults ?? [];
  const numFiles = Object.keys(results).length;
  const numResults = Object.values(results).flat().length;

  // TODO: pretty this up
  if (numResults === 0) {
    return <div>No results</div>;
  }

  return (
    <div className="absolute inset-0 overflow-auto">
      <div className="flex justify-between items-center mb-4 px-6 py-2">
        <span className="font-bold h-9 flex items-center">
          {numResults} matches in {numFiles} files
        </span>

        {isReplacement && <ReplaceButton onClick={replaceAll} multiple />}
      </div>

      {results.map(([file, results]) => (
        <div key={file} className="flex flex-col gap-3 mb-4 px-6">
          <div className="font-medium flex justify-between items-center sticky top-0 bg-background text-sm py-2">
            <span className="h-9 flex items-center">
              {file}
              {results.length > 1 &&
                ` (${results.length} ${results.length === 1 ? "result" : "results"})`}
            </span>

            {isReplacement && (
              <ReplaceButton
                onClick={() => replaceAllInFile({ file, results })}
                multiple={results.length > 1}
              />
            )}
          </div>

          {results.map((result) => (
            <CodeDiff key={`${result.file}:${result.lines}`} change={result} />
          ))}
        </div>
      ))}
    </div>
  );

  function replaceAll() {
    return replaceBytes(
      Object.fromEntries(
        results.map(([file, results]) => [
          file,
          results.map((result) => [
            result.range.byteOffset.start,
            result.range.byteOffset.end,
            result.replacement!, // TODO: don't bang
          ]),
        ]),
      ),
    );
  }

  function replaceAllInFile({
    file,
    results,
  }: {
    file: string;
    results: SGResult[];
  }) {
    return replaceBytes({
      [file]: results.map((result) => [
        result.range.byteOffset.start,
        result.range.byteOffset.end,
        result.replacement!, // TODO: don't bang
      ]),
    });
  }
}
