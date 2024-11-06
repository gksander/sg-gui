import { ReplaceButton } from "@/components/ReplaceButton";
import { useMemo } from "react";
import { SgGuiResultItem } from "../types";
import { CodeDiff } from "./CodeDiff";
import { LanguageId } from "@/models/languages";

type Props = {
  results: [string, SgGuiResultItem[]][] | undefined;
  isReplacement: boolean;
  replaceBytes: (replacements: Record<string, SgGuiResultItem[]>) => void;
  languageId: LanguageId;
};

export function RuleResults({
  results: consumerResults,
  isReplacement,
  replaceBytes,
  languageId,
}: Props) {
  const results = consumerResults ?? [];
  const numFiles = results.length;
  const numResults = useMemo(
    () => results.reduce((acc, [_, results]) => acc + results.length, 0),
    [results],
  );

  // TODO: pretty this up
  if (numResults === 0) {
    return (
      <div className="h-9 my-2 px-6 text-lg font-medium flex items-center">
        No results
      </div>
    );
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
          languageId={languageId}
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
  languageId,
}: { file: string; results: SgGuiResultItem[] } & Pick<
  Props,
  "isReplacement" | "replaceBytes" | "languageId"
>) {
  return (
    <div
      key={file}
      className="flex flex-col gap-2 mb-4 px-6 exiting-element"
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

      <div className="flex flex-col gap-4">
        {results.map((result) => (
          <CodeDiff
            key={result.id}
            change={result}
            replaceBytes={replaceBytes}
            languageId={languageId}
          />
        ))}
      </div>
    </div>
  );

  function replaceAllInFile({
    file,
    results,
  }: {
    file: string;
    results: SgGuiResultItem[];
  }) {
    if (!isReplacement) return;

    replaceBytes({
      [file]: results,
    });
  }
}
