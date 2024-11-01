import {
  transformerNotationDiff,
  transformerRemoveLineBreak,
} from "@shikijs/transformers";
import { diffLines } from "diff";
import { type Element, type Text } from "hast";
import { memo } from "react";
import { createHighlighter, ShikiTransformer } from "shiki";
import { SGResult } from "../types";

const THEME = "catppuccin-latte";

const highlighter = await createHighlighter({
  langs: ["typescript"],
  themes: [THEME],
});

type Props = {
  change: SGResult;
};

export const CodeDiff = memo(({ change }: Props) => {
  let leftLineNo = change.range.start.line;
  let rightLineNo = change.range.start.line;
  const lineChanges = diffLines(
    change.lines,
    change.replacement
      ? change.lines.replace(change.text, change.replacement)
      : change.lines,
  );
  const diffedLines: string[] = [];

  for (const change of lineChanges) {
    const changedLines = change.value.replace(/\n$/, "").split("\n");

    for (const changedLine of changedLines) {
      if (change.added) {
        rightLineNo++;
        diffedLines.push(`${changedLine} //[bl:;al:${rightLineNo};dt:+]`);
      } else if (change.removed) {
        leftLineNo++;
        diffedLines.push(`${changedLine} //[bl:${leftLineNo};al:;dt:-]`);
      } else {
        leftLineNo++;
        rightLineNo++;
        diffedLines.push(
          `${changedLine} //[bl:${leftLineNo};al:${rightLineNo};dt: ]`,
        );
      }
    }
  }

  return (
    <span
      dangerouslySetInnerHTML={{
        __html: highlighter.codeToHtml(diffedLines.join("\n"), {
          lang: "typescript",
          transformers: [
            transformerNotationDiff(),
            transformerRemoveLineBreak(),
            LineDiffTransformer,
          ],
          theme: THEME,
        }),
      }}
    />
  );
});

const LineDiffTransformer: ShikiTransformer = {
  line: (node) => {
    const metaNodeValue = (
      (node.children.at(-1) as Element)?.children?.at(0) as Text
    )?.value;

    if (!metaNodeValue) {
      return;
    }

    const match = metaNodeValue.match(/\[bl:(\d*);al:(\d*);dt:(.*)\]/);

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
};
