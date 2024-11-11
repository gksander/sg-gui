import { loader } from "@monaco-editor/react";
import { shikiToMonaco } from "@shikijs/monaco";
import { createHighlighter } from "shiki";

export const SHIKI_THEME = "everforest-dark";

export async function initMonacoWithShiki() {
  const monaco = await loader.init();
  monaco.languages.register({ id: "yaml" });
  const monacoHighlighter = await createHighlighter({
    langs: ["yaml"],
    themes: [SHIKI_THEME],
  });

  shikiToMonaco(monacoHighlighter, monaco);
}
