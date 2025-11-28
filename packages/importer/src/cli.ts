import { Command } from "commander";
import { importCSV } from "./services/transaction-importer.js";

const program = new Command();

program
  .name("financier")
  .description("Personal finance management CLI")
  .version("0.1.0");

program
  .command("import")
  .description("Import transactions from CSV file")
  .argument("<csv-file>", "Path to CSV file")
  .option("--dry-run", "Preview import without writing to database")
  .option("--account <iban>", "Override account ID detection")
  .option("--verbose", "Show detailed processing information")
  .action(
    async (
      csvFile: string,
      options: {
        dryRun?: boolean;
        account?: string;
        verbose?: boolean;
      }
    ) => {
      try {
        const result = await importCSV(csvFile, {
          dryRun: options.dryRun,
          accountId: options.account,
          verbose: options.verbose,
        });

        console.log("\n✓ Import completed");
        console.log(`  Total:      ${result.statistics.totalRows}`);
        console.log(`  Imported:   ${result.statistics.imported}`);
        console.log(`  Duplicates: ${result.statistics.duplicates}`);
        console.log(`  Failed:     ${result.statistics.failed}`);

        if (options.dryRun) {
          console.log("\n(Dry run - no changes made to database)");
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
