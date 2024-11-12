import { ReplaceButton } from "@/client/components/ReplaceButton";
import { PropsWithChildren, useMemo, useState } from "react";
import { SgGuiResultItem } from "@/types.ts";
import { CodeSnippet } from "@/client/components/CodeSnippet";
import { LanguageId } from "@/client/lib/languages";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/client/components/ui/alert";
import { FaCircleExclamation } from "react-icons/fa6";
import { AnimatePresence, motion } from "framer-motion";

type Props = {
  results: [string, SgGuiResultItem[]][] | undefined;
  isReplacement: boolean;
  replaceBytes: (replacements: Record<string, SgGuiResultItem[]>) => void;
  languageId: LanguageId;
  error?: Error | null;
};

export function ResultPane({
  results: consumerResults,
  isReplacement,
  replaceBytes,
  languageId,
  error,
}: Props) {
  const [exiting, setExiting] = useState(false);

  const results = consumerResults ?? [];
  const numFiles = results.length;
  const numResults = useMemo(
    () => results.reduce((acc, [, results]) => acc + results.length, 0),
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
    <div className="absolute inset-0 overflow-y-auto overflow-x-hidden pretty-scrollbar isolate result-list">
      <div className="flex justify-between items-center mb-4 px-6">
        <span className="font-bold h-9 flex items-center">
          {numResults} matches in {numFiles} files
        </span>

        {isReplacement && <ReplaceButton onClick={replaceAll} multiple />}
      </div>

      <div className="flex flex-col gap-y-4 pb-4">
        <AnimatePresence
          initial={false}
          onExitComplete={() => setExiting(false)}
        >
          {results.map(([file, results]) => (
            <FileResults
              key={file}
              file={file}
              results={results}
              isReplacement={isReplacement}
              replaceBytes={replaceBytes}
              languageId={languageId}
              exiting={exiting}
              setExiting={setExiting}
            />
          ))}
        </AnimatePresence>
      </div>
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
  exiting,
  setExiting,
}: {
  file: string;
  results: SgGuiResultItem[];
  exiting: boolean;
  setExiting: (exiting: boolean) => void;
} & Pick<Props, "isReplacement" | "replaceBytes" | "languageId">) {
  return (
    <motion.div
      key={file}
      className="flex flex-col gap-2 px-6 exiting-element"
      style={{
        viewTransitionName: `file-results-${results[0].id}`,
      }}
      exit={exiting ? { height: 0, opacity: 0, x: 100 } : undefined}
      transition={{ duration: 0.2 }}
    >
      <div className="font-medium flex justify-between items-center sticky z-10 top-0 bg-background text-sm">
        <span className="h-9 flex items-center">
          {file}
          {results.length > 1 &&
            ` (${results.length} ${results.length === 1 ? "result" : "results"})`}
        </span>

        {isReplacement && (
          <ReplaceButton
            onClick={() => {
              setExiting(true);
              replaceAllInFile({ file, results });
            }}
            multiple={results.length > 1}
          />
        )}
      </div>

      <div className="flex flex-col gap-4">
        <AnimatePresence
          initial={false}
          onExitComplete={() => {
            setExiting(false);
          }}
        >
          {results.map((result) => (
            <CodeSnippet
              key={result.id}
              change={result}
              languageId={languageId}
              exiting={exiting}
              onReplace={() => {
                if (!isReplacement) return;

                setExiting(true);
                if (results.length === 1) {
                  return replaceAllInFile({ file, results });
                }

                replaceBytes({ [file]: [result] });
              }}
            />
          ))}
        </AnimatePresence>
      </div>
    </motion.div>
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

function ErrorView({ error }: { error: Error }) {
  return (
    <ContentWrapper>
      <Alert variant="destructive">
        <FaCircleExclamation className="w-4 h-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>{error.message}</AlertDescription>
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