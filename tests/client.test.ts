import { describe, it, expect } from 'vitest';
import { YorAuth } from '../src/client.js';
import { ApiKeyResource } from '../src/resources/api-keys.js';
import { AuditLogResource } from '../src/resources/audit-logs.js';
import { AuthResource } from '../src/resources/auth.js';
import { MfaResource } from '../src/resources/mfa.js';
import { OidcResource } from '../src/resources/oidc.js';
import { PermissionsResource } from '../src/resources/permissions.js';
import { RoleResource } from '../src/resources/roles.js';
import { SessionResource } from '../src/resources/sessions.js';
import { UserResource } from '../src/resources/users.js';
import { WebhookResource } from '../src/resources/webhooks.js';

describe('YorAuth Client', () => {
  describe('constructor', () => {
    it('should create client with required applicationId', () => {
      const client = new YorAuth({
        applicationId: 'test-app-id',
      });

      expect(client).toBeInstanceOf(YorAuth);
      expect(client.getToken()).toBeUndefined();
      expect(client.getApiKey()).toBeUndefined();
      expect(client.getRefreshToken()).toBeUndefined();
    });

    it('should throw error when applicationId is missing', () => {
      expect(() => {
        // @ts-expect-error - Testing missing applicationId
        new YorAuth({});
      }).toThrow('YorAuth: applicationId is required');
    });

    it('should accept optional token, apiKey, and refreshToken', () => {
      const client = new YorAuth({
        applicationId: 'test-app-id',
        token: 'test-token',
        apiKey: 'test-api-key',
        refreshToken: 'test-refresh-token',
      });

      expect(client.getToken()).toBe('test-token');
      expect(client.getApiKey()).toBe('test-api-key');
      expect(client.getRefreshToken()).toBe('test-refresh-token');
    });

    it('should accept optional baseUrl and timeout', () => {
      const client = new YorAuth({
        applicationId: 'test-app-id',
        baseUrl: 'https://custom.api.example.com',
        timeout: 10000,
      });

      expect(client).toBeInstanceOf(YorAuth);
    });
  });

  describe('setToken / getToken', () => {
    it('should set and get token', () => {
      const client = new YorAuth({ applicationId: 'test-app-id' });

      client.setToken('new-token');
      expect(client.getToken()).toBe('new-token');
    });

    it('should clear token when set to undefined', () => {
      const client = new YorAuth({
        applicationId: 'test-app-id',
        token: 'initial-token',
      });

      client.setToken(undefined);
      expect(client.getToken()).toBeUndefined();
    });
  });

  describe('setApiKey / getApiKey', () => {
    it('should set and get API key', () => {
      const client = new YorAuth({ applicationId: 'test-app-id' });

      client.setApiKey('new-api-key');
      expect(client.getApiKey()).toBe('new-api-key');
    });

    it('should clear API key when set to undefined', () => {
      const client = new YorAuth({
        applicationId: 'test-app-id',
        apiKey: 'initial-api-key',
      });

      client.setApiKey(undefined);
      expect(client.getApiKey()).toBeUndefined();
    });
  });

  describe('setRefreshToken / getRefreshToken', () => {
    it('should set and get refresh token', () => {
      const client = new YorAuth({ applicationId: 'test-app-id' });

      client.setRefreshToken('new-refresh-token');
      expect(client.getRefreshToken()).toBe('new-refresh-token');
    });

    it('should clear refresh token when set to undefined', () => {
      const client = new YorAuth({
        applicationId: 'test-app-id',
        refreshToken: 'initial-refresh-token',
      });

      client.setRefreshToken(undefined);
      expect(client.getRefreshToken()).toBeUndefined();
    });
  });

  describe('onTokenRefreshed', () => {
    it('should set token refresh callback', () => {
      const client = new YorAuth({ applicationId: 'test-app-id' });
      const callback = vi.fn();

      client.onTokenRefreshed(callback);

      // Callback is set but not invoked until actual refresh happens
      expect(callback).not.toHaveBeenCalled();
    });

    it('should clear callback when set to undefined', () => {
      const client = new YorAuth({ applicationId: 'test-app-id' });
      const callback = vi.fn();

      client.onTokenRefreshed(callback);
      client.onTokenRefreshed(undefined);

      // No way to directly test this without triggering a refresh, but ensures no error
      expect(client).toBeInstanceOf(YorAuth);
    });
  });

  describe('resource accessors', () => {
    it('should expose auth resource', () => {
      const client = new YorAuth({ applicationId: 'test-app-id' });
      expect(client.auth).toBeInstanceOf(AuthResource);
    });

    it('should expose users resource', () => {
      const client = new YorAuth({ applicationId: 'test-app-id' });
      expect(client.users).toBeInstanceOf(UserResource);
    });

    it('should expose roles resource', () => {
      const client = new YorAuth({ applicationId: 'test-app-id' });
      expect(client.roles).toBeInstanceOf(RoleResource);
    });

    it('should expose permissions resource', () => {
      const client = new YorAuth({ applicationId: 'test-app-id' });
      expect(client.permissions).toBeInstanceOf(PermissionsResource);
    });

    it('should expose sessions resource', () => {
      const client = new YorAuth({ applicationId: 'test-app-id' });
      expect(client.sessions).toBeInstanceOf(SessionResource);
    });

    it('should expose mfa resource', () => {
      const client = new YorAuth({ applicationId: 'test-app-id' });
      expect(client.mfa).toBeInstanceOf(MfaResource);
    });

    it('should expose oidc resource', () => {
      const client = new YorAuth({ applicationId: 'test-app-id' });
      expect(client.oidc).toBeInstanceOf(OidcResource);
    });

    it('should expose webhooks resource', () => {
      const client = new YorAuth({ applicationId: 'test-app-id' });
      expect(client.webhooks).toBeInstanceOf(WebhookResource);
    });

    it('should expose apiKeys resource', () => {
      const client = new YorAuth({ applicationId: 'test-app-id' });
      expect(client.apiKeys).toBeInstanceOf(ApiKeyResource);
    });

    it('should expose auditLogs resource', () => {
      const client = new YorAuth({ applicationId: 'test-app-id' });
      expect(client.auditLogs).toBeInstanceOf(AuditLogResource);
    });
  });
});
