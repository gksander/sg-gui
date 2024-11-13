import { z } from "zod";
import * as path from "node:path";
import * as fs from "node:fs/promises";

export const replaceBytesArgsSchema = z.object({
  projectPath: z.string(),
  replacements: z.record(
    z.array(z.tuple([z.number(), z.number(), z.string()])),
  ),
});

export async function replaceBytes(
  args: z.infer<typeof replaceBytesArgsSchema>,
) {
  const { projectPath, replacements } = args;

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

      // Don't think there's a way to splice without creating intermediate buffers.
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
}
