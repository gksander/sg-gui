import { Button } from "@/client/components/ui/button";
import { isTruthy } from "@/client/lib/isTruthy";
import { SHIKI_THEME } from "@/client/lib/shiki";
import { LanguageId, LANGUAGES } from "@/client/lib/languages";
import { type ElementContent } from "hast";
import { memo, useEffect, useState } from "react";
import { VscReplaceAll } from "react-icons/vsc";
import { useInView } from "react-intersection-observer";
import { codeToHast, hastToHtml } from "shiki";
import invariant from "tiny-invariant";
import type { SgGuiResultItem } from "@/types";
import { motion } from "framer-motion";

type Props = {
  change: SgGuiResultItem;
  languageId: LanguageId;
  exiting: boolean;
  onReplace?: () => void;
};

export const CodeSnippet = memo(
  ({ change, languageId, exiting, onReplace }: Props) => {
    const isReplacement = !!change.replacement;
    const [highlighted, setHighlighted] = useState("");
    const skipHighlighting = change.formattedLines.length > 2000;

    const [ref, isInView] = useInView();

    const [haveLinesChanged, setHaveLinesChanged] = useState(false);
    useEffect(() => {
      setHaveLinesChanged(true);
    }, [change.formattedLines]);

    /**
     * When code comes into view, run it thru a code -> HAST -> HTML transformation.
     * We use the line diff information from above to decorate the HAST with line numbers and diff types.
     */
    const language = LANGUAGES[languageId]?.shikiId;
    useEffect(() => {
      if (!isInView || skipHighlighting || (highlighted && !haveLinesChanged))
        return;

      (async function () {
        try {
          const lines = change.formattedLines;
          const hast = await codeToHast(
            lines.map(({ val }) => val).join("\n"),
            {
              lang: language,
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
              const { bln, aln, sign } = lines[index] ?? {};

              if (el.type === "element") {
                el.properties["data-diff-type"] = sign;
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
                          value: typeof bln === "number" ? String(bln) : "",
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
                          value: typeof aln === "number" ? String(aln) : "",
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
    }, [
      isInView,
      highlighted,
      haveLinesChanged,
      language,
      skipHighlighting,
      change.formattedLines,
      isReplacement,
    ]);

    return (
      <motion.div
        className="relative"
        ref={ref}
        exit={exiting ? { height: 0, opacity: 0, x: 100 } : undefined}
        transition={{ duration: 0.2 }}
      >
        {getBody()}

        {isReplacement && (
          <Button
            className="absolute right-2 bottom-2"
            size="icon"
            variant="ghost"
            onClick={onReplace}
          >
            <VscReplaceAll />
          </Button>
        )}
      </motion.div>
    );

    function getBody() {
      if (isInView && highlighted && !skipHighlighting) {
        return <div dangerouslySetInnerHTML={{ __html: highlighted }} />;
      }

      return (
        <pre
          className="shiki bg-background-alt"
          style={{ height: `${change.formattedLines.length * 2}rem` }}
        />
      );
    }
  },
);
