# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Security

- Added SECURITY.md with responsible disclosure policy and credential management guidance
- Added runtime browser environment detection -- throws an error when API key authentication is used in a browser context
- Added `dangerouslyAllowBrowser` configuration option for legitimate server-side rendering contexts
- Added JSDoc `@security` annotations to all methods that handle sensitive credentials
- Added security disclaimers and warnings to README for credential exposure prevention
- Updated package.json description to signal server-side-only usage

## [1.0.0] - 2026-02-17

### Added
- Team management resource: list, create, get, update, delete teams; manage members and team roles; get user teams
- `YorAuth` client with configurable base URL, application ID, and timeout
- Authentication resource: login, register, logout, token refresh, password reset, email verification, magic links
- User resource: profile get/update, password change, account deletion, GDPR data export
- Role resource: CRUD operations, user-role assignments
- Permissions resource: single and bulk permission checks
- Session resource: list, destroy individual, destroy all
- MFA resource: TOTP setup/confirm/disable, status, backup code regeneration
- OIDC resource: client management, discovery, JWKS, authorize, token exchange, userinfo
- Webhook resource: CRUD operations, delivery log access
- API Key resource: list, create, retrieve, revoke
- Audit Log resource: list with filters
- Webhook signature verification utility
- Automatic token refresh on 401 with concurrent request deduplication
- Custom `YorAuthError` class with structured error details
- ESM and CJS dual-format output
- Full TypeScript type definitions
