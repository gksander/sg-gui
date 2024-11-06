export interface SgGuiResultItem {
  id: string;
  formattedLines: FormattedLine[];
  byteStart: number;
  byteEnd: number;
  replacement?: string;
  file: string; // Could theoretically kill this.
}

type FormattedLine = {
  bln: number;
  aln: number;
  sign: string;
  val: string;
};
