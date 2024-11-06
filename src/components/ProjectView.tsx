import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Editor from "@monaco-editor/react";
import {
  keepPreviousData,
  useMutation,
  useQuery,
  useSuspenseQuery,
} from "@tanstack/react-query";
import { homeDir } from "@tauri-apps/api/path";
import { open } from "@tauri-apps/plugin-dialog";
import { Fragment, useCallback, useMemo } from "react";
import { FaRegFolder } from "react-icons/fa";

import { Button } from "@/components/ui/button";
import { SHIKI_THEME } from "@/lib/shiki";
import { queryClient } from "@/queries";
import { SgGuiResultItem } from "@/types";
import { invoke } from "@tauri-apps/api/core";
import { useDebouncedCallback } from "../lib/useDebouncedCallback";
import { LanguageId, LANGUAGES } from "../models/languages";
import { setActiveProjectPath } from "../models/projects";
import { useStorePersistedState } from "../store";
import { RuleResults } from "./RuleResults";
import { createPortal } from "react-dom";

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

  const onChange = useDebouncedCallback(
    useCallback((ruleString: string | undefined) => {
      if (ruleString) {
        setInput(ruleString.trim());
      }
    }, []),
    200,
  );

  const queryKey = useMemo(
    () => ["scan-results", path, languageId, input],
    [path, languageId, input],
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
          <ProjectHeader
            path={path}
            languageId={languageId}
            onChangeLanguageId={setLanguageId}
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
          <RuleResults
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

function ProjectHeader({
  path,
  languageId,
  onChangeLanguageId,
}: Props & {
  languageId: LanguageId;
  onChangeLanguageId: (languageId: LanguageId) => void;
}) {
  const { data: homedir } = useSuspenseQuery({
    queryKey: ["homeDir"],
    queryFn: () => homeDir(),
  });

  const pathRelativeToHome = path.replace(homedir, "~");

  return (
    <div className="p-2 pr-0 border-b flex justify-between">
      <Button
        onClick={handleOpenProject}
        variant="ghost"
        className="flex items-center gap-3 text-sm font-medium"
      >
        {pathRelativeToHome}
        <FaRegFolder className="w-4 h-4" />
      </Button>

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
  );

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

const DEFAULT_RULE = `
rule:
  pattern: React.useMemo($FN, $DEPS)
`.trim();
