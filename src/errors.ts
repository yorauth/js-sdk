/**
 * Error class representing a failed API response from the YorAuth platform.
 *
 * Thrown by all SDK methods when the API returns a non-2xx status code.
 * Contains structured error information including the API error code,
 * HTTP status, and optional validation details.
 */
export class YorAuthError extends Error {
  /** Machine-readable error code from the API (e.g. `"AUTH_INVALID_CREDENTIALS"`). */
  public readonly code: string;

  /** HTTP status code of the response. */
  public readonly status: number;

  /**
   * Optional validation error details.
   * Keys are field names, values are arrays of validation error messages.
   */
  public readonly details?: Record<string, string[]>;

  constructor(
    message: string,
    code: string,
    status: number,
    details?: Record<string, string[]>,
  ) {
    super(message);
    this.name = "YorAuthError";
    this.code = code;
    this.status = status;
    this.details = details;

    // Maintain proper prototype chain for instanceof checks
    Object.setPrototypeOf(this, YorAuthError.prototype);
  }
}
