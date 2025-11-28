import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { BankCode } from "@nodm/financier-types";
import { UnsupportedBankError } from "../../src/errors/index.js";
import { getParser } from "../../src/parsers/parser-factory.js";

describe("parser-factory", () => {
  let testDir: string;

  beforeEach(() => {
    testDir = join(process.cwd(), "test-temp-factory");
    mkdirSync(testDir, { recursive: true });
  });

  afterEach(() => {
    rmSync(testDir, { recursive: true, force: true });
  });

  describe("getParser", () => {
    it("should detect SEB bank format", async () => {
      const csvContent = `"SĄSKAITOS  (LT123456789012345678) IŠRAŠAS (UŽ LAIKOTARPĮ: 2025-01-01-2025-01-31)";
"DOK NR.";"DATA";"VALIUTA";"SUMA";"MOKĖTOJO ARBA GAVĖJO PAVADINIMAS";"MOKĖTOJO ARBA GAVĖJO IDENTIFIKACINIS KODAS";"SĄSKAITA";"KREDITO ĮSTAIGOS PAVADINIMAS";"KREDITO ĮSTAIGOS SWIFT KODAS";"MOKĖJIMO PASKIRTIS";"TRANSAKCIJOS KODAS";"DOKUMENTO DATA";"TRANSAKCIJOS TIPAS";"NUORODA";"DEBETAS/KREDITAS";"SUMA SĄSKAITOS VALIUTA";"SĄSKAITOS NR";"SĄSKAITOS VALIUTA";
`;

      const filePath = join(testDir, "seb.csv");
      writeFileSync(filePath, csvContent);

      const parser = await getParser(filePath);

      expect(parser.bankCode).toBe(BankCode.SEB);
    });

    it("should throw UnsupportedBankError for unknown format", async () => {
      const csvContent = "Random,CSV,File\n1,2,3\n";

      const filePath = join(testDir, "unknown.csv");
      writeFileSync(filePath, csvContent);

      await expect(getParser(filePath)).rejects.toThrow(UnsupportedBankError);
      await expect(getParser(filePath)).rejects.toThrow(
        "No parser found for file"
      );
    });

    it("should throw UnsupportedBankError for empty file", async () => {
      const filePath = join(testDir, "empty.csv");
      writeFileSync(filePath, "");

      await expect(getParser(filePath)).rejects.toThrow(UnsupportedBankError);
    });
  });
});
