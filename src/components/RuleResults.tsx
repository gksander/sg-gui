import { SGResult } from "../types";
import { CodeDiff } from "./CodeDiff";

type Props = {
  results: [string, SGResult[]][] | undefined;
  replaceBytes: (
    replacements: Record<string, [number, number, string][]>,
  ) => Promise<unknown>;
};

export function RuleResults({ results: consumerResults, replaceBytes }: Props) {
  const results = consumerResults ?? [];
  const numFiles = Object.keys(results).length;
  const numResults = Object.values(results).flat().length;

  return (
    <div className="absolute inset-0 overflow-auto p-4">
      <div className="text-sm text-gray-500">
        <span>
          {numFiles} files with {numResults} results
        </span>
        <button onClick={() => replaceAll()}>Replace all</button>
      </div>

      {results.map(([file, results]) => (
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
