import { SGResult } from "../types";
import { createHighlighter } from "shiki";
import { type Element, type Text } from "hast";
import {
  transformerNotationDiff,
  transformerRemoveLineBreak,
} from "@shikijs/transformers";
import { memo, useMemo } from "react";
import { diffLines, createTwoFilesPatch } from "diff";
import ReactDiffViewer from "react-diff-viewer";

const THEME = "catppuccin-latte";

const highlighter = await createHighlighter({
  langs: ["typescript"],
  themes: [THEME],
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

    const lineDiffs = diffLines(change.lines, replacementLines);
    // console.log(lineDiffs);

    return diffLines(change.lines, replacementLines, {
      // newlineIsToken: true,
      ignoreWhitespace: true,
      // ignoreCase: false,
    })
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

  // return (
  //   <ReactDiffViewer
  //     oldValue={change.lines}
  //     newValue={change.lines.replace(change.text, change.replacement!)}
  //     splitView={false}
  //   />
  // );

  // console.log(change.text);
  // console.log(change.replacement);

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

  const diffText = createCodeDiff({
    oldText: change.lines,
    newText: change.lines.replace(change.text, change.replacement!),
    startLineNo: change.range.start.line,
  });

  // return (
  //   <pre
  //     className="text-xs"
  //     dangerouslySetInnerHTML={{
  //       __html: diffText,
  //     }}
  //   />
  // );

  return (
    <span
      dangerouslySetInnerHTML={{
        __html: highlighter.codeToHtml(diffText, {
          lang: "typescript",
          transformers: [
            transformerNotationDiff(),
            transformerRemoveLineBreak(),
            {
              line: (node) => {
                const metaNodeValue = (
                  (node.children.at(-1) as Element)?.children?.at(0) as Text
                )?.value;

                if (!metaNodeValue) {
                  return;
                }

                const match = metaNodeValue.match(
                  /\[bl:(\d*);al:(\d*);dt:(.*)\]/,
                );

                if (!match) {
                  return;
                }

                const [, beforeLineNo, afterLineNo, diffType] = match;

                if (beforeLineNo) {
                  node.properties["data-line-no-before"] = beforeLineNo;
                }
                if (afterLineNo) {
                  node.properties["data-line-no-after"] = afterLineNo;
                }
                if (diffType) {
                  node.properties["data-diff-type"] = diffType;
                }

                // TODO: Can't just pop this... if there's a comment at end of line, it removes all of it...
                node.children.pop();
              },
            },
          ],
          theme: THEME,
        }),
      }}
    />
  );
});

function createCodeDiff({
  oldText,
  newText,
  startLineNo = 1,
}: {
  oldText: string;
  newText: string;
  startLineNo?: number;
}) {
  const lines: string[] = [];

  function make_row(
    x: number | "",
    y: number | "",
    type: " " | "+" | "-",
    text: string,
  ) {
    return lines.push(`${text}//[bl:${y};al:${x};dt:${type}]`);
  }

  function get_diff(
    matrix: number[][],
    a1: string[],
    a2: string[],
    x: number,
    y: number,
  ) {
    if (x > 0 && y > 0 && a1[y - 1] === a2[x - 1]) {
      get_diff(matrix, a1, a2, x - 1, y - 1);
      make_row(x, y, " ", a1[y - 1]);
    } else {
      if (x > 0 && (y === 0 || matrix[y][x - 1] >= matrix[y - 1][x])) {
        get_diff(matrix, a1, a2, x - 1, y);
        make_row(x, "", "+", a2[x - 1]);
      } else if (y > 0 && (x === 0 || matrix[y][x - 1] < matrix[y - 1][x])) {
        get_diff(matrix, a1, a2, x, y - 1);
        make_row("", y, "-", a1[y - 1]);
      } else {
        return;
      }
    }
  }

  function diff(a1: string[], a2: string[]) {
    const matrix = new Array(a1.length + 1);
    let x = 0;
    let y = 0;

    for (y = 0; y < matrix.length; y++) {
      matrix[y] = new Array(a2.length + 1);

      for (x = 0; x < matrix[y].length; x++) {
        matrix[y][x] = 0;
      }
    }

    for (y = 1; y < matrix.length; y++) {
      for (x = 1; x < matrix[y].length; x++) {
        if (a1[y - 1] === a2[x - 1]) {
          matrix[y][x] = 1 + matrix[y - 1][x - 1];
        } else {
          matrix[y][x] = Math.max(matrix[y - 1][x], matrix[y][x - 1]);
        }
      }
    }

    get_diff(matrix, a1, a2, x - 1, y - 1);
  }

  diff(oldText.split("\n"), newText.split("\n"));

  return lines.join("\n");
}
