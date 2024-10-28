export interface SGResult {
  text: string;
  range: {
    byteOffset: {
      start: number;
      end: number;
    };
    start: {
      line: number;
      column: number;
    };
    end: {
      line: number;
      column: number;
    };
  };
  file: string;
  lines: string;
  charCount: {
    leading: number;
    trailing: number;
  };
  replacement?: string;
  replacementOffsets?: {
    start: number;
    end: number;
  };
  language: string;
}
