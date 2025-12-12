import { formatErrorResponse, logError } from "../errors.js";
import { AccountService } from "../services/account-service.js";
import type { GetAccountsOutput } from "../types/mcp.js";
import { validateGetAccountsInput } from "../types/mcp-schemas.js";

export async function handleGetAccounts(
  args: unknown
): Promise<GetAccountsOutput> {
  try {
    // Validate input
    const input = validateGetAccountsInput(args);

    // Get accounts
    const service = new AccountService();
    const accounts = await service.getAccounts(input);

    return {
      success: true,
      data: {
        accounts,
      },
    };
  } catch (error) {
    logError(error, "get_accounts");
    return formatErrorResponse(error);
  }
}
