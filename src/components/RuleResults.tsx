import { useQuery } from "@tanstack/react-query";
import { getSGResults, replaceBytesInFiles } from "../models/sg";
import { invoke } from "@tauri-apps/api/core";
import { CodeDiff } from "./CodeDiff";
import { SGResult } from "../types";
import { LanguageId } from "../models/languages";
type Props = {
  path: string;
  rule: string;
  languageId: LanguageId;
};

export function RuleResults({ path, rule, languageId }: Props) {
  const { data, error } = useQuery({
    queryKey: ["scan-results", rule],
    queryFn: () => getSGResults({ path, rule, languageId }),
    gcTime: 0,
    retry: 0,
  });

  if (error) {
    return <div className="bg-red-100">{error.message}</div>;
  }

  const results = data ?? [];
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

  // TODO: move to models/sg.ts?
  function replaceAll() {
    return invoke("replace_bytes_in_files", {
      projectPath: path,
      replacements: Object.fromEntries(
        results.map(([file, results]) => [
          file,
          results.map((result) => [
            result.range.byteOffset.start,
            result.range.byteOffset.end,
            result.replacement,
          ]),
        ]),
      ),
    });
  }

  function replaceAllInFile({
    file,
    results,
  }: {
    file: string;
    results: SGResult[];
  }) {
    return replaceBytesInFiles({
      path,
      replacements: {
        [file]: results.map((result) => [
          result.range.byteOffset.start,
          result.range.byteOffset.end,
          result.replacement!,
        ]),
      },
    })
      .then((res) => {
        console.log(res);
      })
      .catch((err) => {
        console.error(err);
      });
    // return invoke("replace_bytes_in_files", {
    //   projectPath: path,
    //   replacements: {
    //     [file]: results.map((result) => [
    //       result.range.byteOffset.start,
    //       result.range.byteOffset.end,
    //       result.replacement,
    //     ]),
    //   },
    // })
    //   .then((res) => {
    //     console.log(res);
    //   })
    //   .catch((err) => {
    //     console.error(err);
    //   });
  }
}
