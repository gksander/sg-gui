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
  replacement_offsets: ReplacementOffsets;
  language: string;
}

interface Range {
  byteOffset: ReplacementOffsets;
  start: End;
  end: End;
}

interface ReplacementOffsets {
  start: number;
  end: number;
}

interface End {
  line: number;
  column: number;
}
