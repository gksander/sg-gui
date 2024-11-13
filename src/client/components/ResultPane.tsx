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
import { Skeleton } from "@/client/components/ui/skeleton.tsx";
import { ImSpinner2 } from "react-icons/im";
import { clsx } from "clsx";

type Props = {
  results: [string, SgGuiResultItem[]][] | undefined;
  error?: Error | null;
  isFetching: boolean;
  isReplacement: boolean;
  replaceBytes: (replacements: Record<string, SgGuiResultItem[]>) => void;
  languageId: LanguageId;
};

export function ResultPane({
  results,
  error,
  isFetching,
  isReplacement,
  replaceBytes,
  languageId,
}: Props) {
  const [exiting, setExiting] = useState(false);

  const numFiles = results?.length ?? 0;
  const numResults = useMemo(
    () => (results ?? []).reduce((acc, [, results]) => acc + results.length, 0),
    [results],
  );

  if (!results && isFetching) {
    return <LoadingView />;
  }

  if (error) {
    return <ErrorView error={error} />;
  }

  if (numResults === 0) {
    return <NoResultsView />;
  }

  // TODO: need to infinite scroll this... rendering all the shit at once ain't great.

  return (
    <div className="absolute inset-0 overflow-y-auto overflow-x-hidden pretty-scrollbar isolate">
      <ImSpinner2
        className={clsx(
          "fixed bottom-4 right-4 w-8 h-8 z-10 opacity-0 transition-opacity duration-150 delay-300",
          isFetching && "animate-spin opacity-100",
        )}
      />

      <div className="flex justify-between items-center pt-9 pb-6 px-6">
        <span className="font-bold flex items-center">
          {numResults} matches in {numFiles} files
        </span>

        {isReplacement && <ReplaceButton onClick={replaceAll} multiple />}
      </div>

      <div className="flex flex-col gap-y-4 pb-6">
        <AnimatePresence
          initial={false}
          onExitComplete={() => setExiting(false)}
        >
          {results?.map(([file, results]) => (
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
    if (!results) {
      return;
    }

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
      className="flex flex-col gap-2 px-6 "
      style={{
        viewTransitionName: `file-results-${results[0].id}`,
      }}
      exit={exiting ? { height: 0, opacity: 0, x: 100 } : undefined}
      transition={{ duration: 0.2 }}
    >
      <div className="font-medium flex justify-between items-center sticky z-10 top-0 bg-background text-sm">
        <span className="pt-10 pb-6 flex items-center">
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

      <div className="flex flex-col gap-6">
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

function LoadingView() {
  return (
    <div className="px-6">
      <div className="pt-10 pb-5">
        <Skeleton className="w-[250px] h-6"></Skeleton>
      </div>
      <Skeleton className="shiki h-[250px]" />
    </div>
  );
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
