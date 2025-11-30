import type { RawTransactionData } from "@nodm/financier-types";
import { Command } from "commander";
import { importCSV } from "./services/transaction-importer.js";
import { normalizeDate } from "./utils/date-utils.js";

const program = new Command();

program
  .name("financier")
  .description("Personal finance management CLI")
  .version("0.1.0");

/**
 * Format a transaction for display
 */
function formatTransaction(t: RawTransactionData): string {
  const date = normalizeDate(t.date).toISOString().split("T")[0];
  const amount =
    typeof t.amount === "string" ? Number.parseFloat(t.amount) : t.amount;
  const amountStr = amount >= 0 ? `+${amount.toFixed(2)}` : amount.toFixed(2);
  const merchant = t.merchant || "N/A";
  return `  ${date}  ${amountStr.padStart(12)} ${t.currency}  ${merchant}`;
}

program
  .command("import")
  .description("Import transactions from CSV file")
  .argument("<csv-file>", "Path to CSV file")
  .option("--dry-run", "Preview import without writing to database")
  .option("--account <iban>", "Override account ID detection")
  .option("--verbose", "Show detailed processing information")
  .option(
    "--show-duplicates",
    "Show duplicate transactions that would be/were skipped"
  )
  .action(
    async (
      csvFile: string,
      options: {
        dryRun?: boolean;
        account?: string;
        verbose?: boolean;
        showDuplicates?: boolean;
      }
    ) => {
      try {
        const result = await importCSV(csvFile, {
          dryRun: options.dryRun,
          accountId: options.account,
          verbose: options.verbose,
          showDuplicates: options.showDuplicates,
        });

        console.log("\n✓ Import completed");
        console.log(`  Total:      ${result.statistics.totalRows}`);
        console.log(`  Imported:   ${result.statistics.imported}`);
        console.log(`  Duplicates: ${result.statistics.duplicates}`);
        console.log(`  Failed:     ${result.statistics.failed}`);

        if (options.dryRun) {
          console.log("\n(Dry run - no changes made to database)");
        }

        // Show duplicate transactions if requested
        if (
          options.showDuplicates &&
          result.duplicateTransactions &&
          result.duplicateTransactions.length > 0
        ) {
          console.log(
            `\n📋 Duplicate transactions (${result.duplicateTransactions.length}):`
          );
          console.log(
            "  ──────────────────────────────────────────────────────"
          );
          for (const t of result.duplicateTransactions) {
            console.log(formatTransaction(t));
          }
          console.log(
            "  ──────────────────────────────────────────────────────"
          );
        }

        process.exit(0);
      } catch (error) {
        console.error(
          `\n✗ Error: ${error instanceof Error ? error.message : String(error)}`
        );

        if (options.verbose && error instanceof Error && error.stack) {
          console.error(error.stack);
        }

        process.exit(1);
      }
    }
  );

export function run(): void {
  program.parse();
}
