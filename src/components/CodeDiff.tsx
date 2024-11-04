import { Button } from "@/components/ui/button";
import { isTruthy } from "@/lib/isTruthy";
import { SHIKI_THEME } from "@/lib/shiki";
import { diffLines } from "diff";
import { type ElementContent } from "hast";
import { Fragment, memo, useEffect, useMemo, useState } from "react";
import { VscReplaceAll } from "react-icons/vsc";
import { useInView } from "react-intersection-observer";
import { codeToHast, hastToHtml } from "shiki";
import invariant from "tiny-invariant";
import { SGResult } from "../types";
import { animate } from "framer-motion";

type Props = {
  change: SGResult;
  // TODO: extract out this type
  replaceBytes: (replacements: Record<string, SGResult[]>) => Promise<unknown>;
};

export const CodeDiff = memo(({ change, replaceBytes }: Props) => {
  const isReplacement = !!change.replacement;
  const [highlighted, setHighlighted] = useState("");
  const skipHighlighting = change.lines.length > 2000;

  const [ref, isInView] = useInView();

  type DiffLine = { bl?: number; al?: number; dt?: string; value: string };

  /**
   * Compute line diffs and decorate with information about before/after line numbers and whether it's an add or minus.
   */
  const lines = useMemo<DiffLine[]>(() => {
    if (!isReplacement) {
      let lineNo = change.range.start.line + 1;

      return change.lines
        .split("\n")
        .map((text, index) => ({ bl: lineNo + index, value: text }));
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

    const diffedLines: DiffLine[] = [];

    for (const change of lineChanges) {
      const changedLines = change.value.replace(/\n$/, "").split("\n");

      for (const changedLine of changedLines) {
        if (change.added) {
          rightLineNo++;
          diffedLines.push({ al: rightLineNo, dt: "+", value: changedLine });
        } else if (change.removed) {
          leftLineNo++;
          diffedLines.push({ bl: leftLineNo, dt: "-", value: changedLine });
        } else {
          leftLineNo++;
          rightLineNo++;
          diffedLines.push({
            bl: leftLineNo,
            al: rightLineNo,
            value: changedLine,
          });
        }
      }
    }

    return diffedLines;
  }, [isReplacement, change]);

  const [haveLinesChanged, setHaveLinesChanged] = useState(false);
  useEffect(() => {
    setHaveLinesChanged(true);
  }, [lines]);

  /**
   * When code comes into view, run it thru a code -> HAST -> HTML transformation.
   * We use the line diff information from above to decorate the HAST with line numbers and diff types.
   */
  useEffect(() => {
    if (!isInView || skipHighlighting || (highlighted && !haveLinesChanged))
      return;

    (async function () {
      try {
        const hast = await codeToHast(
          lines.map(({ value }) => value).join("\n"),
          {
            lang: "typescript",
            theme: SHIKI_THEME,
          },
        );

        const pre = hast.children[0];
        invariant(pre.type === "element");
        const code = pre.children[0];
        invariant(code.type === "element");

        code.properties["data-is-replacement"] = isReplacement;

        const children: ElementContent[] = code.children
          .filter((el) => !(el.type === "text" && el.value === "\n"))
          .flatMap((el, index) => {
            const { bl, al, dt } = lines[index] ?? {};

            if (el.type === "element") {
              el.properties["data-diff-type"] = dt;
            }

            return [
              {
                type: "element",
                tagName: "span",
                properties: { className: "line-numbers" },
                children: [
                  {
                    type: "element" as const,
                    tagName: "span",
                    properties: {},
                    children: [
                      {
                        type: "text" as const,
                        value: typeof bl === "number" ? String(bl) : "",
                      },
                    ],
                  },
                  isReplacement && {
                    type: "element" as const,
                    tagName: "span",
                    properties: {},
                    children: [
                      {
                        type: "text" as const,
                        value: typeof al === "number" ? String(al) : "",
                      },
                    ],
                  },
                ].filter(isTruthy),
              },
              el,
            ];
          });

        code.children = children;

        setHighlighted(hastToHtml(hast));
        setHaveLinesChanged(false);
      } catch (err) {
        console.error(err);
      }
    })();
  }, [isInView, highlighted, haveLinesChanged]);

  return (
    <div
      className="relative exiting-element"
      ref={ref}
      style={{ viewTransitionName: `code-diff-${change.id}` }}
    >
      {getBody()}

      {isReplacement && (
        <Button
          className="absolute right-2 bottom-2"
          size="icon"
          variant="ghost"
          onClick={(evt) => {
            if (!change.replacement) return;

            const exitingElement =
              evt.currentTarget.closest(".exiting-element");
            if (exitingElement instanceof HTMLElement) {
              exitingElement.style.viewTransitionName = "exiting";
            }

            replaceBytes({
              [change.file]: [change],
            });
          }}
        >
          <VscReplaceAll />
        </Button>
      )}
    </div>
  );

  function getBody() {
    if (isInView && highlighted && !skipHighlighting) {
      return <div dangerouslySetInnerHTML={{ __html: highlighted }} />;
    }

    return (
      <pre className="shiki bg-[#2d353b] text-[#d3c6aa]">
        <code data-is-replacement={isReplacement}>
          {lines.map(({ bl, al, dt, value }, index) => (
            <Fragment key={index}>
              <div className="line-numbers">
                {<span>{bl}</span>}
                {isReplacement && <span>{al}</span>}
              </div>
              <div className="line" key={index} data-diff-type={dt}>
                {value}
              </div>
            </Fragment>
          ))}
        </code>
      </pre>
    );
  }
});
