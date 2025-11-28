import { createReadStream } from "node:fs";
import Papa from "papaparse";
import { CSVParseError } from "../errors/index.js";

export interface CSVRow {
  [header: string]: string;
}

export interface ParseResult {
  data: Array<CSVRow>;
  errors: Array<{ row: number; message: string }>;
  meta: {
    fields: Array<string>;
    delimiter: string;
    linebreak: string;
  };
}

export function readCSV(
  filePath: string,
  useHeaders = true
): Promise<ParseResult> {
  return new Promise((resolve, reject) => {
    const stream = createReadStream(filePath);
    const results: Array<CSVRow> = [];
    let detectedHeaders: Array<string> = [];

    Papa.parse(stream, {
      header: useHeaders,
      skipEmptyLines: true,
      transformHeader: (header) => header.trim(),
      delimiter: ";",
      step: (row) => {
        // For SEB multi-account format, detect header rows dynamically
        if (useHeaders && row.meta?.fields) {
          detectedHeaders = row.meta.fields;
        }
        results.push(row.data as CSVRow);
      },
      complete: (parseResults) => {
        resolve({
          data: results,
          errors: parseResults.errors.map((e) => ({
            row: e.row ?? 0,
            message: e.message,
          })),
          meta: {
            fields:
              detectedHeaders.length > 0
                ? detectedHeaders
                : (parseResults.meta.fields ?? []),
            delimiter: parseResults.meta.delimiter,
            linebreak: parseResults.meta.linebreak,
          },
        });
      },
      error: (error) => {
        reject(new CSVParseError(error.message));
      },
    });
  });
}
