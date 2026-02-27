// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

/** Configuration options for the YorAuth SDK client. */
export interface YorAuthConfig {
  /** The application UUID that scopes all API requests. */
  applicationId: string;
  /** Base URL of the YorAuth API (required, no default). */
  baseUrl: string;
  /** JWT Bearer token used for authenticated requests. */
  token?: string;
  /**
   * API key for server-to-server authentication.
   *
   * @security **SERVER-SIDE ONLY.** API keys are long-lived credentials with full
   * application access. NEVER use API keys in browser, frontend, or client-side
   * environments. Exposing an API key in client-side code will compromise your
   * application security. For client-side auth, use the OIDC Authorization Code
   * flow with PKCE instead.
   *
   * Load from environment variables: `process.env.YORAUTH_API_KEY`
   *
   * The SDK will throw an error if an API key is detected in a browser
   * environment. To override this check for legitimate server-side rendering
   * contexts, set {@link dangerouslyAllowBrowser} to `true`.
   */
  apiKey?: string;
  /** Refresh token for automatic token refresh on 401. */
  refreshToken?: string;
  /** Request timeout in milliseconds. Defaults to `30000`. */
  timeout?: number;
  /**
   * Override the browser environment detection safety check.
   *
   * @security Setting this to `true` disables the runtime check that prevents
   * API key usage in browser environments. Only use this if you are certain
   * your code runs in a server-side context that happens to have browser
   * globals defined (e.g., Electron main process, SSR hydration).
   *
   * **Using this flag in a real browser with an API key is a security
   * vulnerability.** Your API key will be exposed to end users.
   *
   * @default false
   */
  dangerouslyAllowBrowser?: boolean;
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

/** MFA method summary returned during an authentication challenge. */
export interface MfaChallengeMethod {
  id: string;
  type: string;
  label: string | null;
}

/** Response returned when MFA is required during login. */
export interface MfaChallengeResponse {
  mfa_required: true;
  challenge_token: string;
  mfa_methods: MfaChallengeMethod[];
}

/** Data required to register a new user. */
export interface RegisterData {
  email: string;
  password: string;
  password_confirmation?: string;
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
  /** CAPTCHA token from the client-side widget (required when CAPTCHA is enabled). */
  captcha_token?: string;
}

/** Data required to reset a forgotten password. */
export interface ResetPasswordData {
  token: string;
  email: string;
  password: string;
  password_confirmation: string;
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
  /** Grant types this client is allowed to use. */
  allowed_grant_types?: string[];
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
  user_id?: string;
  target_user_id?: string;
  target_role_id?: string;
  from?: string;
  to?: string;
  page?: number;
  per_page?: number;
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

/** Parameters for an OIDC authorization_code token exchange. */
export interface OidcAuthorizationCodeTokenParams {
  grant_type: "authorization_code";
  code: string;
  redirect_uri: string;
  client_id: string;
  client_secret: string;
  code_verifier?: string;
}

/** Parameters for an OIDC refresh_token exchange. */
export interface OidcRefreshTokenParams {
  grant_type: "refresh_token";
  refresh_token: string;
  client_id: string;
  client_secret: string;
}

/** Parameters for an OIDC client_credentials token request (RFC 6749 Section 4.4). */
export interface OidcClientCredentialsTokenParams {
  grant_type: "client_credentials";
  client_id: string;
  client_secret: string;
  scope?: string;
}

/** Parameters for an OIDC device_code token exchange (RFC 8628). */
export interface OidcDeviceCodeTokenParams {
  grant_type: "urn:ietf:params:oauth:grant-type:device_code";
  device_code: string;
  client_id: string;
}

/** Parameters for the OIDC token endpoint. */
export type OidcTokenParams =
  | OidcAuthorizationCodeTokenParams
  | OidcRefreshTokenParams
  | OidcClientCredentialsTokenParams
  | OidcDeviceCodeTokenParams;

/** Response from the OIDC token endpoint. */
export interface OidcTokenResponse {
  access_token: string;
  refresh_token?: string;
  token_type: string;
  expires_in: number;
  /** ID token (present for authorization_code grant, absent for client_credentials and device_code). */
  id_token?: string;
}

/** Parameters for the OIDC device authorization request (RFC 8628). */
export interface OidcDeviceAuthorizeParams {
  client_id: string;
  scope?: string;
}

/** Response from the OIDC device authorization endpoint. */
export interface OidcDeviceAuthorizationResponse {
  device_code: string;
  user_code: string;
  verification_uri: string;
  verification_uri_complete?: string;
  expires_in: number;
  interval: number;
}

/** Parameters for building an OIDC logout URL. */
export interface OidcLogoutParams {
  /** The ID token previously issued, used as a logout hint. */
  id_token_hint?: string;
  /** URL to redirect the user to after logout. */
  post_logout_redirect_uri?: string;
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
// Teams
// ---------------------------------------------------------------------------

/** A team within an application. */
export interface Team {
  id: string;
  name: string;
  description: string | null;
  scope: string | null;
  metadata: Record<string, unknown> | null;
  member_count: number;
  created_at: string;
  updated_at: string;
}

/** A team with its members and roles included. */
export interface TeamDetail extends Team {
  members: TeamMember[];
  roles: TeamRoleAssignment[];
}

/** Data required to create a new team. */
export interface CreateTeamData {
  name: string;
  description?: string;
  scope?: string;
  metadata?: Record<string, unknown>;
}

/** Data used to update an existing team. */
export interface UpdateTeamData {
  name?: string;
  description?: string;
  scope?: string;
  metadata?: Record<string, unknown>;
}

/** A team member record. */
export interface TeamMember {
  id: string;
  user_id: string;
  added_by: string | null;
  created_at: string;
}

/** Data required to add a member to a team. */
export interface AddTeamMemberData {
  user_id: string;
}

/** A role assignment on a team. */
export interface TeamRoleAssignment {
  id: string;
  role: {
    id: string;
    name: string;
    display_name: string | null;
  };
  scope: string | null;
  granted_at: string;
  expires_at: string | null;
}

/** Data required to assign a role to a team. */
export interface AssignTeamRoleData {
  role_id: string;
  scope?: string;
  expires_at?: string;
}

/** A user's team membership with role information. */
export interface UserTeam {
  id: string;
  name: string;
  description: string | null;
  scope: string | null;
  roles: Array<{
    role_id: string;
    role_name: string;
    scope: string | null;
  }>;
}

/** Query parameters for listing teams. */
export interface ListTeamsParams {
  search?: string;
  per_page?: number;
  page?: number;
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

// ---------------------------------------------------------------------------
// Passkeys (WebAuthn)
// ---------------------------------------------------------------------------

/** Options returned from the server for a WebAuthn authentication ceremony. */
export interface PasskeyAuthenticationOptions {
  challenge: string;
  timeout?: number;
  rpId?: string;
  allowCredentials?: Array<{
    id: string;
    type: string;
    transports?: string[];
  }>;
  userVerification?: string;
  [key: string]: unknown;
}

/** Data sent to verify a WebAuthn authentication assertion. */
export interface PasskeyAuthenticateVerifyData {
  id: string;
  rawId: string;
  response: {
    authenticatorData: string;
    clientDataJSON: string;
    signature: string;
    userHandle?: string;
  };
  type: string;
}

/** Options returned from the server for a WebAuthn registration ceremony. */
export interface PasskeyRegistrationOptions {
  challenge: string;
  rp: { name: string; id?: string };
  user: { id: string; name: string; displayName: string };
  pubKeyCredParams: Array<{ type: string; alg: number }>;
  timeout?: number;
  attestation?: string;
  authenticatorSelection?: {
    authenticatorAttachment?: string;
    residentKey?: string;
    requireResidentKey?: boolean;
    userVerification?: string;
  };
  excludeCredentials?: Array<{
    id: string;
    type: string;
    transports?: string[];
  }>;
  [key: string]: unknown;
}

/** Data sent to verify a WebAuthn registration attestation. */
export interface PasskeyRegisterVerifyData {
  id: string;
  rawId: string;
  response: {
    attestationObject: string;
    clientDataJSON: string;
  };
  type: string;
}

/** A registered passkey credential record. */
export interface PasskeyCredential {
  id: string;
  credential_id: string;
  name: string | null;
  last_used_at: string | null;
  created_at: string;
  updated_at: string;
}

/** Fields that can be updated on a passkey credential. */
export interface UpdatePasskeyData {
  name?: string;
}

// ---------------------------------------------------------------------------
// SAML SSO
// ---------------------------------------------------------------------------

/** Data required to initiate a SAML SSO flow. */
export interface SamlInitiateData {
  /** The ID of the SAML connection to use. */
  connection_id?: string;
  /** The user's email (for IdP discovery). */
  email?: string;
  /** Optional relay state passed through the SAML flow. */
  relay_state?: string;
}

/** Response from initiating a SAML SSO flow. */
export interface SamlInitiateResponse {
  redirect_url: string;
  request_id?: string;
}

/** A configured SAML identity provider connection. */
export interface SamlConnection {
  id: string;
  name: string;
  idp_entity_id: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// ---------------------------------------------------------------------------
// User Attributes (ABAC)
// ---------------------------------------------------------------------------

/** A user attribute key-value record for ABAC. Returned as a flat key-value map. */
export type UserAttribute = Record<string, unknown>;

// ---------------------------------------------------------------------------
// CAPTCHA
// ---------------------------------------------------------------------------

/** CAPTCHA configuration status for the application. */
export interface CaptchaStatus {
  enabled: boolean;
  provider?: string;
  site_key?: string;
}
