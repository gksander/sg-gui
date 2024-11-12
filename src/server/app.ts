import { homedir } from "node:os";
import * as path from "node:path";
import * as fs from "node:fs/promises";
import { execa } from "execa";
import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import yaml from "js-yaml";
import type { FormattedLine, SgGuiResultItem, SGResultRow } from "@/types.js";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { diffLines } from "diff";

const apiRoutes = new Hono()
  /**
   * Get cwd of process to determine what project path we're looking at
   */
  .get("/cwd", async (c) => {
    return c.json({
      // TODO: how to configure in dev...
      cwd: process.cwd(),
      // cwd: path.resolve(homedir(), "GitHub", "react-use"),
    });
  })
  /**
   * Get the homedir for user for prettying up some paths in the UI
   */
  .get("/homedir", (c) => {
    return c.json({
      homedir: homedir(),
    });
  })
  /**
   * Check that `sg` is installed and can be executed
   */
  .get("/sg-check", async (c) => {
    const res = await execa`sg --version`.catch(() => ({ stderr: "error" }));

    return c.json({
      installed:
        !res.stderr && "stdout" in res && res.stdout.includes("ast-grep"),
    });
  })
  /**
   * Execute ast-grep query and return results
   */
  .post(
    "/exec-sg-query",
    zValidator(
      "json",
      z.object({
        projectPath: z.string(),
        query: z.string(),
        language: z.string(),
        pathGlobs: z.string().optional().default(""),
      }),
    ),
    async (c) => {
      const validated = c.req.valid("json");
      const { projectPath, query, language, pathGlobs } = validated;

      const ruleJson = (await yaml.load(query)) as Record<string, unknown>;
      if (typeof ruleJson !== "object" || ruleJson === null) {
        throw new HTTPException(400, { message: "Invalid rule." });
      }

      ruleJson.id = "default-rule";
      ruleJson.language = language;

      const execResponse = await execa({ cwd: projectPath })`sg ${[
        "scan",
        "--inline-rules",
        JSON.stringify(ruleJson),
        "--globs",
        pathGlobs,
        "--json=compact",
      ]}`;

      // TODO: error handling

      const outputJson = JSON.parse(execResponse.stdout) as SGResultRow[];

      const sgGuiResults = outputJson.map<SgGuiResultItem>((row) => {
        return {
          id: `${row.file.replace(/\W/g, "")}-${row.range.byteOffset.start}-${row.range.byteOffset.end}`,
          formattedLines: linesToFormattedLines({
            lines: row.lines,
            startLineNo: row.range.start.line + 1,
            text: row.text,
            replacement: row.replacement,
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
      const results = Object.entries(fileResultsHash).sort(([a], [b]) =>
        a.localeCompare(b),
      );

      return c.json(results);
    },
  )
  .post(
    "/replace-bytes",
    zValidator(
      "json",
      z.object({
        projectPath: z.string(),
        replacements: z.record(
          z.array(z.tuple([z.number(), z.number(), z.string()])),
        ),
      }),
    ),
    async (c) => {
      const validated = c.req.valid("json");
      const { projectPath, replacements } = validated;

      for (const [file, bytesToReplace] of Object.entries(replacements)) {
        const filePath = path.resolve(projectPath, file);
        let fileBuffer = await fs.readFile(filePath);

        let srcResidual = 0;
        let dstResidual = 0;

        for (const [
          byteOffsetStart,
          byteOffsetEnd,
          replacement,
        ] of bytesToReplace) {
          const start = byteOffsetStart + dstResidual - srcResidual;
          const end = byteOffsetEnd + dstResidual - srcResidual;

          const replacementBytes = Buffer.from(replacement);

          // TODO: how do we slice without creating new buffers...?
          fileBuffer = Buffer.concat([
            fileBuffer.slice(0, start),
            replacementBytes,
            fileBuffer.slice(end),
          ]);

          srcResidual += byteOffsetEnd - byteOffsetStart;
          dstResidual += replacementBytes.length;
        }

        await fs.writeFile(filePath, fileBuffer);
      }

      return c.json({
        success: true,
      });
    },
  );

function linesToFormattedLines({
  lines,
  startLineNo,
  text,
  replacement,
}: {
  lines: string;
  text: string;
  replacement?: string;
  startLineNo: number;
}): FormattedLine[] {
  if (!replacement) {
    return lines.split("\n").map<FormattedLine>((line, i) => {
      return {
        bln: startLineNo + i,
        val: line,
      };
    });
  }

  // TODO: not sure .replace is really the proper approach here, should probably use byte offsets
  const replacementLines = lines.replace(text, replacement);
  const lineChanges = diffLines(lines, replacementLines);
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

export const createApp = () => {
  const app = new Hono();
  app.route("/api", apiRoutes);

  return app;
};

export type ApiRoutes = typeof apiRoutes;
