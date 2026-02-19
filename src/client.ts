import { HttpClient } from "./http.js";
import { ApiKeyResource } from "./resources/api-keys.js";
import { AuditLogResource } from "./resources/audit-logs.js";
import { AuthResource } from "./resources/auth.js";
import { MfaResource } from "./resources/mfa.js";
import { OidcResource } from "./resources/oidc.js";
import { PermissionsResource } from "./resources/permissions.js";
import { RoleResource } from "./resources/roles.js";
import { SessionResource } from "./resources/sessions.js";
import { TeamResource } from "./resources/teams.js";
import { UserResource } from "./resources/users.js";
import { WebhookResource } from "./resources/webhooks.js";
import type { YorAuthConfig, TokenRefreshResult } from "./types.js";

/**
 * The main YorAuth SDK client.
 *
 * Provides access to all YorAuth Platform API resources through
 * strongly-typed sub-resource properties. Initialize with your
 * application ID and optional authentication credentials.
 *
 * @example
 * ```ts
 * import { YorAuth } from "@yorauth/js-sdk";
 *
 * const yorauth = new YorAuth({
 *   applicationId: "your-app-uuid",
 *   baseUrl: "https://api.yorauth.dev",
 * });
 *
 * // Public endpoints (no auth)
 * const result = await yorauth.auth.login({
 *   email: "user@example.com",
 *   password: "password",
 * });
 *
 * // Set the token for authenticated requests
 * yorauth.setToken(result.access_token);
 *
 * // Authenticated endpoints
 * const profile = await yorauth.users.getProfile(result.user.id);
 * ```
 */
export class YorAuth {
  /** Authentication endpoints (register, login, logout, etc.). */
  public readonly auth: AuthResource;

  /** User profile management (get, update, delete, export). */
  public readonly users: UserResource;

  /** RBAC role management and user-role assignments. */
  public readonly roles: RoleResource;

  /** Permission checking (single and bulk authorization checks). */
  public readonly permissions: PermissionsResource;

  /** Session management (list, revoke). */
  public readonly sessions: SessionResource;

  /** Multi-Factor Authentication management. */
  public readonly mfa: MfaResource;

  /** OIDC client management and provider endpoints. */
  public readonly oidc: OidcResource;

  /** Webhook configuration and delivery history. */
  public readonly webhooks: WebhookResource;

  /** API key management. */
  public readonly apiKeys: ApiKeyResource;

  /** Team management (CRUD, members, roles). */
  public readonly teams: TeamResource;

  /** Authorization audit log viewing. */
  public readonly auditLogs: AuditLogResource;

  private token: string | undefined;
  private apiKey: string | undefined;
  private refreshToken: string | undefined;
  private tokenRefreshedCallback: ((result: TokenRefreshResult) => void) | undefined;
  private readonly http: HttpClient;

  /**
   * Create a new YorAuth SDK client instance.
   *
   * @param config - Client configuration including application ID and optional auth.
   */
  constructor(config: YorAuthConfig) {
    if (!config.applicationId) {
      throw new Error("YorAuth: applicationId is required");
    }

    this.token = config.token;
    this.apiKey = config.apiKey;
    this.refreshToken = config.refreshToken;

    this.http = new HttpClient({
      baseUrl: config.baseUrl ?? "https://api.yorauth.dev",
      applicationId: config.applicationId,
      timeout: config.timeout ?? 30_000,
      getToken: () => this.token,
      getApiKey: () => this.apiKey,
      getRefreshToken: () => this.refreshToken,
      onRefreshSuccess: (result) => {
        this.token = result.accessToken;
        this.refreshToken = result.refreshToken;
        this.tokenRefreshedCallback?.(result);
      },
    });

    // Initialize all sub-resources
    this.auth = new AuthResource(this.http);
    this.users = new UserResource(this.http);
    this.roles = new RoleResource(this.http);
    this.permissions = new PermissionsResource(this.http);
    this.sessions = new SessionResource(this.http);
    this.mfa = new MfaResource(this.http);
    this.oidc = new OidcResource(this.http);
    this.webhooks = new WebhookResource(this.http);
    this.apiKeys = new ApiKeyResource(this.http);
    this.teams = new TeamResource(this.http);
    this.auditLogs = new AuditLogResource(this.http);
  }

  /**
   * Set the JWT Bearer token for authenticated requests.
   *
   * Call this after a successful login, token refresh, or when
   * restoring a session from storage.
   *
   * @param token - A valid JWT access token, or `undefined` to clear.
   */
  setToken(token: string | undefined): void {
    this.token = token;
  }

  /**
   * Get the currently configured JWT token.
   *
   * @returns The current token or `undefined` if not set.
   */
  getToken(): string | undefined {
    return this.token;
  }

  /**
   * Set the API key for authenticated requests.
   *
   * API key authentication is an alternative to JWT Bearer tokens.
   * If both a token and API key are set, the JWT token takes priority.
   *
   * @param apiKey - A valid API key, or `undefined` to clear.
   */
  setApiKey(apiKey: string | undefined): void {
    this.apiKey = apiKey;
  }

  /**
   * Get the currently configured API key.
   *
   * @returns The current API key or `undefined` if not set.
   */
  getApiKey(): string | undefined {
    return this.apiKey;
  }

  /**
   * Set the refresh token for automatic token refresh on 401 responses.
   *
   * @param refreshToken - A valid refresh token, or `undefined` to disable auto-refresh.
   */
  setRefreshToken(refreshToken: string | undefined): void {
    this.refreshToken = refreshToken;
  }

  /**
   * Get the currently configured refresh token.
   *
   * @returns The current refresh token or `undefined` if not set.
   */
  getRefreshToken(): string | undefined {
    return this.refreshToken;
  }

  /**
   * Register a callback invoked whenever tokens are automatically refreshed.
   *
   * Use this to persist the new tokens in your application's storage.
   *
   * @param callback - Receives the new token pair and optional user data.
   */
  onTokenRefreshed(callback: ((result: TokenRefreshResult) => void) | undefined): void {
    this.tokenRefreshedCallback = callback;
  }
}
