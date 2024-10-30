import { SGResult } from "../types";
import { createHighlighter } from "shiki";
import { transformerNotationDiff } from "@shikijs/transformers";
import { memo } from "react";

const highlighter = await createHighlighter({
  langs: ["typescript"],
  themes: ["ayu-dark"],
});

type Props = {
  change: SGResult;
};

export const CodeDiff = memo(({ change }: Props) => {
  const ogLines = change.text.split("\n");
  const newLines = change.replacement?.split("\n") ?? [];

  const diffLines = change.text;

  return <pre>{diffLines}</pre>;

  // const diffLines = !change.replacement
  //   ? change.text
  //   : ogLines
  //       .flatMap((line, index) => {
  //         if (line === newLines[index]) {
  //           return line;
  //         }

  //         return [`${line} // [!code --]`, `${newLines[index]} // [!code ++]`];
  //       })
  //       .join("\n");

  return (
    <span
      dangerouslySetInnerHTML={{
        __html: highlighter.codeToHtml(diffLines, {
          lang: "typescript",
          // themes: ["github-dark"],
          transformers: [transformerNotationDiff()],
          theme: "ayu-dark",
        }),
      }}
    />
  );
});
