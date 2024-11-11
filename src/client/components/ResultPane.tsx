import { ReplaceButton } from "@/client/components/ReplaceButton";
import { PropsWithChildren, useMemo } from "react";
import { SgGuiResultItem } from "@/types.ts";
import { CodeSnippet } from "@/client/components/CodeSnippet";
import { LanguageId } from "@/client/lib/languages";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/client/components/ui/alert";
import { FaCircleExclamation } from "react-icons/fa6";

type Props = {
  results: [string, SgGuiResultItem[]][] | undefined;
  isReplacement: boolean;
  replaceBytes: (replacements: Record<string, SgGuiResultItem[]>) => void;
  languageId: LanguageId;
  error?: string | null;
};

export function ResultPane({
  results: consumerResults,
  isReplacement,
  replaceBytes,
  languageId,
  error,
}: Props) {
  const results = consumerResults ?? [];
  const numFiles = results.length;
  const numResults = useMemo(
    () => results.reduce((acc, [_, results]) => acc + results.length, 0),
    [results],
  );

  if (error) {
    return <ErrorView error={error} />;
  }

  if (numResults === 0) {
    return <NoResultsView />;
  }

  // TODO: need to infinite scroll this... rendering all the shit at once ain't great.

  return (
    <div className="absolute inset-0 overflow-auto pretty-scrollbar isolate">
      <div className="flex justify-between items-center mb-4 px-6">
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
      <div className="font-medium flex justify-between items-center sticky z-10 top-0 bg-background text-sm">
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
          <CodeSnippet
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

function ErrorView({ error }: { error: string }) {
  return (
    <ContentWrapper>
      <Alert variant="destructive">
        <FaCircleExclamation className="w-4 h-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    </ContentWrapper>
  );
}

function NoResultsView() {
  return (
    <ContentWrapper>
      <Alert>
        <AlertTitle>No results</AlertTitle>
        <AlertDescription>
          No results were found for the selected files and rules.
        </AlertDescription>
      </Alert>
    </ContentWrapper>
  );
}

function ContentWrapper({ children }: PropsWithChildren) {
  return <div className="px-6 pb-3 pt-8">{children}</div>;
}
