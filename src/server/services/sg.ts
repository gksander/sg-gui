import { execa } from "execa";
import { HTTPException } from "hono/http-exception";
import yaml from "js-yaml";
import type {
  CharCount,
  FormattedLine,
  SgGuiResultItem,
  SGResultRow,
} from "@/types.js";
import { z } from "zod";
import { StatusCode } from "hono/utils/http-status";
import { diffLines } from "diff";

export const execSgQueryArgsSchema = z.object({
  projectPath: z.string(),
  query: z.string(),
  language: z.string(),
  pathGlobs: z.string().optional().default(""),
});

type ExecSgQueryArgs = z.infer<typeof execSgQueryArgsSchema>;

export async function execSgQuery(args: ExecSgQueryArgs) {
  const { projectPath, query, language, pathGlobs } = args;

  const ruleJson = (await yaml.load(query)) as Record<string, unknown>;
  if (typeof ruleJson !== "object" || ruleJson === null) {
    throwHttpException(400, "Invalid rule.");
  }

  ruleJson.id = "default-rule";
  ruleJson.language = language;

  const execResponse = await execa({
    cwd: projectPath,
    reject: false,
  })`sg ${[
    "scan",
    "--inline-rules",
    JSON.stringify(ruleJson),
    "--globs",
    pathGlobs,
    "--json=compact",
  ]}`;

  if (execResponse.failed) {
    const lastLine =
      execResponse.stderr.split("\n").filter(Boolean).at(-1) ?? "";
    const lastLineStripped = lastLine
      // eslint-disable-next-line no-control-regex
      ?.replace(/\x1B\[[0-?]*[ -/]*[@-~]/g, "")
      .replace(/╰▻ /g, "");

    throwHttpException(400, lastLineStripped);
  }

  const outputJson = JSON.parse(execResponse.stdout) as SGResultRow[];

  const sgGuiResults = outputJson.map<SgGuiResultItem>((row) => {
    return {
      id: `${row.file.replace(/\W/g, "")}-${row.range.byteOffset.start}-${row.range.byteOffset.end}`,
      formattedLines: linesToFormattedLines({
        lines: row.lines,
        startLineNo: row.range.start.line + 1,
        replacement: row.replacement,
        charCount: row.charCount,
      }),
      byteStart: row.range.byteOffset.start,
      byteEnd: row.range.byteOffset.end,
      file: row.file,
      replacement: row.replacement,
    };
  });

  const fileResultsHash: Record<string, SgGuiResultItem[]> = {};

  // Group results by file
  for (const result of sgGuiResults) {
    if (!(result.file in fileResultsHash)) {
      fileResultsHash[result.file] = [];
    }
    fileResultsHash[result.file].push(result);
  }
  // Sort results within by byteStart
  for (const file in fileResultsHash) {
    if (fileResultsHash[file].length <= 1) {
      continue;
    }

    fileResultsHash[file].sort((a, b) => a.byteStart - b.byteStart);
  }

  // Order results by file
  return Object.entries(fileResultsHash).sort(([a], [b]) => a.localeCompare(b));
}

function linesToFormattedLines({
  lines,
  startLineNo,
  replacement,
  charCount,
}: {
  lines: string;
  replacement?: string;
  startLineNo: number;
  charCount: CharCount;
}): FormattedLine[] {
  if (!replacement) {
    return lines.split("\n").map<FormattedLine>((line, i) => {
      return {
        bln: startLineNo + i,
        val: line,
      };
    });
  }

  const replacementLines =
    lines.slice(0, charCount.leading) +
    replacement +
    lines.slice(-charCount.trailing);

  const lineChanges = diffLines(lines, replacementLines, {
    ignoreWhitespace: true,
  });
  let leftLineNo = startLineNo;
  let rightLineNo = startLineNo;

  const diffedLines: FormattedLine[] = [];

  for (const change of lineChanges) {
    const changedLines = change.value.replace(/\n$/, "").split("\n");

    for (const changedLine of changedLines) {
      if (change.added) {
        rightLineNo++;
        diffedLines.push({ aln: rightLineNo, sign: "+", val: changedLine });
      } else if (change.removed) {
        leftLineNo++;
        diffedLines.push({ bln: leftLineNo, sign: "-", val: changedLine });
      } else {
        leftLineNo++;
        rightLineNo++;
        diffedLines.push({
          bln: leftLineNo,
          aln: rightLineNo,
          val: changedLine,
        });
      }
    }
  }

  return diffedLines;
}

function throwHttpException(statusCode: StatusCode, message: string) {
  const response = new Response(message, {
    status: statusCode,
  });

  throw new HTTPException(statusCode, { res: response });
}
