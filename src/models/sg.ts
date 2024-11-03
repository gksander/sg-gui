import { Command } from "@tauri-apps/plugin-shell";
import jsYaml from "js-yaml";
import { SGResult } from "../types";
import { LanguageId, LANGUAGES } from "./languages";

export async function getSGResults({
  path,
  rule,
  languageId,
}: {
  path: string;
  rule: string;
  languageId: LanguageId;
}) {
  const ruleJson = jsYaml.load(rule) as Record<string, unknown>;

  if (!ruleJson.id) {
    ruleJson.id = "default-rule";
  }
  ruleJson.language = LANGUAGES[languageId].sgLanguage;

  const command = Command.create(
    "sg",
    [
      "scan",
      "--inline-rules",
      JSON.stringify(ruleJson),
      "--json=compact",
      "--context=3",
    ],
    {
      cwd: path,
    },
  );

  const { stderr, stdout } = await command.execute();

  if (stderr) {
    const lastLine = stderr.split("\n").filter(Boolean).at(-1);
    const lastLineStripped = lastLine
      ?.replace(/\x1B\[[0-?]*[ -/]*[@-~]/g, "")
      .replace(/╰▻ /g, "");

    throw new Error(lastLineStripped);
  }

  const rawResults = JSON.parse(stdout) as SGResult[];

  const fileResults = rawResults.reduce<Record<string, SGResult[]>>(
    (acc, result) => {
      result.id = `${result.file}:${result.range.byteOffset.start}:${result.range.byteOffset.end}`;

      if (!acc[result.file]) {
        acc[result.file] = [result];
        return acc;
      }

      const enteringByteOffset = result.range.byteOffset.start;
      const insertIndex = acc[result.file].findIndex((otherResult) => {
        return otherResult.range.byteOffset.start > enteringByteOffset;
      });

      if (insertIndex !== -1) {
        acc[result.file].splice(insertIndex, 0, result);
      } else {
        acc[result.file].push(result);
      }

      return acc;
    },
    {},
  );

  const orderedResults = Object.entries(fileResults).sort((a, b) =>
    a[0].localeCompare(b[0]),
  );

  return orderedResults;
}
