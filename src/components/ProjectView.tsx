import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Editor from "@monaco-editor/react";
import { keepPreviousData, useMutation, useQuery } from "@tanstack/react-query";
import { open } from "@tauri-apps/plugin-dialog";
import { Fragment, useCallback, useMemo } from "react";
import { FaRegFolder } from "react-icons/fa";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SHIKI_THEME } from "@/lib/shiki";
import { queryClient } from "@/queries";
import { SgGuiResultItem } from "@/types";
import { invoke } from "@tauri-apps/api/core";
import { createPortal } from "react-dom";
import { useDebouncedCallback } from "../lib/useDebouncedCallback";
import { LanguageId, LANGUAGES } from "../lib/languages";
import { setActiveProjectPath } from "../lib/projects";
import { useStorePersistedState } from "../store";
import { ResultPane } from "./ResultPane";
import { useDebouncedValue } from "@/lib/useDebouncedValue";

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
    initialValue: "*",
  });

  const debouncedGlobs = useDebouncedValue(globs, 200);

  const onChange = useDebouncedCallback(
    useCallback((ruleString: string | undefined) => {
      if (ruleString) {
        setInput(ruleString.trim());
      }
    }, []),
    200,
  );

  const queryKey = useMemo(
    () => ["scan-results", path, languageId, debouncedGlobs, input],
    [path, languageId, debouncedGlobs, input],
  );

  const { data: results, error: scanError } = useQuery<
    [string, SgGuiResultItem[]][],
    string
  >({
    queryKey: queryKey,
    queryFn: () =>
      invoke<[string, SgGuiResultItem[]][]>("exec_sg_query", {
        projectPath: path,
        query: input,
        language: LANGUAGES[languageId].sgLanguage,
        pathGlobs: debouncedGlobs,
      }),
    gcTime: 0,
    retry: 0,
    placeholderData: keepPreviousData,
  });

  const isReplacement = !!results?.[0]?.[1]?.[0]?.replacement;

  const { mutate } = useMutation({
    mutationFn: (replacements: Record<string, SgGuiResultItem[]>) => {
      return invoke("replace_bytes_in_files", {
        projectPath: path,
        replacements: Object.fromEntries(
          Object.entries(replacements).map(([file, results]) => [
            file,
            results.map((result) => [
              result.byteStart,
              result.byteEnd,
              result.replacement!,
            ]),
          ]),
        ),
      });
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

  /**
   * Wrapped in view transition to enable smooth UI updates.
   */
  const replaceBytes = useCallback(
    (replacements: Record<string, SgGuiResultItem[]>) => {
      document.startViewTransition(() => mutate(replacements));
    },
    [mutate],
  );

  return (
    <Fragment>
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
            isReplacement={isReplacement}
            replaceBytes={replaceBytes}
            languageId={languageId}
            error={scanError}
          />
        </div>
      </div>

      {createPortal(
        <div
          className="h-full flex items-center justify-between select-none"
          data-tauri-drag-region
        >
          <div className="flex-1 select-none" />
          <button
            onClick={handleOpenProject}
            className="text-sm flex gap-2 items-center py-1 px-3 hover:bg-background-alt rounded transition-colors duration-150 select-none"
          >
            <FaRegFolder className="w-4 h-4" />
            {getProjectPathRelativeToHome()}
          </button>
          <div className="flex-1 select-none" />
        </div>,
        document.querySelector("#app-titlebar")!,
      )}
    </Fragment>
  );

  function getProjectPathRelativeToHome() {
    return path.replace(homedir, "~");
  }

  async function handleOpenProject() {
    const selected = await open({
      directory: true,
      multiple: false,
    });

    if (selected) {
      setActiveProjectPath(selected);
    }
  }
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
      <div className="flex flex-col gap-1.5">
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

      <div className="flex-1 flex flex-col gap-1.5">
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
  pattern: React.useMemo($FN, $DEPS)
`.trim();
