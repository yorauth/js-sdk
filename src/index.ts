/**
 * @module @yorauth/js-sdk
 *
 * Official TypeScript SDK for the YorAuth Authentication & Authorization Platform.
 *
 * @example
 * ```ts
 * import { YorAuth } from "@yorauth/js-sdk";
 *
 * const client = new YorAuth({ applicationId: "your-app-uuid", baseUrl: process.env.YORAUTH_BASE_URL! });
 * ```
 */

// Main client
export { YorAuth } from "./client.js";

// Error class
export { YorAuthError } from "./errors.js";

// Webhook verification
export { Webhook } from "./webhook.js";

// All types
export type {
  // Configuration
  YorAuthConfig,

  // Common
  PaginatedResponse,
  ErrorResponse,
  MessageResponse,

  // Auth
  AuthResponse,
  MfaChallengeMethod,
  MfaChallengeResponse,
  RegisterData,
  RegisterResponse,
  LoginData,
  ResetPasswordData,
  MfaVerifyData,

  // Users
  AppUser,
  UpdateProfileData,
  ChangePasswordData,

  // Roles & Permissions
  Role,
  Permission,
  CreateRoleData,
  UpdateRoleData,
  AssignRoleData,
  UserRoleAssignment,
  PermissionCheckResult,
  BulkPermissionCheckResult,
  ComputedPermissions,
  ListRolesParams,

  // Sessions
  Session,
  DestroyAllSessionsResult,

  // MFA
  MfaSetupResponse,
  MfaConfirmResponse,
  MfaStatus,
  MfaMethod,
  MfaBackupCodesResponse,

  // Token Refresh
  TokenRefreshResult,

  // Webhook
  WebhookEvent,

  // OIDC
  OidcClient,
  OidcClientWithSecret,
  CreateOidcClientData,
  UpdateOidcClientData,
  OidcAuthorizeParams,
  OidcAuthorizeResponse,
  OidcAuthorizationCodeTokenParams,
  OidcRefreshTokenParams,
  OidcClientCredentialsTokenParams,
  OidcDeviceCodeTokenParams,
  OidcTokenParams,
  OidcTokenResponse,
  OidcUserInfo,
  OidcDeviceAuthorizeParams,
  OidcDeviceAuthorizationResponse,
  OidcLogoutParams,

  // Webhooks
  WebhookConfig,
  CreateWebhookData,
  UpdateWebhookData,
  WebhookDelivery,

  // API Keys
  ApiKey,
  ApiKeyWithSecret,
  CreateApiKeyData,
  CreateApiKeyResponse,

  // Audit Logs
  AuditLog,
  AuditLogFilters,

  // Passkeys
  PasskeyAuthenticationOptions,
  PasskeyAuthenticateVerifyData,
  PasskeyRegistrationOptions,
  PasskeyRegisterVerifyData,
  PasskeyCredential,
  UpdatePasskeyData,

  // SAML
  SamlInitiateData,
  SamlInitiateResponse,
  SamlConnection,

  // User Attributes
  UserAttribute,

  // CAPTCHA
  CaptchaStatus,

  // Teams
  Team,
  TeamDetail,
  CreateTeamData,
  UpdateTeamData,
  TeamMember,
  AddTeamMemberData,
  TeamRoleAssignment,
  AssignTeamRoleData,
  UserTeam,
  ListTeamsParams,
} from "./types.js";

// Resource classes (for advanced usage / extension)
export { AuthResource } from "./resources/auth.js";
export { UserResource } from "./resources/users.js";
export { RoleResource } from "./resources/roles.js";
export { PermissionsResource } from "./resources/permissions.js";
export { SessionResource } from "./resources/sessions.js";
export { MfaResource } from "./resources/mfa.js";
export { OidcResource } from "./resources/oidc.js";
export { WebhookResource } from "./resources/webhooks.js";
export { ApiKeyResource } from "./resources/api-keys.js";
export { AuditLogResource } from "./resources/audit-logs.js";
export { TeamResource } from "./resources/teams.js";
export { PasskeyResource } from "./resources/passkeys.js";
export { SamlResource } from "./resources/saml.js";
export { UserAttributeResource } from "./resources/user-attributes.js";
