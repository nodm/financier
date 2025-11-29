import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { BankCode } from '@nodm/financier-types';
import { SebLtParser } from '../../src/parsers/seb-lt-parser.js';

describe('SebLtParser', () => {
  let parser: SebLtParser;
  let testDir: string;

  beforeEach(() => {
    parser = new SebLtParser();
    testDir = join(process.cwd(), 'test-temp');
    mkdirSync(testDir, { recursive: true });
  });

  afterEach(() => {
    rmSync(testDir, { recursive: true, force: true });
  });

  describe('metadata', () => {
    it('should have correct bank code', () => {
      expect(parser.bankCode).toBe(BankCode.SEB);
    });

    it('should have required headers', () => {
      expect(parser.requiredHeaders).toEqual([
        'DOK NR.',
        'SĄSKAITOS NR',
        'DEBETAS/KREDITAS',
      ]);
    });
  });

  describe('parse', () => {
    it('should parse SEB CSV with single account', async () => {
      const csvContent = `"SĄSKAITOS  (LT123456789012345678) IŠRAŠAS (UŽ LAIKOTARPĮ: 2025-01-01-2025-01-31)";
"DOK NR.";"DATA";"VALIUTA";"SUMA";"MOKĖTOJO ARBA GAVĖJO PAVADINIMAS";"MOKĖTOJO ARBA GAVĖJO IDENTIFIKACINIS KODAS";"SĄSKAITA";"KREDITO ĮSTAIGOS PAVADINIMAS";"KREDITO ĮSTAIGOS SWIFT KODAS";"MOKĖJIMO PASKIRTIS";"TRANSAKCIJOS KODAS";"DOKUMENTO DATA";"TRANSAKCIJOS TIPAS";"NUORODA";"DEBETAS/KREDITAS";"SUMA SĄSKAITOS VALIUTA";"SĄSKAITOS NR";"SĄSKAITOS VALIUTA";
"TM001";2025-01-15;"EUR";100,50;"Test Merchant";"";"";"";"";"";"RO001";2025-01-15;"Payment";"";"C";100,50;"LT123456789012345678";"EUR";
`;

      const filePath = join(testDir, 'test.csv');
      writeFileSync(filePath, csvContent);

      const result = await parser.parse(filePath);

      expect(result.accountId).toBe('LT123456789012345678');
      expect(result.transactions).toHaveLength(1);
      // externalId should now be the TRANSAKCIJOS KODAS (RO001), not DOK NR. (TM001)
      expect(result.transactions[0]).toMatchObject({
        externalId: 'RO001',
        amount: 100.5,
        currency: 'EUR',
        merchant: 'Test Merchant',
      });
    });

    it('should parse debit transactions with negative amounts', async () => {
      const csvContent = `"SĄSKAITOS  (LT123456789012345678) IŠRAŠAS (UŽ LAIKOTARPĮ: 2025-01-01-2025-01-31)";
"DOK NR.";"DATA";"VALIUTA";"SUMA";"MOKĖTOJO ARBA GAVĖJO PAVADINIMAS";"MOKĖTOJO ARBA GAVĖJO IDENTIFIKACINIS KODAS";"SĄSKAITA";"KREDITO ĮSTAIGOS PAVADINIMAS";"KREDITO ĮSTAIGOS SWIFT KODAS";"MOKĖJIMO PASKIRTIS";"TRANSAKCIJOS KODAS";"DOKUMENTO DATA";"TRANSAKCIJOS TIPAS";"NUORODA";"DEBETAS/KREDITAS";"SUMA SĄSKAITOS VALIUTA";"SĄSKAITOS NR";"SĄSKAITOS VALIUTA";
"TM002";2025-01-20;"EUR";50,25;"Shop";"";"";"";"";"";"RO002";2025-01-20;"Purchase";"";"D";50,25;"LT123456789012345678";"EUR";
`;

      const filePath = join(testDir, 'test.csv');
      writeFileSync(filePath, csvContent);

      const result = await parser.parse(filePath);

      expect(result.transactions[0].amount).toBe(-50.25);
      expect(result.transactions[0].typeIndicator).toBe('D');
    });

    it('should parse multiple transactions', async () => {
      const csvContent = `"SĄSKAITOS  (LT123456789012345678) IŠRAŠAS (UŽ LAIKOTARPĮ: 2025-01-01-2025-01-31)";
"DOK NR.";"DATA";"VALIUTA";"SUMA";"MOKĖTOJO ARBA GAVĖJO PAVADINIMAS";"MOKĖTOJO ARBA GAVĖJO IDENTIFIKACINIS KODAS";"SĄSKAITA";"KREDITO ĮSTAIGOS PAVADINIMAS";"KREDITO ĮSTAIGOS SWIFT KODAS";"MOKĖJIMO PASKIRTIS";"TRANSAKCIJOS KODAS";"DOKUMENTO DATA";"TRANSAKCIJOS TIPAS";"NUORODA";"DEBETAS/KREDITAS";"SUMA SĄSKAITOS VALIUTA";"SĄSKAITOS NR";"SĄSKAITOS VALIUTA";
"TM001";2025-01-15;"EUR";100,50;"Merchant 1";"";"";"";"";"";"RO001";2025-01-15;"Payment";"";"C";100,50;"LT123456789012345678";"EUR";
"TM002";2025-01-20;"EUR";50,25;"Merchant 2";"";"";"";"";"";"RO002";2025-01-20;"Purchase";"";"D";50,25;"LT123456789012345678";"EUR";
"TM003";2025-01-25;"EUR";75,00;"Merchant 3";"";"";"";"";"";"RO003";2025-01-25;"Transfer";"";"C";75,00;"LT123456789012345678";"EUR";
`;

      const filePath = join(testDir, 'test.csv');
      writeFileSync(filePath, csvContent);

      const result = await parser.parse(filePath);

      expect(result.transactions).toHaveLength(3);
      // externalId should now be the TRANSAKCIJOS KODAS (RO00x), not DOK NR. (TM00x)
      expect(result.transactions[0].externalId).toBe('RO001');
      expect(result.transactions[1].externalId).toBe('RO002');
      expect(result.transactions[2].externalId).toBe('RO003');
    });

    it('should throw error if no transactions found', async () => {
      const csvContent = `"SĄSKAITOS  (LT123456789012345678) IŠRAŠAS (UŽ LAIKOTARPĮ: 2025-01-01-2025-01-31)";
"DOK NR.";"DATA";"VALIUTA";"SUMA";"MOKĖTOJO ARBA GAVĖJO PAVADINIMAS";"MOKĖTOJO ARBA GAVĖJO IDENTIFIKACINIS KODAS";"SĄSKAITA";"KREDITO ĮSTAIGOS PAVADINIMAS";"KREDITO ĮSTAIGOS SWIFT KODAS";"MOKĖJIMO PASKIRTIS";"TRANSAKCIJOS KODAS";"DOKUMENTO DATA";"TRANSAKCIJOS TIPAS";"NUORODA";"DEBETAS/KREDITAS";"SUMA SĄSKAITOS VALIUTA";"SĄSKAITOS NR";"SĄSKAITOS VALIUTA";
`;

      const filePath = join(testDir, 'test.csv');
      writeFileSync(filePath, csvContent);

      await expect(parser.parse(filePath)).rejects.toThrow(
        'No transactions found in CSV'
      );
    });

    it('should parse SEB CSV with English headers', async () => {
      const csvContent = `"ACCOUNT  (LT123456789012345678) STATEMENT (FOR PERIOD: 2025-01-01-2025-01-31)";
"INSTRUCTION ID";"DATE";"CURRENCY";"AMOUNT";"COUNTERPARTY";"DEBTOR/CREDITOR ID";"ACCOUNT NO";"CREDIT INSTITUTION NAME";"CREDIT INSTITUTION SWIFT";"DETAILS OF PAYMENTS";"TRANSACTION CODE";"DOCUMENT DATE";"TRANSACTION TYPE";"REFERENCE NO";"DEBIT/CREDIT";"AMOUNT IN ACCOUNT CURRENCY";"ACCOUNT NO";"ACCOUNT CURRENCY";
"TM001";2025-01-15;"EUR";100,50;"Test Merchant";"";"";"";"";"";"RO001";2025-01-15;"Payment";"";"C";100,50;"LT123456789012345678";"EUR";
`;

      const filePath = join(testDir, 'test-english.csv');
      writeFileSync(filePath, csvContent);

      const result = await parser.parse(filePath);

      expect(result.accountId).toBe('LT123456789012345678');
      expect(result.transactions).toHaveLength(1);
      // externalId should now be the TRANSACTION CODE (RO001), not INSTRUCTION ID (TM001)
      expect(result.transactions[0]).toMatchObject({
        externalId: 'RO001',
        amount: 100.5,
        currency: 'EUR',
        merchant: 'Test Merchant',
      });
    });

    it('should parse English debit transactions with negative amounts', async () => {
      const csvContent = `"ACCOUNT  (LT123456789012345678) STATEMENT (FOR PERIOD: 2025-01-01-2025-01-31)";
"INSTRUCTION ID";"DATE";"CURRENCY";"AMOUNT";"COUNTERPARTY";"DEBTOR/CREDITOR ID";"ACCOUNT NO";"CREDIT INSTITUTION NAME";"CREDIT INSTITUTION SWIFT";"DETAILS OF PAYMENTS";"TRANSACTION CODE";"DOCUMENT DATE";"TRANSACTION TYPE";"REFERENCE NO";"DEBIT/CREDIT";"AMOUNT IN ACCOUNT CURRENCY";"ACCOUNT NO";"ACCOUNT CURRENCY";
"TM002";2025-01-20;"EUR";50,25;"Shop";"";"";"";"";"";"RO002";2025-01-20;"Purchase";"";"D";50,25;"LT123456789012345678";"EUR";
`;

      const filePath = join(testDir, 'test-english.csv');
      writeFileSync(filePath, csvContent);

      const result = await parser.parse(filePath);

      expect(result.transactions[0].amount).toBe(-50.25);
      expect(result.transactions[0].typeIndicator).toBe('D');
    });
  });
});
