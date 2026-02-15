// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

/** Configuration options for the YorAuth SDK client. */
export interface YorAuthConfig {
  /** The application UUID that scopes all API requests. */
  applicationId: string;
  /** Base URL of the YorAuth API. Defaults to `"https://api.yorauth.dev"`. */
  baseUrl?: string;
  /** JWT Bearer token used for authenticated requests. */
  token?: string;
  /** API key used as an alternative authentication method (sent as `X-API-Key`). */
  apiKey?: string;
  /** Refresh token for automatic token refresh on 401. */
  refreshToken?: string;
  /** Request timeout in milliseconds. Defaults to `30000`. */
  timeout?: number;
}

// ---------------------------------------------------------------------------
// Common / shared
// ---------------------------------------------------------------------------

/** Standard paginated response wrapper used by list endpoints. */
export interface PaginatedResponse<T> {
  data: T[];
  links: {
    first: string | null;
    last: string | null;
    prev: string | null;
    next: string | null;
  };
  meta: {
    current_page: number;
    from: number | null;
    last_page: number;
    path: string;
    per_page: number;
    to: number | null;
    total: number;
  };
}

/** Standard error body returned by the YorAuth API. */
export interface ErrorResponse {
  error: {
    code: string;
    message: string;
    request_id?: string;
    timestamp?: string;
  };
}

/** Simple message response wrapper. */
export interface MessageResponse {
  message: string;
}

// ---------------------------------------------------------------------------
// Auth
// ---------------------------------------------------------------------------

/** Successful authentication response containing tokens and user data. */
export interface AuthResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
  user: AppUser;
}

/** Response returned when MFA is required during login. */
export interface MfaChallengeResponse {
  mfa_required: true;
  challenge_token: string;
  mfa_methods: string[];
}

/** Data required to register a new user. */
export interface RegisterData {
  email: string;
  password: string;
  name: string;
  metadata?: Record<string, unknown>;
}

/** Registration response containing the created user data. */
export interface RegisterResponse {
  data: AppUser;
  message: string;
}

/** Data required to log in a user. */
export interface LoginData {
  email: string;
  password: string;
  remember_me?: boolean;
}

/** Data required to reset a forgotten password. */
export interface ResetPasswordData {
  token: string;
  email: string;
  password: string;
}

/** Data required to verify an MFA challenge during login. */
export interface MfaVerifyData {
  challenge_token: string;
  code: string;
}

// ---------------------------------------------------------------------------
// Users
// ---------------------------------------------------------------------------

/** An application user (end-user) within a YorAuth application. */
export interface AppUser {
  id: string;
  email: string;
  name: string;
  avatar_url: string | null;
  email_verified_at: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

/** Fields that can be updated on a user profile. */
export interface UpdateProfileData {
  name?: string;
  avatar_url?: string | null;
  metadata?: Record<string, unknown> | null;
}

/** Data required to change a user's password. */
export interface ChangePasswordData {
  current_password: string;
  new_password: string;
  new_password_confirmation: string;
}

// ---------------------------------------------------------------------------
// Roles & Permissions
// ---------------------------------------------------------------------------

/** A role within an application's RBAC system. */
export interface Role {
  id: string;
  application_id: string;
  name: string;
  display_name: string | null;
  description: string | null;
  is_system_role: boolean;
  permissions_count?: number;
  users_count?: number;
  permissions?: Permission[];
  created_at: string;
  updated_at: string;
}

/** A permission that can be assigned to roles. */
export interface Permission {
  id: string;
  name: string;
  resource: string | null;
  action: string | null;
  description: string | null;
  created_at: string;
  updated_at: string;
}

/** Data required to create a new role. */
export interface CreateRoleData {
  name: string;
  display_name?: string;
  description?: string;
  permissions?: string[];
  is_system_role?: boolean;
}

/** Data used to update an existing role. */
export interface UpdateRoleData {
  display_name?: string;
  description?: string;
  permissions?: string[];
}

/** Data required to assign a role to a user. */
export interface AssignRoleData {
  role_id: string;
  scope?: string | null;
  expires_at?: string | null;
}

/** A user-role assignment record. */
export interface UserRoleAssignment {
  id: string;
  user_id: string;
  role_id: string;
  scope: string | null;
  expires_at: string | null;
  created_at: string;
}

/** Result of a single permission check. */
export interface PermissionCheckResult {
  allowed: boolean;
  permission: string;
  cached: boolean;
}

/** Result of a bulk permission check. */
export interface BulkPermissionCheckResult {
  user_id: string;
  results: Record<string, boolean>;
}

/** Computed permissions for a user, aggregated from all roles. */
export interface ComputedPermissions {
  user_id: string;
  scope: string | null;
  permissions: string[];
  roles: string[];
}

/** Query parameters for listing roles. */
export interface ListRolesParams {
  search?: string;
  include_permissions?: boolean;
  per_page?: number;
  page?: number;
}

// ---------------------------------------------------------------------------
// Sessions
// ---------------------------------------------------------------------------

/** An active user session (backed by a refresh token). */
export interface Session {
  id: string;
  device_info: Record<string, unknown> | null;
  is_remember_me: boolean;
  last_used_at: string | null;
  expires_at: string;
  created_at: string;
}

/** Result of revoking all sessions. */
export interface DestroyAllSessionsResult {
  revoked_count: number;
  message: string;
}

// ---------------------------------------------------------------------------
// MFA
// ---------------------------------------------------------------------------

/** Response from initiating TOTP MFA setup. */
export interface MfaSetupResponse {
  method_id: string;
  provisioning_uri: string;
  secret: string;
}

/** Response from confirming TOTP setup (includes one-time backup codes). */
export interface MfaConfirmResponse {
  message: string;
  backup_codes: string[];
}

/** Current MFA status for a user. */
export interface MfaStatus {
  mfa_enabled: boolean;
  methods: MfaMethod[];
  backup_codes_remaining: number;
}

/** A configured MFA method. */
export interface MfaMethod {
  id: string;
  type: string;
  label: string | null;
  is_primary: boolean;
  verified_at: string | null;
  last_used_at: string | null;
}

/** Response from regenerating backup codes. */
export interface MfaBackupCodesResponse {
  backup_codes: string[];
  message: string;
}

// ---------------------------------------------------------------------------
// OIDC Clients
// ---------------------------------------------------------------------------

/** An OpenID Connect client (relying party). */
export interface OidcClient {
  id: string;
  client_id: string;
  name: string;
  description: string | null;
  logo_url: string | null;
  redirect_uris: string[];
  allowed_scopes: string[];
  is_active: boolean;
  created_at: string;
  updated_at?: string;
}

/** An OIDC client as returned from the create endpoint (includes plaintext secret). */
export interface OidcClientWithSecret extends OidcClient {
  client_secret: string;
}

/** Data required to create an OIDC client. */
export interface CreateOidcClientData {
  name: string;
  redirect_uris: string[];
  description?: string | null;
  logo_url?: string | null;
  allowed_scopes?: string[];
}

/** Data used to update an OIDC client. */
export interface UpdateOidcClientData {
  name?: string;
  description?: string | null;
  logo_url?: string | null;
  redirect_uris?: string[];
  allowed_scopes?: string[];
  is_active?: boolean;
}

// ---------------------------------------------------------------------------
// Webhooks
// ---------------------------------------------------------------------------

/** A webhook configuration. */
export interface WebhookConfig {
  id: string;
  url: string;
  events: string[];
  is_active: boolean;
  secret?: string;
  created_at: string;
  updated_at?: string;
}

/** Data required to create a webhook configuration. */
export interface CreateWebhookData {
  url: string;
  events: string[];
}

/** Data used to update a webhook configuration. */
export interface UpdateWebhookData {
  url?: string;
  events?: string[];
  is_active?: boolean;
}

/** A record of a webhook delivery attempt. */
export interface WebhookDelivery {
  id: string;
  event: string;
  response_status: number | null;
  delivered_at: string | null;
  retry_count: number;
  created_at: string;
}

// ---------------------------------------------------------------------------
// API Keys
// ---------------------------------------------------------------------------

/** An API key (without the plaintext key). */
export interface ApiKey {
  id: string;
  name: string | null;
  key_prefix: string;
  last_used_at: string | null;
  expires_at: string | null;
  revoked_at: string | null;
  is_active: boolean;
  created_at: string;
}

/** An API key as returned from creation (includes the one-time plaintext key). */
export interface ApiKeyWithSecret extends ApiKey {
  key: string;
}

/** Data required to create an API key. */
export interface CreateApiKeyData {
  name?: string;
  expires_at?: string;
}

/** API key creation response including the one-time warning. */
export interface CreateApiKeyResponse {
  data: ApiKeyWithSecret;
  warning: string;
}

// ---------------------------------------------------------------------------
// Audit Logs
// ---------------------------------------------------------------------------

/** An authorization audit log entry. */
export interface AuditLog {
  id: string;
  action: string;
  actor_id: string | null;
  target_user_id: string | null;
  target_role_id: string | null;
  metadata: Record<string, unknown> | null;
  ip_address: string | null;
  created_at: string;
}

/** Filter parameters for listing audit logs. */
export interface AuditLogFilters {
  action?: string;
  target_user_id?: string;
  target_role_id?: string;
  limit?: number;
}

// ---------------------------------------------------------------------------
// OIDC Provider Endpoints
// ---------------------------------------------------------------------------

/** Parameters for the OIDC authorization request. */
export interface OidcAuthorizeParams {
  response_type: "code";
  client_id: string;
  redirect_uri: string;
  scope: string;
  state?: string;
  nonce?: string;
  code_challenge?: string;
  code_challenge_method?: "S256" | "plain";
}

/** Response from the OIDC authorization endpoint. */
export interface OidcAuthorizeResponse {
  code: string;
  state: string | null;
  redirect_uri: string;
}

/** Parameters for the OIDC token exchange. */
export interface OidcTokenParams {
  grant_type: "authorization_code";
  code: string;
  redirect_uri: string;
  client_id: string;
  client_secret: string;
  code_verifier?: string;
}

/** Response from the OIDC token endpoint. */
export interface OidcTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  id_token: string;
}

/** Claims returned by the OIDC userinfo endpoint. */
export interface OidcUserInfo {
  sub: string;
  name?: string;
  email?: string;
  email_verified?: boolean;
  picture?: string;
  updated_at?: number;
  [key: string]: unknown;
}

// ---------------------------------------------------------------------------
// Token Refresh
// ---------------------------------------------------------------------------

/** Result returned when tokens are automatically refreshed. */
export interface TokenRefreshResult {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  user?: AppUser;
}

// ---------------------------------------------------------------------------
// Webhook
// ---------------------------------------------------------------------------

/** A parsed webhook event received from the YorAuth platform. */
export interface WebhookEvent {
  event: string;
  timestamp: string;
  data: Record<string, unknown>;
}
