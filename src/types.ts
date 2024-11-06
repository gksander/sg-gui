export interface SgGuiResultItem {
  id: string;
  formattedLines: FormattedLine[];
  byte_start: number;
  byte_end: number;
  replacement?: string;
  file: string; // Could theoretically kill this.
}

type FormattedLine = {
  bln: number;
  aln: number;
  sign: string;
  val: string;
};
