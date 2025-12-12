import {
  DatabaseError,
  NotFoundError,
  ValidationError,
} from "@nodm/financier-types";
import type { ErrorResponse } from "./types/mcp.js";

/**
 * Format error for MCP response
 */
export function formatErrorResponse(error: unknown): ErrorResponse {
  if (error instanceof ValidationError) {
    return {
      success: false,
      error: error.message,
      code: "VALIDATION_ERROR",
    };
  }

  if (error instanceof DatabaseError) {
    return {
      success: false,
      error: "Database operation failed",
      code: "DATABASE_ERROR",
    };
  }

  if (error instanceof NotFoundError) {
    return {
      success: false,
      error: error.message,
      code: "NOT_FOUND",
    };
  }

  if (error instanceof Error) {
    return {
      success: false,
      error: error.message,
      code: "INTERNAL_ERROR",
    };
  }

  return {
    success: false,
    error: "An unexpected error occurred",
    code: "INTERNAL_ERROR",
  };
}

/**
 * Log error with appropriate level
 */
export function logError(error: unknown, context?: string): void {
  const prefix = context ? `[${context}]` : "";

  if (error instanceof ValidationError) {
    console.warn(`${prefix} Validation error:`, error.message);
  } else if (error instanceof DatabaseError) {
    console.error(`${prefix} Database error:`, error.message);
    if (error.originalError) {
      console.error(`${prefix} Original error:`, error.originalError);
    }
  } else if (error instanceof NotFoundError) {
    console.warn(`${prefix} Not found:`, error.message);
  } else if (error instanceof Error) {
    console.error(`${prefix} Error:`, error.message);
    if (error.stack) {
      console.error(`${prefix} Stack:`, error.stack);
    }
  } else {
    console.error(`${prefix} Unknown error:`, error);
  }
}
