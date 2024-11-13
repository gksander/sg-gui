export interface SgGuiResultItem {
  id: string;
  formattedLines: FormattedLine[];
  byteStart: number;
  byteEnd: number;
  replacement?: string;
  file: string; // Could theoretically kill this.
}

export type FormattedLine = {
  bln?: number;
  aln?: number;
  sign?: string;
  val: string;
};

export interface SGResultRow {
  text: string;
  range: Range;
  file: string;
  lines: string;
  replacement: string;
  replacementOffsets: ReplacementOffsets;
  language: string;
  charCount: CharCount;
}

interface Range {
  byteOffset: ReplacementOffsets;
  start: End;
  end: End;
}

export interface ReplacementOffsets {
  start: number;
  end: number;
}

interface End {
  line: number;
  column: number;
}

export interface CharCount {
  leading: number;
  trailing: number;
}
