import { SGResult } from "../types";
import { createHighlighter } from "shiki";
import { transformerNotationDiff } from "@shikijs/transformers";
import { memo, useMemo } from "react";
import { diffLines, createTwoFilesPatch } from "diff";
import ReactDiffViewer from "react-diff-viewer";

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

  const lines = useMemo(() => {
    if (!change.replacement) {
      return change.lines;
    }

    const replacementLines = change.lines.replace(
      change.text,
      change.replacement,
    );

    // console.log(
    //   createTwoFilesPatch(
    //     "original.ts",
    //     "replacement.ts",
    //     change.text,
    //     change.replacement,
    //   ),
    // );

    const lines = diffLines(change.lines, replacementLines);

    // console.log(lines);

    return lines
      .map((line) => {
        if (line.added) {
          return line.value.replace("\n", `// [!code ++]\n`);
        }
        if (line.removed) {
          return line.value.replace("\n", ` // [!code --]\n`);
        }

        return line.value;
      })
      .join("");
  }, [change]);

  console.log(change.text);
  console.log(change.replacement);

  // console.log(lines);

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
        __html: highlighter.codeToHtml(lines, {
          lang: "typescript",
          // themes: ["github-dark"],
          transformers: [transformerNotationDiff()],
          theme: "ayu-dark",
        }),
      }}
    />
  );
});
