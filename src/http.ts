import { YorAuthError } from "./errors.js";
import type { TokenRefreshResult } from "./types.js";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Options accepted by the internal HTTP client request method. */
export interface HttpRequestOptions {
  /** JSON-serializable request body. */
  body?: unknown;
  /** URL query parameters (will be appended to the URL). */
  params?: Record<string, string | number | boolean | undefined>;
  /** Extra headers to merge with defaults. */
  headers?: Record<string, string>;
}

/** Configuration required to construct an HttpClient instance. */
export interface HttpClientConfig {
  baseUrl: string;
  applicationId: string;
  timeout: number;
  getToken: () => string | undefined;
  getApiKey: () => string | undefined;
  getRefreshToken: () => string | undefined;
  onRefreshSuccess: (result: TokenRefreshResult) => void;
}

// ---------------------------------------------------------------------------
// HttpClient
// ---------------------------------------------------------------------------

/**
 * Internal HTTP client that wraps the native `fetch` API.
 *
 * Responsibilities:
 * - Prefixes all paths with the configured base URL and application scope.
 * - Injects authentication headers (Bearer token or X-API-Key).
 * - Serializes request bodies as JSON and deserializes responses.
 * - Enforces request timeouts via `AbortController`.
 * - Converts non-2xx responses into structured `YorAuthError` instances.
 *
 * @internal This class is not part of the public API surface.
 */
export class HttpClient {
  private readonly baseUrl: string;
  private readonly applicationId: string;
  private readonly timeout: number;
  private readonly getToken: () => string | undefined;
  private readonly getApiKey: () => string | undefined;
  private readonly getRefreshToken: () => string | undefined;
  private readonly onRefreshSuccess: (result: TokenRefreshResult) => void;
  private isRefreshing = false;
  private refreshPromise: Promise<TokenRefreshResult> | null = null;

  constructor(config: HttpClientConfig) {
    // Strip trailing slash for consistent URL building
    this.baseUrl = config.baseUrl.replace(/\/+$/, "");
    this.applicationId = config.applicationId;
    this.timeout = config.timeout;
    this.getToken = config.getToken;
    this.getApiKey = config.getApiKey;
    this.getRefreshToken = config.getRefreshToken;
    this.onRefreshSuccess = config.onRefreshSuccess;
  }

  /**
   * Build the fully-qualified URL for an application-scoped endpoint.
   *
   * Most SDK endpoints are scoped under
   * `/api/v1/applications/{applicationId}/...`, so this helper
   * prepends that prefix automatically.
   */
  buildAppUrl(path: string): string {
    const cleanPath = path.replace(/^\/+/, "");
    return `${this.baseUrl}/api/v1/applications/${this.applicationId}/${cleanPath}`;
  }

  /**
   * Build a URL that is NOT scoped to an application (e.g. OIDC discovery).
   */
  buildRootUrl(path: string): string {
    const cleanPath = path.replace(/^\/+/, "");
    if (cleanPath.length === 0) {
      return this.baseUrl;
    }

    // Allow callers to pass `api/...` paths regardless of whether baseUrl
    // already includes `/api` as its suffix.
    if (cleanPath === "api" && this.baseUrl.endsWith("/api")) {
      return this.baseUrl;
    }
    if (cleanPath.startsWith("api/") && this.baseUrl.endsWith("/api")) {
      return `${this.baseUrl}/${cleanPath.slice(4)}`;
    }

    return `${this.baseUrl}/${cleanPath}`;
  }

  /**
   * Perform an HTTP request and return the parsed JSON response body.
   *
   * Automatically refreshes tokens on 401 if a refresh token is available.
   *
   * @typeParam T - The expected shape of the response JSON.
   * @param method - HTTP method (GET, POST, PUT, DELETE, PATCH).
   * @param url - Fully-qualified URL (use {@link buildAppUrl} or {@link buildRootUrl}).
   * @param options - Optional body, query params, and extra headers.
   * @returns The parsed response body typed as `T`.
   * @throws {YorAuthError} When the response status is outside the 2xx range.
   */
  async request<T>(
    method: string,
    url: string,
    options?: HttpRequestOptions,
  ): Promise<T> {
    try {
      return await this.doRequest<T>(method, url, options);
    } catch (error: unknown) {
      // Auto-refresh on 401 if refresh token available
      if (
        error instanceof YorAuthError &&
        error.status === 401 &&
        this.getRefreshToken()
      ) {
        try {
          const refreshResult = await this.attemptTokenRefresh();
          this.onRefreshSuccess(refreshResult);
          // Retry the original request with the new token
          return await this.doRequest<T>(method, url, options);
        } catch {
          // Refresh failed — throw original 401 error
          throw error;
        }
      }
      throw error;
    }
  }

  /**
   * Perform the actual HTTP request (internal implementation).
   *
   * @private
   */
  private async doRequest<T>(
    method: string,
    url: string,
    options?: HttpRequestOptions,
  ): Promise<T> {
    // -- Build URL with query parameters ---------------------------------
    const urlObj = new URL(url);
    if (options?.params) {
      for (const [key, value] of Object.entries(options.params)) {
        if (value !== undefined) {
          urlObj.searchParams.set(key, String(value));
        }
      }
    }

    // -- Assemble headers ------------------------------------------------
    const headers: Record<string, string> = {
      Accept: "application/json",
      ...options?.headers,
    };

    if (options?.body !== undefined) {
      headers["Content-Type"] = "application/json";
    }

    // Authentication: prefer Bearer token, fall back to API key
    const token = this.getToken();
    const apiKey = this.getApiKey();
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    } else if (apiKey) {
      headers["X-API-Key"] = apiKey;
    }

    // -- Timeout via AbortController -------------------------------------
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(urlObj.toString(), {
        method,
        headers,
        body: options?.body !== undefined ? JSON.stringify(options.body) : undefined,
        signal: controller.signal,
      });

      // 204 No Content – return an empty object cast to T
      if (response.status === 204) {
        return undefined as unknown as T;
      }

      const contentType = response.headers.get("content-type") ?? "";
      const isJson = contentType.includes("application/json");

      if (!response.ok) {
        await this.handleErrorResponse(response, isJson);
      }

      if (isJson) {
        return (await response.json()) as T;
      }

      // Non-JSON success (unlikely but handled gracefully)
      return undefined as unknown as T;
    } catch (error: unknown) {
      if (error instanceof YorAuthError) {
        throw error;
      }

      if (error instanceof DOMException && error.name === "AbortError") {
        throw new YorAuthError(
          `Request timed out after ${this.timeout}ms`,
          "REQUEST_TIMEOUT",
          0,
        );
      }

      const message =
        error instanceof Error ? error.message : "An unknown error occurred";
      throw new YorAuthError(message, "NETWORK_ERROR", 0);
    } finally {
      clearTimeout(timeoutId);
    }
  }

  /**
   * Attempt to refresh the access token using the refresh token.
   *
   * Deduplicates concurrent refresh requests.
   *
   * @private
   */
  private async attemptTokenRefresh(): Promise<TokenRefreshResult> {
    // Deduplicate concurrent refresh requests
    if (this.refreshPromise) {
      return this.refreshPromise;
    }

    this.isRefreshing = true;
    this.refreshPromise = this.doRefresh();

    try {
      return await this.refreshPromise;
    } finally {
      this.isRefreshing = false;
      this.refreshPromise = null;
    }
  }

  /**
   * Perform the token refresh API call.
   *
   * @private
   */
  private async doRefresh(): Promise<TokenRefreshResult> {
    const url = this.buildAppUrl("users/token/refresh");
    const response = await this.doRequest<{ data: { access_token: string; refresh_token: string; expires_in: number; user?: Record<string, unknown> } }>(
      "POST",
      url,
      { body: { refresh_token: this.getRefreshToken() } },
    );

    return {
      accessToken: response.data.access_token,
      refreshToken: response.data.refresh_token,
      expiresIn: response.data.expires_in,
      user: response.data.user as TokenRefreshResult["user"],
    };
  }

  // -----------------------------------------------------------------------
  // Private helpers
  // -----------------------------------------------------------------------

  /**
   * Parse a non-2xx response and throw a YorAuthError.
   */
  private async handleErrorResponse(
    response: Response,
    isJson: boolean,
  ): Promise<never> {
    if (isJson) {
      const body = (await response.json()) as Record<string, unknown>;

      // YorAuth API wraps errors in an `error` key
      const errorObj = body["error"] as
        | Record<string, unknown>
        | undefined;

      if (errorObj && typeof errorObj === "object") {
        throw new YorAuthError(
          (errorObj["message"] as string) ?? response.statusText,
          (errorObj["code"] as string) ?? `HTTP_${response.status}`,
          response.status,
          errorObj["details"] as Record<string, string[]> | undefined,
        );
      }

      // Laravel validation errors (422) use `message` + `errors`
      if (body["message"] && body["errors"]) {
        throw new YorAuthError(
          body["message"] as string,
          "VALIDATION_ERROR",
          response.status,
          body["errors"] as Record<string, string[]>,
        );
      }

      // OIDC error format: `{ error: "invalid_client", error_description: "..." }`
      if (typeof body["error"] === "string") {
        throw new YorAuthError(
          (body["error_description"] as string) ?? (body["error"] as string),
          body["error"] as string,
          response.status,
        );
      }

      // Generic fallback for unknown JSON error shapes
      throw new YorAuthError(
        (body["message"] as string) ?? response.statusText,
        `HTTP_${response.status}`,
        response.status,
      );
    }

    // Non-JSON error body
    const text = await response.text();
    throw new YorAuthError(
      text || response.statusText,
      `HTTP_${response.status}`,
      response.status,
    );
  }
}
