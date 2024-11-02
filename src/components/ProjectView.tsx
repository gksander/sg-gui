import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getSGResults } from "@/models/sg";
import Editor from "@monaco-editor/react";
import {
  keepPreviousData,
  useMutation,
  useQuery,
  useSuspenseQuery,
} from "@tanstack/react-query";
import { homeDir } from "@tauri-apps/api/path";
import { open } from "@tauri-apps/plugin-dialog";
import { useCallback } from "react";
import { FaRegFolder } from "react-icons/fa";
import { FaCircleExclamation } from "react-icons/fa6";

import { Button } from "@/components/ui/button";
import { SHIKI_THEME } from "@/lib/shiki";
import { queryClient } from "@/queries";
import { invoke } from "@tauri-apps/api/core";
import { useDebouncedCallback } from "../lib/useDebouncedCallback";
import { LanguageId, LANGUAGES } from "../models/languages";
import { setActiveProjectPath } from "../models/projects";
import { useStorePersistedState } from "../store";
import { RuleResults } from "./RuleResults";

type Props = {
  path: string;
};

export function ProjectView({ path }: Props) {
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
    500,
  );

  const { data: results, error: scanError } = useQuery({
    // TODO: extract out
    queryKey: ["scan-results", languageId, input],
    queryFn: () => getSGResults({ path, rule: input, languageId }),
    gcTime: 0,
    retry: 0,
    placeholderData: keepPreviousData,
  });

  const isReplacement = !!results?.[0]?.[1]?.[0]?.replacement;

  /**
   * TODO: could theoretically try to slice cache? not sure it's worth it... SG is pretty fuckin' fast
   */
  const { mutateAsync: replaceBytes } = useMutation({
    mutationFn: (replacements: Record<string, [number, number, string][]>) =>
      invoke("replace_bytes_in_files", {
        projectPath: path,
        replacements,
      }),

    onSettled: () =>
      queryClient.invalidateQueries({ queryKey: ["scan-results"] }),
  });

  return (
    <div className="h-screen overflow-hidden flex flex-row">
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
            }}
            onChange={onChange}
          />
        </div>

        <StatusBar error={scanError} />
      </div>

      <div className="flex-1 h-full relative">
        <RuleResults
          results={results}
          isReplacement={isReplacement}
          replaceBytes={replaceBytes}
        />
      </div>
    </div>
  );
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

function StatusBar({ error }: { error?: Error | null }) {
  if (!error) {
    return null;
  }

  return (
    <div className="p-2 text-xs flex items-start gap-2 w-full shrink-0 bg-red-950">
      <FaCircleExclamation className="w-3 h-3 shrink-0 mt-1" />
      <div className="flex-grow">{error.message}</div>
    </div>
  );
}

const DEFAULT_RULE = `
rule:
  pattern: React.useMemo($FN, $DEPS)
`.trim();
