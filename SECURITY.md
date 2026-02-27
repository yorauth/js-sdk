# Security Policy

## Reporting Vulnerabilities

If you discover a security vulnerability in this SDK, please report it responsibly:

- **Email:** security@yorauth.com
- **Do NOT** open a public GitHub issue for security vulnerabilities

We will acknowledge receipt within 48 hours and provide a detailed response within 5 business days.

## Supported Versions

| Version | Supported |
|---------|-----------|
| 1.x     | Yes       |
| < 1.0   | No        |

## Security Best Practices

### Environment Requirements

This SDK is designed exclusively for server-side environments (Node.js 18+, Deno, Bun).
**DO NOT** use this SDK in browser, frontend, or client-side JavaScript environments.
The SDK throws an error if API key authentication is detected in a browser environment.

For browser/frontend integration, use
[@yorauth/vue-sdk](https://www.npmjs.com/package/@yorauth/vue-sdk) (Nuxt.js) or
[@yorauth/react-sdk](https://www.npmjs.com/package/@yorauth/react-sdk) (Next.js),
which are designed for SSR frameworks that keep secrets on the server.

### Credential Management

- Store API keys and secrets in environment variables, never in source code
- Never commit `.env` files or configuration containing secrets to version control
- Rotate API keys regularly and revoke compromised keys immediately
- Use the minimum required permissions for API keys
- Do not log, print, or output API keys, tokens, or client secrets

### If You Suspect Credential Exposure

1. **Immediately rotate the exposed credential** in the YorAuth Dashboard
2. Review your audit logs for unauthorized activity
3. If unauthorized access to user data occurred, follow your incident response plan
4. Contact security@yorauth.com

## Runtime Security Features

This SDK includes runtime browser environment detection. If an API key is provided
in a detected browser environment, the SDK throws an error to prevent credential
exposure. This check runs automatically when the `YorAuth` client is instantiated
with an `apiKey` configuration option.

If you are running in a server-side environment that has browser globals (e.g.,
Electron, SSR hydration), you can set `dangerouslyAllowBrowser: true` in the
configuration to bypass this check. Using this option in production browser code
is strongly discouraged and may void certain warranty protections under the
[Terms of Service](https://yorauth.com/legal/terms).

## Additional Resources

- [Security Best Practices](https://docs.yorauth.com/security-best-practices)
- [API Key Management](https://docs.yorauth.com/sdks/javascript/installation#security)
- [Terms of Service](https://yorauth.com/legal/terms)
