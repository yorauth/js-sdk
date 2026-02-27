# @yorauth/js-sdk

Official TypeScript SDK for the **YorAuth Authentication & Authorization Platform**.

Zero runtime dependencies. Uses native `fetch`. Ships ESM + CJS dual builds with full type declarations.

> **SECURITY WARNING: SERVER-SIDE USE ONLY**
>
> This SDK is designed exclusively for server-side environments (Node.js, Deno, Bun).
> **DO NOT** use this SDK in browser, frontend, or any client-side JavaScript environment.
>
> The SDK authenticates using API keys and JWT tokens that grant access to your
> YorAuth application data. Exposing these credentials in client-side code, browser
> bundles, or publicly accessible JavaScript will compromise your application security
> and may result in unauthorized access to user data.
>
> For browser/frontend integration, use `@yorauth/vue-sdk` (Nuxt.js) or
> `@yorauth/react-sdk` (Next.js), which are designed for SSR frameworks that
> keep secrets on the server.
>
> **YorAuth assumes no liability for credential exposure resulting from use of this
> SDK in client-side or browser environments.** See [Security Best Practices](https://docs.yorauth.com/security-best-practices).

## Installation

```bash
npm install @yorauth/js-sdk
```

Requires Node.js 18+, Deno, or Bun.

## Quick Start

```typescript
import { YorAuth } from "@yorauth/js-sdk";

// Initialize the client with your application ID and base URL
const yorauth = new YorAuth({
  applicationId: "your-application-uuid",
  baseUrl: process.env.YORAUTH_BASE_URL!, // required, no default
});

// Register a new user
const registration = await yorauth.auth.register({
  email: "jane@example.com",
  password: "securePassword123",
  name: "Jane Doe",
});

// Log in
const loginResult = await yorauth.auth.login({
  email: "jane@example.com",
  password: "securePassword123",
});

// Handle MFA challenge if required
if ("mfa_required" in loginResult) {
  const mfaResult = await yorauth.auth.verifyMfa({
    challenge_token: loginResult.challenge_token,
    code: "123456",
  });
  yorauth.setToken(mfaResult.access_token);
} else {
  yorauth.setToken(loginResult.access_token);
}

// Now use authenticated endpoints
const allowed = await yorauth.permissions.check(
  "user-uuid",
  "posts:create"
);

if (allowed.allowed) {
  console.log("User can create posts!");
}
```

## Authentication Methods

The SDK supports two authentication methods:

### JWT Bearer Token

Used for most API operations. Obtained after login or token refresh.

```typescript
const yorauth = new YorAuth({
  applicationId: "your-app-uuid",
  token: "eyJhbGciOiJSUzI1NiI...", // set at construction
});

// Or set/update later
yorauth.setToken("eyJhbGciOiJSUzI1NiI...");
```

### API Key

Alternative authentication for server-to-server integrations.

> **WARNING:** API keys are long-lived credentials with full application access.
> Never expose API keys in browser code, frontend bundles, mobile apps, or any
> environment accessible to end users. API key authentication is intended
> exclusively for server-side backends, CI/CD pipelines, and internal services.

```typescript
// SERVER-SIDE ONLY -- e.g., Node.js backend, serverless function, CLI tool
const yorauth = new YorAuth({
  applicationId: "your-app-uuid",
  baseUrl: process.env.YORAUTH_BASE_URL!,
  apiKey: process.env.YORAUTH_API_KEY!, // Load from environment variable, NEVER hardcode
});

// Or set/update later
yorauth.setApiKey(process.env.YORAUTH_API_KEY!);
```

If both a JWT token and API key are configured, the JWT token takes priority.

## API Reference

### `yorauth.auth` -- Authentication

Public endpoints for user registration, login, and credential management.

```typescript
// Register
const reg = await yorauth.auth.register({
  email: "user@example.com",
  password: "password123",
  name: "John Doe",
  metadata: { plan: "free" },
});

// Login
const login = await yorauth.auth.login({
  email: "user@example.com",
  password: "password123",
  remember_me: true,
});

// Logout (requires refresh token)
await yorauth.auth.logout(refreshToken);

// Refresh tokens
const tokens = await yorauth.auth.refreshToken(refreshToken);

// Password reset flow
await yorauth.auth.forgotPassword("user@example.com");
await yorauth.auth.resetPassword({
  token: "reset-token",
  email: "user@example.com",
  password: "newPassword123",
});

// Email verification
await yorauth.auth.verifyEmail("verification-token");
await yorauth.auth.resendVerification("user@example.com");

// Magic link (passwordless)
await yorauth.auth.requestMagicLink("user@example.com");
const result = await yorauth.auth.verifyMagicLink("magic-link-token");

// MFA verification (after login returns mfa_required)
const mfa = await yorauth.auth.verifyMfa({
  challenge_token: "challenge-token",
  code: "123456",
});
```

### `yorauth.users` -- User Profile

Requires JWT authentication and user ownership.

```typescript
// Get profile
const profile = await yorauth.users.getProfile("user-uuid");

// Update profile
const updated = await yorauth.users.updateProfile("user-uuid", {
  name: "Jane Smith",
  avatar_url: "https://example.com/avatar.jpg",
  metadata: { theme: "dark" },
});

// Change password
await yorauth.users.changePassword("user-uuid", {
  current_password: "oldPassword",
  new_password: "newPassword123",
  new_password_confirmation: "newPassword123",
});

// Delete account (soft delete)
await yorauth.users.deleteAccount("user-uuid");

// GDPR data export (rate limited: 1/hour)
const exportData = await yorauth.users.exportData("user-uuid");
```

### `yorauth.roles` -- RBAC Roles

Requires JWT authentication.

```typescript
// List roles (paginated)
const roles = await yorauth.roles.list({
  search: "admin",
  include_permissions: true,
  per_page: 20,
});

// Create role
const role = await yorauth.roles.create({
  name: "editor",
  display_name: "Content Editor",
  description: "Can create and edit content",
  permissions: ["posts:create", "posts:update", "posts:read"],
});

// Get role
const detail = await yorauth.roles.get("role-uuid");

// Update role
const updated = await yorauth.roles.update("role-uuid", {
  display_name: "Senior Editor",
  permissions: ["posts:create", "posts:update", "posts:read", "posts:delete"],
});

// Delete role
await yorauth.roles.delete("role-uuid");

// User role management
const userRoles = await yorauth.roles.getUserRoles("user-uuid");

await yorauth.roles.assignRole("user-uuid", {
  role_id: "role-uuid",
  scope: "project:abc",        // optional
  expires_at: "2025-12-31",    // optional
});

await yorauth.roles.removeRole("user-uuid", "role-uuid");

// Get computed permissions for a user
const perms = await yorauth.roles.getUserPermissions("user-uuid");
console.log(perms.permissions); // ["posts:create", "posts:read", ...]
```

### `yorauth.teams` -- Team Management

Requires JWT authentication.

```typescript
// List teams (paginated)
const teams = await yorauth.teams.list({ search: "engineering", per_page: 20 });

// Create team
const team = await yorauth.teams.create({
  name: "Engineering",
  description: "Engineering team",
  scope: "org:acme",
  metadata: { department: "tech" },
});

// Get team (includes members and roles)
const detail = await yorauth.teams.get("team-uuid");
console.log(detail.members, detail.roles);

// Update team
await yorauth.teams.update("team-uuid", { name: "Platform Engineering" });

// Delete team
await yorauth.teams.delete("team-uuid");

// Member management
const members = await yorauth.teams.getMembers("team-uuid");
await yorauth.teams.addMember("team-uuid", { user_id: "user-uuid" });
await yorauth.teams.removeMember("team-uuid", "user-uuid");

// Team role assignments
const roles = await yorauth.teams.getTeamRoles("team-uuid");
await yorauth.teams.assignTeamRole("team-uuid", {
  role_id: "role-uuid",
  scope: "project:abc",       // optional
  expires_at: "2027-01-01",   // optional
});
await yorauth.teams.removeTeamRole("team-uuid", "role-uuid");

// Get all teams for a user
const userTeams = await yorauth.teams.getUserTeams("user-uuid");
```

### `yorauth.permissions` -- Authorization Checks

Requires JWT authentication.

```typescript
// Single permission check
const check = await yorauth.permissions.check("user-uuid", "posts:create");
console.log(check.allowed); // true or false

// Bulk permission check (up to 50 at once)
const bulk = await yorauth.permissions.checkBulk("user-uuid", [
  "posts:create",
  "posts:delete",
  "users:manage",
]);
console.log(bulk.results); // { "posts:create": true, "posts:delete": false, ... }
```

### `yorauth.sessions` -- Session Management

Requires JWT authentication and user ownership.

```typescript
// List active sessions
const sessions = await yorauth.sessions.list("user-uuid");

// Revoke a specific session
await yorauth.sessions.destroy("user-uuid", "session-uuid");

// Revoke all sessions (logout everywhere)
const result = await yorauth.sessions.destroyAll("user-uuid");
console.log(`Revoked ${result.revoked_count} sessions`);
```

### `yorauth.mfa` -- Multi-Factor Authentication

Requires JWT authentication and user ownership.

```typescript
// Setup TOTP
const setup = await yorauth.mfa.setupTotp("user-uuid", "My Phone");
// Render QR code from setup.provisioning_uri

// Confirm with code from authenticator app
const confirm = await yorauth.mfa.confirmTotp("user-uuid", {
  method_id: setup.method_id,
  code: "123456",
});
// IMPORTANT: Store confirm.backup_codes securely

// Check MFA status
const status = await yorauth.mfa.getStatus("user-uuid");
console.log(status.mfa_enabled, status.backup_codes_remaining);

// Disable TOTP (requires password)
await yorauth.mfa.disableTotp("user-uuid", "currentPassword");

// Regenerate backup codes (requires password)
const codes = await yorauth.mfa.regenerateBackupCodes("user-uuid", "currentPassword");
```

### `yorauth.oidc` -- OpenID Connect

Client management requires JWT authentication. Discovery/JWKS are public.

```typescript
// OIDC Client management
const clients = await yorauth.oidc.listClients();

const client = await yorauth.oidc.createClient({
  name: "My SPA",
  redirect_uris: ["https://app.example.com/callback"],
  allowed_scopes: ["openid", "profile", "email"],
});
// IMPORTANT: Store client.client_secret securely

await yorauth.oidc.updateClient("client-uuid", { is_active: false });
await yorauth.oidc.deleteClient("client-uuid");

// OIDC Provider endpoints
const discovery = await yorauth.oidc.getDiscovery();
const jwks = await yorauth.oidc.getJwks();

// Authorization flow
const authz = await yorauth.oidc.authorize({
  response_type: "code",
  client_id: "client-id",
  redirect_uri: "https://app.example.com/callback",
  scope: "openid profile email",
  state: "random-state",
  nonce: "random-nonce",
  code_challenge: "challenge",
  code_challenge_method: "S256",
});

// Token exchange
const tokens = await yorauth.oidc.exchangeToken({
  grant_type: "authorization_code",
  code: authz.code,
  redirect_uri: "https://app.example.com/callback",
  client_id: "client-id",
  client_secret: "client-secret",
  code_verifier: "verifier",
});

// UserInfo
const userInfo = await yorauth.oidc.getUserInfo();
```

### `yorauth.webhooks` -- Webhook Management

Requires JWT authentication.

```typescript
// List webhooks
const webhooks = await yorauth.webhooks.list();

// Create webhook
const webhook = await yorauth.webhooks.create({
  url: "https://example.com/webhooks/yorauth",
  events: ["user.created", "user.login", "role.assigned"],
});
// IMPORTANT: Store webhook.secret to verify signatures

// Update webhook
await yorauth.webhooks.update("webhook-uuid", {
  events: ["user.created", "role.assigned", "role.removed"],
  is_active: true,
});

// View delivery history
const deliveries = await yorauth.webhooks.getDeliveries("webhook-uuid");

// Delete webhook
await yorauth.webhooks.delete("webhook-uuid");
```

### `yorauth.apiKeys` -- API Key Management

Requires JWT authentication.

```typescript
// List API keys
const keys = await yorauth.apiKeys.list();

// Create API key
const result = await yorauth.apiKeys.create({
  name: "CI/CD Pipeline",
  expires_at: "2026-01-01T00:00:00Z",
});
// IMPORTANT: Store result.data.key securely - shown only once!

// Get API key details
const key = await yorauth.apiKeys.get("key-uuid");

// Revoke API key
await yorauth.apiKeys.delete("key-uuid");
```

### `yorauth.auditLogs` -- Audit Logs

Requires JWT authentication.

```typescript
// List recent logs
const logs = await yorauth.auditLogs.list();

// Filter by action
const roleEvents = await yorauth.auditLogs.list({
  action: "role.assigned",
  limit: 25,
});

// Filter by target user
const userEvents = await yorauth.auditLogs.list({
  target_user_id: "user-uuid",
});
```

### `yorauth.passkeys` -- Passkey (WebAuthn) Authentication

Authentication ceremonies are public. Credential management requires JWT + user ownership.

```typescript
// Passwordless login with a passkey
const options = await yorauth.passkeys.authenticateOptions();
// Pass options to navigator.credentials.get() in the browser
const credential = await navigator.credentials.get({ publicKey: options });
const authResult = await yorauth.passkeys.authenticateVerify(credential);
yorauth.setToken(authResult.access_token);

// Register a new passkey (authenticated)
const regOptions = await yorauth.passkeys.registerOptions("user-uuid");
const newCred = await navigator.credentials.create({ publicKey: regOptions });
await yorauth.passkeys.registerVerify("user-uuid", newCred);

// List, update, and delete passkeys
const passkeys = await yorauth.passkeys.list("user-uuid");
await yorauth.passkeys.update("user-uuid", "credential-id", { name: "My Laptop" });
await yorauth.passkeys.delete("user-uuid", "credential-id");
```

### `yorauth.saml` -- SAML SSO

Public endpoints for SAML single sign-on.

```typescript
// List available SAML connections
const connections = await yorauth.saml.getConnections();

// Initiate SAML login
const saml = await yorauth.saml.initiate({
  connection_id: "connection-uuid",
  relay_state: "https://app.example.com/dashboard",
});
// Redirect user to saml.redirect_url
```

### `yorauth.userAttributes` -- User Attributes (ABAC)

Requires JWT authentication. Read requires `attributes:read`, write/delete require `attributes:manage`.

```typescript
// Get all attributes for a user
const attrs = await yorauth.userAttributes.get("user-uuid");

// Set attributes (merges with existing)
await yorauth.userAttributes.set("user-uuid", {
  department: "engineering",
  clearance_level: "secret",
});

// Delete a specific attribute
await yorauth.userAttributes.delete("user-uuid", "clearance_level");
```

### OIDC Device Authorization (RFC 8628)

For devices without browsers (TVs, CLIs, IoT).

```typescript
// Start device authorization flow
const device = await yorauth.oidc.deviceAuthorize({
  client_id: "client-id",
  scope: "openid profile",
});
// Display device.user_code and device.verification_uri to user

// Poll for token (device client)
const tokens = await yorauth.oidc.deviceCodeToken({
  grant_type: "urn:ietf:params:oauth:grant-type:device_code",
  device_code: device.device_code,
  client_id: "client-id",
});
```

### OIDC Client Credentials (RFC 6749 Section 4.4)

Service-to-service authentication without user context.

```typescript
const tokens = await yorauth.oidc.clientCredentialsToken({
  grant_type: "client_credentials",
  client_id: "client-id",
  client_secret: "client-secret",
  scope: "api:read",
});
```

### OIDC Logout

```typescript
// Build RP-Initiated Logout URL
const logoutUrl = yorauth.oidc.buildLogoutUrl({
  id_token_hint: "id-token",
  post_logout_redirect_uri: "https://app.example.com",
});
// Redirect user to logoutUrl
```

### CAPTCHA Status

```typescript
// Check if CAPTCHA is enabled for this application
const captcha = await yorauth.auth.getCaptchaStatus();
if (captcha.enabled) {
  console.log(captcha.provider, captcha.site_key);
}
```

### Consent Withdrawal (GDPR)

```typescript
// Withdraw consent and delete all user data (irreversible)
await yorauth.users.withdrawConsent("user-uuid");
```

## Error Handling

All API errors throw a `YorAuthError` with structured information:

```typescript
import { YorAuth, YorAuthError } from "@yorauth/js-sdk";

try {
  await yorauth.auth.login({
    email: "user@example.com",
    password: "wrong-password",
  });
} catch (error) {
  if (error instanceof YorAuthError) {
    console.error(error.code);    // "AUTH_INVALID_CREDENTIALS"
    console.error(error.status);  // 401
    console.error(error.message); // "Invalid email or password."

    // Validation errors include field-level details
    if (error.details) {
      console.error(error.details); // { email: ["The email field is required."] }
    }
  }
}
```

### Error Codes

| Code | Status | Description |
|------|--------|-------------|
| `AUTH_INVALID_CREDENTIALS` | 401 | Wrong email or password |
| `AUTH_ACCOUNT_LOCKED` | 429 | Too many failed attempts |
| `AUTH_INVALID_REFRESH_TOKEN` | 401 | Refresh token is invalid or revoked |
| `AUTH_INVALID_MFA_CODE` | 401 | Wrong MFA code |
| `AUTH_MFA_CHALLENGE_EXPIRED` | 410 | MFA challenge timed out |
| `VALIDATION_ERROR` | 422 | Request validation failed |
| `USER_NOT_FOUND` | 404 | User does not exist |
| `REQUEST_TIMEOUT` | 0 | Request timed out |
| `NETWORK_ERROR` | 0 | Network connectivity issue |

## TypeScript

The SDK is written in TypeScript with strict mode enabled. All public methods, parameters, and return types are fully typed.

```typescript
import type {
  AppUser,
  AuthResponse,
  Role,
  Permission,
  PermissionCheckResult,
  MfaStatus,
  OidcClient,
  WebhookConfig,
  AuditLog,
} from "@yorauth/js-sdk";
```

## Configuration

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `applicationId` | `string` | **required** | Your YorAuth application UUID |
| `baseUrl` | `string` | **required** | API base URL (e.g. `process.env.YORAUTH_BASE_URL`) |
| `token` | `string` | `undefined` | JWT Bearer token |
| `apiKey` | `string` | `undefined` | **SERVER-SIDE ONLY.** API key for server-to-server auth. Never expose in client-side code. |
| `refreshToken` | `string` | `undefined` | Refresh token for automatic token refresh on 401 |
| `timeout` | `number` | `30000` | Request timeout in milliseconds |
| `dangerouslyAllowBrowser` | `boolean` | `false` | Override browser detection safety check. Only for Electron or SSR hydration contexts. |

## License

MIT

## Security

For security concerns, responsible disclosure, and best practices for credential management, see [SECURITY.md](./SECURITY.md) and our [Security Best Practices](https://docs.yorauth.com/security-best-practices) documentation.
