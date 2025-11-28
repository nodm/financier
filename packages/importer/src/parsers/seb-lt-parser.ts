import { readFileSync } from 'node:fs';
import {
  BankCode,
  type Currency,
  type RawTransactionData,
} from '@nodm/financier-types';
import * as Papa from 'papaparse';
import type { ParseResult } from '../services/csv-reader.js';
import { BaseParser, type ParsedData } from './base-parser.js';

interface AccountChunk {
  accountId: string;
  csvContent: string;
}

export class SebLtParser extends BaseParser {
  readonly bankCode = BankCode.SEB;
  readonly requiredHeaders = ['DOK NR.', 'SĄSKAITOS NR', 'DEBETAS/KREDITAS'];

  async parse(filePath: string): Promise<ParsedData> {
    const content = readFileSync(filePath, 'utf-8');
    const chunks = this.splitIntoAccountChunks(content);

    if (chunks.length === 0) {
      throw new Error('No account data found in CSV');
    }

    // For now, use first account (multi-account import can be added later)
    const chunk = chunks[0];
    const transactions = this.parseChunk(chunk);

    if (transactions.length === 0) {
      throw new Error('No transactions found in CSV');
    }

    return {
      accountId: chunk.accountId,
      transactions,
    };
  }

  private splitIntoAccountChunks(content: string): Array<AccountChunk> {
    const lines = content.split('\n');
    const chunks: Array<AccountChunk> = [];
    let currentAccountId: string | null = null;
    let currentLines: Array<string> = [];

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;

      // Check if this is an account separator row
      if (trimmed.includes('SĄSKAITOS') && trimmed.includes('IŠRAŠAS')) {
        // Save previous chunk if exists
        if (currentAccountId && currentLines.length > 0) {
          chunks.push({
            accountId: currentAccountId,
            csvContent: currentLines.join('\n'),
          });
        }

        // Extract new account ID
        const match = trimmed.match(/\(([A-Z]{2}[0-9]+)\)/);
        currentAccountId = match ? match[1] : null;
        currentLines = [];
        continue;
      }

      // Add line to current chunk
      if (currentAccountId) {
        currentLines.push(line);
      }
    }

    // Save last chunk
    if (currentAccountId && currentLines.length > 0) {
      chunks.push({
        accountId: currentAccountId,
        csvContent: currentLines.join('\n'),
      });
    }

    return chunks;
  }

  private parseChunk(chunk: AccountChunk): Array<RawTransactionData> {
    const result = Papa.parse(chunk.csvContent, {
      delimiter: ';',
      header: true,
      skipEmptyLines: true,
      transformHeader: (header) => header.trim(),
    });

    if (result.errors.length > 0) {
      throw new Error(
        `CSV parse error: ${result.errors.map((e) => e.message).join(', ')}`
      );
    }

    return result.data
      .filter((row: unknown) => {
        const r = row as Record<string, string>;
        return r['DOK NR.'] && r['DOK NR.'].trim() !== '';
      })
      .map((row: unknown) =>
        this.mapRow(row as Record<string, string>, chunk.accountId)
      );
  }

  // biome-ignore lint/correctness/noUnusedFunctionParameters: Not used in this implementation
  protected extractAccountId(data: ParseResult): string {
    return '';
  }

  protected mapRow(
    row: Record<string, string>,
    accountId: string
  ): RawTransactionData {
    // Parse date (format: YYYY-MM-DD)
    const date = new Date(row['DATA']);

    // Parse amount - comma decimal separator
    const amountStr = row['SUMA SĄSKAITOS VALIUTA'] || row['SUMA'];
    const amount = Number.parseFloat(amountStr.replace(',', '.'));

    // Determine transaction type from DEBETAS/KREDITAS
    const typeIndicator = row['DEBETAS/KREDITAS'];

    return {
      externalId: row['DOK NR.'],
      date,
      amount: typeIndicator === 'D' ? -Math.abs(amount) : Math.abs(amount),
      currency: (row['SĄSKAITOS VALIUTA'] || 'EUR') as Currency,
      merchant: row['MOKĖTOJO ARBA GAVĖJO PAVADINIMAS'] || null,
      category: row['TRANSAKCIJOS TIPAS'] || null,
      typeIndicator,
      accountNumber: accountId,
    };
  }
}
