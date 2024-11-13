import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/client/components/ui/select";
import Editor from "@monaco-editor/react";
import { keepPreviousData, useMutation, useQuery } from "@tanstack/react-query";
import { Fragment, useCallback, useMemo } from "react";
import { Helmet } from "react-helmet-async";

import { Input } from "@/client/components/ui/input";
import { Label } from "@/client/components/ui/label";
import { SHIKI_THEME } from "@/client/lib/shiki";
import { useDebouncedValue } from "@/client/lib/useDebouncedValue";
import { honoClient, queryClient, QueryKeys } from "@/client/client";
import { SgGuiResultItem } from "@/types";
import { LanguageId, LANGUAGES } from "@/client/lib/languages";
import { useDebouncedCallback } from "@/client/lib/useDebouncedCallback";
import { ResultPane } from "./ResultPane";
import { useStorePersistedState } from "@/client/lib/state.ts";
import { sleep } from "../lib/sleep";

type Props = {
  path: string;
  homedir: string;
};

export function ProjectView({ path, homedir }: Props) {
  const [input, setInput] = useStorePersistedState<string>({
    path,
    key: "input",
    initialValue: DEFAULT_RULE,
  });
  const [languageId, setLanguageId] = useStorePersistedState<LanguageId>({
    path,
    key: "languageId",
    initialValue: "tsx",
  });
  const [globs, setGlobs] = useStorePersistedState<string>({
    path,
    key: "globs",
    initialValue: "",
  });

  const debouncedGlobs = useDebouncedValue(globs, 200);

  const onChange = useDebouncedCallback(
    useCallback(
      (ruleString: string | undefined) => {
        if (ruleString) {
          setInput(ruleString.trim());
        }
      },
      [setInput],
    ),
    300,
  );

  const queryKey = useMemo(
    () =>
      QueryKeys.scan({
        projectPath: path,
        input,
        languageId,
        globs: debouncedGlobs,
      }),
    [path, languageId, debouncedGlobs, input],
  );

  const {
    data: results,
    error: scanError,
    isFetching,
  } = useQuery({
    queryKey: queryKey,
    queryFn: () =>
      honoClient["exec-sg-query"]
        .$post({
          json: {
            projectPath: path,
            query: input,
            language: LANGUAGES[languageId].sgLanguage,
            pathGlobs: debouncedGlobs,
          },
        })
        // TODO: extract this out as part of our hono client...
        .then(async (res) => {
          if (!res.ok) {
            throw new Error(await res.text());
          }

          return res.json();
        }),
    gcTime: 0,
    retry: 0,
    placeholderData: keepPreviousData,
  });

  const isReplacement = !!results?.[0]?.[1]?.[0]?.replacement;

  const { mutate: replaceBytes } = useMutation({
    mutationFn: async (replacements: Record<string, SgGuiResultItem[]>) => {
      const request = honoClient["replace-bytes"]
        .$post({
          json: {
            projectPath: path,
            replacements: Object.fromEntries(
              Object.entries(replacements).map(([file, results]) => [
                file,
                results.map(
                  (result) =>
                    [
                      result.byteStart,
                      result.byteEnd,
                      result.replacement!,
                    ] as const,
                ),
              ]),
            ),
          },
        })
        .then((res) => res.json());

      const [data] = await Promise.all([request, sleep(300)]);

      return data;
    },

    onMutate: (replacements) => {
      queryClient.setQueryData<[string, SgGuiResultItem[]][]>(
        queryKey,
        (old) => {
          if (!old) {
            return;
          }

          const newResultsByFile = Object.fromEntries(structuredClone(old));

          // Loop through each file of replacements hash and update existing cache based on presence.
          for (const [file, results] of Object.entries(replacements)) {
            const existingResults = newResultsByFile[file];

            const newResults = existingResults.filter(
              (result) => !results.some((r) => r.id === result.id),
            );

            if (newResults.length === 0) {
              delete newResultsByFile[file];
            } else {
              newResultsByFile[file] = newResults;
            }
          }

          return Object.entries(newResultsByFile);
        },
      );
    },

    onSettled: () =>
      queryClient.invalidateQueries({ queryKey: queryKey.slice(0, 1) }),
  });

  return (
    <Fragment>
      <Helmet>
        <title>{path.replace(homedir, "~")}</title>
      </Helmet>
      <div className="h-full overflow-hidden flex flex-row">
        <div className="w-[500px] flex flex-col">
          <LanguageAndGlobsInput
            languageId={languageId}
            onChangeLanguageId={setLanguageId}
            globs={globs}
            onChangeGlobs={setGlobs}
          />
          <div className="flex-1 overflow-hidden">
            <Editor
              height="100%"
              language="yaml"
              defaultValue={input}
              theme={SHIKI_THEME}
              options={{
                minimap: { enabled: false },
                scrollBeyondLastLine: false,
                fontSize: 14,
                fontFamily: "JetBrains Mono Variable",
                fontLigatures: true,
              }}
              onChange={onChange}
            />
          </div>
        </div>

        <div className="flex-1 h-full relative">
          <ResultPane
            results={results}
            error={scanError}
            isFetching={isFetching}
            isReplacement={isReplacement}
            replaceBytes={replaceBytes}
            languageId={languageId}
          />
        </div>
      </div>
    </Fragment>
  );
}

function LanguageAndGlobsInput({
  languageId,
  onChangeLanguageId,
  globs,
  onChangeGlobs,
}: {
  languageId: LanguageId;
  onChangeLanguageId: (languageId: LanguageId) => void;
  globs: string;
  onChangeGlobs: (globs: string) => void;
}) {
  return (
    <div className="p-3 pr-0 border-b flex justify-between gap-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor="language">Language</Label>
        <Select value={languageId} onValueChange={onChangeLanguageId}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Language" />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(LANGUAGES).map(([languageId, languageConfig]) => (
              <SelectItem key={languageId} value={languageId}>
                {languageConfig.displayName}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex-1 flex flex-col gap-2">
        <Label htmlFor="Glob">Glob</Label>

        <Input
          id="glob"
          value={globs}
          onChange={(e) => onChangeGlobs(e.target.value)}
        />
      </div>
    </div>
  );
}

const DEFAULT_RULE = `
rule:
  pattern: ...
`.trim();
