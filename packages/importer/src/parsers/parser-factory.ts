import { readFileSync } from "node:fs";
import { UnsupportedBankError } from "../errors/index.js";
import type { BaseParser } from "./base-parser.js";
import { SebLtParser } from "./seb-lt-parser.js";

const PARSERS: Array<BaseParser> = [new SebLtParser()];

export async function getParser(filePath: string): Promise<BaseParser> {
  // Read file to detect format - different parsers may have different detection strategies
  const content = readFileSync(filePath, "utf-8");
  const firstLines = content.split("\n").slice(0, 10);

  // Check each parser
  for (const parser of PARSERS) {
    // For SEB, check if file has the characteristic header pattern
    if (parser.bankCode === "SEB") {
      // Check for Lithuanian format
      const hasLithuanianPattern = firstLines.some(
        (line) =>
          line.includes("SĄSKAITOS") &&
          line.includes("IŠRAŠAS") &&
          firstLines.some(
            (l) => l.includes("DOK NR.") && l.includes("DEBETAS/KREDITAS")
          )
      );
      // Check for English format
      const hasEnglishPattern = firstLines.some(
        (line) =>
          line.includes("ACCOUNT") &&
          line.includes("STATEMENT") &&
          firstLines.some(
            (l) => l.includes("INSTRUCTION ID") && l.includes("DEBIT/CREDIT")
          )
      );
      if (hasLithuanianPattern || hasEnglishPattern) {
        return parser;
      }
    }
  }

  throw new UnsupportedBankError(
    `No parser found for file: ${filePath}. Unable to detect bank format.`
  );
}
