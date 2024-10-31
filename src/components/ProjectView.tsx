import Editor from "@monaco-editor/react";
import { useCallback, useState } from "react";
import { useDebouncedCallback } from "../utils/useDebouncedCallback";
import { ProjectHeader } from "./ProjectHeader";
import { RuleResults } from "./RuleResults";
import { LanguageId } from "../models/languages";
import { LanguageSelector } from "./LanguageSelector";

type Props = {
  path: string;
};

export function ProjectView({ path }: Props) {
  const [input, setInput] = useState(DEFAULT_RULE);

  const [languageId, setLanguageId] = useState<LanguageId>("tsx");

  console.log(languageId);

  const onChange = useDebouncedCallback(
    useCallback((ruleString: string | undefined) => {
      if (ruleString) {
        setInput(ruleString.trim());
      }
    }, []),
    500,
  );

  return (
    <div className="h-screen overflow-hidden flex flex-col">
      <ProjectHeader path={path} />
      <div className="flex flex-row flex-1">
        <div className="flex-1 h-full overflow-auto relative">
          <LanguageSelector languageId={languageId} onChange={setLanguageId} />
          <Editor
            height="100%"
            language="yaml"
            defaultValue={input}
            options={{
              minimap: { enabled: false },
            }}
            onChange={onChange}
          />
        </div>

        <div className="flex-1 h-full relative">
          <RuleResults path={path} rule={input} languageId={languageId} />
        </div>
      </div>
    </div>
  );
}

const DEFAULT_RULE = `
rule:
  pattern: React.useMemo($FN, $DEPS)
`.trim();
