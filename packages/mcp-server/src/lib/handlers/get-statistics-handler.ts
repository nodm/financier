import type {
  GetStatisticsInput,
  GetStatisticsOutput,
} from "../types/mcp.js";
import { validateGetStatisticsInput } from "../types/mcp-schemas.js";
import { formatErrorResponse, logError } from "../errors.js";
import { StatisticsService } from "../services/statistics-service.js";

export async function handleGetStatistics(
  args: unknown
): Promise<GetStatisticsOutput> {
  try {
    // Validate input
    const input = validateGetStatisticsInput(args);

    // Get statistics
    const service = new StatisticsService();
    const result = await service.getStatistics(input);

    return {
      success: true,
      data: result,
    };
  } catch (error) {
    logError(error, "get_statistics");
    return formatErrorResponse(error);
  }
}

