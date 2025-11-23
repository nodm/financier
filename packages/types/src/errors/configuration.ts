import { FinancierError } from "./base.js";

/**
 * Configuration error (invalid config, missing required values)
 */
export class ConfigurationError extends FinancierError {
  constructor(
    message: string,
    public readonly key?: string
  ) {
    super(message, "CONFIGURATION_ERROR");
    this.name = "ConfigurationError";
    Object.setPrototypeOf(this, ConfigurationError.prototype);
  }
}
