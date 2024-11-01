import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getSGResults } from "@/models/sg";
import Editor from "@monaco-editor/react";
import { useMutation, useQuery, useSuspenseQuery } from "@tanstack/react-query";
import { homeDir } from "@tauri-apps/api/path";
import { open } from "@tauri-apps/plugin-dialog";
import { useCallback } from "react";
import { FaRegFolder } from "react-icons/fa";
import { FaCircleExclamation } from "react-icons/fa6";

import { useDebouncedCallback } from "../lib/useDebouncedCallback";
import { LanguageId, LANGUAGES } from "../models/languages";
import { setActiveProjectPath } from "../models/projects";
import { useStorePersistedState } from "../store";
import { RuleResults } from "./RuleResults";
import { invoke } from "@tauri-apps/api/core";
import { queryClient } from "@/queries";

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
  });

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
      <div className="w-[450px] flex flex-col">
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
            options={{
              minimap: { enabled: false },
              scrollBeyondLastLine: false,
            }}
            onChange={onChange}
          />
        </div>

        <StatusBar error={scanError} />
      </div>

      <div className="flex-1 h-full relative">
        <RuleResults results={results} replaceBytes={replaceBytes} />
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
      <button
        onClick={handleOpenProject}
        className="flex items-center gap-2 text-sm font-medium py-1 px-2 hover:bg-gray-100 rounded-md transition-colors"
      >
        {pathRelativeToHome}
        <FaRegFolder className="w-4 h-4" />
      </button>

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
    <div className="p-2 text-xs flex items-start gap-2 w-full shrink-0 bg-red-200">
      <FaCircleExclamation className="w-3 h-3 shrink-0 mt-1" />
      <div className="flex-grow">{error.message}</div>
    </div>
  );
}

const DEFAULT_RULE = `
rule:
  pattern: React.useMemo($FN, $DEPS)
`.trim();
