import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Editor from "@monaco-editor/react";
import { ChevronLeftIcon } from "@radix-ui/react-icons";
import { useSuspenseQuery } from "@tanstack/react-query";
import { homeDir } from "@tauri-apps/api/path";
import { useCallback } from "react";
import { LanguageId, LANGUAGES } from "../models/languages";
import { setActiveProjectPath } from "../models/projects";
import { useStorePersistedState } from "../store";
import { useDebouncedCallback } from "../lib/useDebouncedCallback";
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

  return (
    <div className="h-screen overflow-hidden flex flex-row">
      <div className="w-[450px] flex flex-col">
        <ProjectHeader
          path={path}
          languageId={languageId}
          onChangeLanguageId={setLanguageId}
        />
        <div className="flex-grow">
          <Editor
            height="100%"
            language="yaml"
            theme="vs-dark"
            defaultValue={input}
            options={{
              minimap: { enabled: false },
            }}
            onChange={onChange}
          />
        </div>

        <StatusBar />
      </div>

      <div className="flex-1 h-full relative">
        <RuleResults path={path} rule={input} languageId={languageId} />
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
    <div className="p-2 border-b flex justify-between">
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="icon"
          onClick={() => setActiveProjectPath(null)}
          aria-label="Clear active project"
        >
          <ChevronLeftIcon className="w-4 h-4" />
        </Button>
        <div className="text-sm font-medium">{pathRelativeToHome}</div>
      </div>

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
}

function StatusBar() {
  return <div>Status...</div>;
}

const DEFAULT_RULE = `
rule:
  pattern: React.useMemo($FN, $DEPS)
`.trim();
