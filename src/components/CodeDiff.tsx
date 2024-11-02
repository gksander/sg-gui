import { transformerRemoveLineBreak } from "@shikijs/transformers";
import { diffLines } from "diff";
import { type Element, type Text } from "hast";
import { memo } from "react";
import { createHighlighter, ShikiTransformer } from "shiki";
import { SGResult } from "../types";
import { isTruthy } from "@/lib/isTruthy";
import { SHIKI_THEME } from "@/lib/shiki";
import { Button } from "@/components/ui/button";
import { VscReplaceAll } from "react-icons/vsc";

const highlighter = await createHighlighter({
  langs: ["typescript"],
  themes: [SHIKI_THEME],
});

type Props = {
  change: SGResult;
  // TODO: extract out this type
  replaceBytes: (
    replacements: Record<string, [number, number, string][]>,
  ) => Promise<unknown>;
};

export const CodeDiff = memo(({ change, replaceBytes }: Props) => {
  const isReplacement = !!change.replacement;

  return (
    <div className="relative">
      <span
        dangerouslySetInnerHTML={{
          __html: highlighter.codeToHtml(getLines(), {
            lang: "typescript",
            transformers: [
              transformerRemoveLineBreak(),
              LineDiffTransformer(isReplacement),
            ],
            theme: SHIKI_THEME,
          }),
        }}
      />

      {isReplacement && (
        <Button
          className="absolute right-2 bottom-2"
          size="icon"
          variant="ghost"
          onClick={() =>
            change.replacement &&
            replaceBytes({
              [change.file]: [
                [
                  change.range.byteOffset.start,
                  change.range.byteOffset.end,
                  change.replacement,
                ],
              ],
            })
          }
        >
          <VscReplaceAll />
        </Button>
      )}
    </div>
  );

  function getLines() {
    if (!isReplacement) {
      let lineNo = change.range.start.line + 1;

      return change.lines
        .split("\n")
        .map((text, index) => `${text}//[bl:${lineNo + index};al:;dt:]`)
        .join("\n");
    }

    // For diff'ing
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
          diffedLines.push(`${changedLine}//[bl:;al:${rightLineNo};dt:+]`);
        } else if (change.removed) {
          leftLineNo++;
          diffedLines.push(`${changedLine}//[bl:${leftLineNo};al:;dt:-]`);
        } else {
          leftLineNo++;
          rightLineNo++;
          diffedLines.push(
            `${changedLine}//[bl:${leftLineNo};al:${rightLineNo};dt: ]`,
          );
        }
      }
    }

    return diffedLines.join("\n");
  }
});

const LineDiffTransformer: (isReplacement: boolean) => ShikiTransformer = (
  isReplacement,
) => ({
  code(node) {
    node.properties["data-is-replacement"] = isReplacement;
    node.children = node.children.flatMap((childNode) => {
      const isLineNode =
        childNode.type === "element" &&
        childNode.properties["class"] === "line";

      // We'll be careful and add in extra node just in case
      if (!isLineNode) {
        return [
          {
            type: "element",
            tagName: "span",
            properties: {
              className: "line-numbers",
            },
            children: [],
          },
          childNode,
        ];
      }

      const metaNode = (childNode.children.at(-1) as Element)?.children?.at(
        0,
      ) as Text;

      const match = metaNode.value.match(
        /(.*)\/\/\[bl:(\d*);al:(\d*);dt:(.*)\]/,
      );
      const [, lineContent, beforeLineNo, afterLineNo, diffType] = match ?? [];

      if (!lineContent) {
        childNode.children.pop();
      } else {
        metaNode.value = lineContent;
      }

      return [
        {
          type: "element",
          tagName: "span",
          properties: {
            className: "line-numbers",
          },
          children: [
            {
              type: "element" as const,
              tagName: "span",
              properties: {},
              children: [{ type: "text" as const, value: beforeLineNo }],
            },
            isReplacement && {
              type: "element" as const,
              tagName: "span",
              properties: {},
              children: [{ type: "text" as const, value: afterLineNo }],
            },
          ].filter(isTruthy),
        },
        {
          ...childNode,
          properties: {
            ...childNode.properties,
            "data-diff-type": diffType,
          },
        },
      ];
    });
  },
});
