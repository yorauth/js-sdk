import { describe, it, expect, beforeEach, afterEach } from 'vitest';
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
import { TeamResource } from '../src/resources/teams.js';
import { WebhookResource } from '../src/resources/webhooks.js';

describe('YorAuth Client', () => {
  describe('constructor', () => {
    it('should create client with required applicationId and baseUrl', () => {
      const client = new YorAuth({
        applicationId: 'test-app-id',
        baseUrl: 'https://test.yorauth.example.com',
      });

      expect(client).toBeInstanceOf(YorAuth);
      expect(client.getToken()).toBeUndefined();
      expect(client.getApiKey()).toBeUndefined();
      expect(client.getRefreshToken()).toBeUndefined();
    });

    it('should throw error when applicationId is missing', () => {
      expect(() => {
        // @ts-expect-error - Testing missing applicationId
        new YorAuth({ baseUrl: 'https://test.yorauth.example.com' });
      }).toThrow('YorAuth: applicationId is required');
    });

    it('should throw error when baseUrl is missing', () => {
      expect(() => {
        // @ts-expect-error - Testing missing baseUrl
        new YorAuth({ applicationId: 'test-app-id' });
      }).toThrow('YorAuth: baseUrl is required');
    });

    it('should accept optional token, apiKey, and refreshToken', () => {
      const client = new YorAuth({
        applicationId: 'test-app-id',
        baseUrl: 'https://test.yorauth.example.com',
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
      const client = new YorAuth({ applicationId: 'test-app-id', baseUrl: 'https://test.yorauth.example.com' });

      client.setToken('new-token');
      expect(client.getToken()).toBe('new-token');
    });

    it('should clear token when set to undefined', () => {
      const client = new YorAuth({
        applicationId: 'test-app-id',
        baseUrl: 'https://test.yorauth.example.com',
        token: 'initial-token',
      });

      client.setToken(undefined);
      expect(client.getToken()).toBeUndefined();
    });
  });

  describe('setApiKey / getApiKey', () => {
    it('should set and get API key', () => {
      const client = new YorAuth({ applicationId: 'test-app-id', baseUrl: 'https://test.yorauth.example.com' });

      client.setApiKey('new-api-key');
      expect(client.getApiKey()).toBe('new-api-key');
    });

    it('should clear API key when set to undefined', () => {
      const client = new YorAuth({
        applicationId: 'test-app-id',
        baseUrl: 'https://test.yorauth.example.com',
        apiKey: 'initial-api-key',
      });

      client.setApiKey(undefined);
      expect(client.getApiKey()).toBeUndefined();
    });
  });

  describe('setRefreshToken / getRefreshToken', () => {
    it('should set and get refresh token', () => {
      const client = new YorAuth({ applicationId: 'test-app-id', baseUrl: 'https://test.yorauth.example.com' });

      client.setRefreshToken('new-refresh-token');
      expect(client.getRefreshToken()).toBe('new-refresh-token');
    });

    it('should clear refresh token when set to undefined', () => {
      const client = new YorAuth({
        applicationId: 'test-app-id',
        baseUrl: 'https://test.yorauth.example.com',
        refreshToken: 'initial-refresh-token',
      });

      client.setRefreshToken(undefined);
      expect(client.getRefreshToken()).toBeUndefined();
    });
  });

  describe('onTokenRefreshed', () => {
    it('should set token refresh callback', () => {
      const client = new YorAuth({ applicationId: 'test-app-id', baseUrl: 'https://test.yorauth.example.com' });
      const callback = vi.fn();

      client.onTokenRefreshed(callback);

      // Callback is set but not invoked until actual refresh happens
      expect(callback).not.toHaveBeenCalled();
    });

    it('should clear callback when set to undefined', () => {
      const client = new YorAuth({ applicationId: 'test-app-id', baseUrl: 'https://test.yorauth.example.com' });
      const callback = vi.fn();

      client.onTokenRefreshed(callback);
      client.onTokenRefreshed(undefined);

      // No way to directly test this without triggering a refresh, but ensures no error
      expect(client).toBeInstanceOf(YorAuth);
    });
  });

  describe('resource accessors', () => {
    it('should expose auth resource', () => {
      const client = new YorAuth({ applicationId: 'test-app-id', baseUrl: 'https://test.yorauth.example.com' });
      expect(client.auth).toBeInstanceOf(AuthResource);
    });

    it('should expose users resource', () => {
      const client = new YorAuth({ applicationId: 'test-app-id', baseUrl: 'https://test.yorauth.example.com' });
      expect(client.users).toBeInstanceOf(UserResource);
    });

    it('should expose roles resource', () => {
      const client = new YorAuth({ applicationId: 'test-app-id', baseUrl: 'https://test.yorauth.example.com' });
      expect(client.roles).toBeInstanceOf(RoleResource);
    });

    it('should expose permissions resource', () => {
      const client = new YorAuth({ applicationId: 'test-app-id', baseUrl: 'https://test.yorauth.example.com' });
      expect(client.permissions).toBeInstanceOf(PermissionsResource);
    });

    it('should expose sessions resource', () => {
      const client = new YorAuth({ applicationId: 'test-app-id', baseUrl: 'https://test.yorauth.example.com' });
      expect(client.sessions).toBeInstanceOf(SessionResource);
    });

    it('should expose mfa resource', () => {
      const client = new YorAuth({ applicationId: 'test-app-id', baseUrl: 'https://test.yorauth.example.com' });
      expect(client.mfa).toBeInstanceOf(MfaResource);
    });

    it('should expose oidc resource', () => {
      const client = new YorAuth({ applicationId: 'test-app-id', baseUrl: 'https://test.yorauth.example.com' });
      expect(client.oidc).toBeInstanceOf(OidcResource);
    });

    it('should expose webhooks resource', () => {
      const client = new YorAuth({ applicationId: 'test-app-id', baseUrl: 'https://test.yorauth.example.com' });
      expect(client.webhooks).toBeInstanceOf(WebhookResource);
    });

    it('should expose apiKeys resource', () => {
      const client = new YorAuth({ applicationId: 'test-app-id', baseUrl: 'https://test.yorauth.example.com' });
      expect(client.apiKeys).toBeInstanceOf(ApiKeyResource);
    });

    it('should expose teams resource', () => {
      const client = new YorAuth({ applicationId: 'test-app-id', baseUrl: 'https://test.yorauth.example.com' });
      expect(client.teams).toBeInstanceOf(TeamResource);
    });

    it('should expose auditLogs resource', () => {
      const client = new YorAuth({ applicationId: 'test-app-id', baseUrl: 'https://test.yorauth.example.com' });
      expect(client.auditLogs).toBeInstanceOf(AuditLogResource);
    });
  });

  describe('browser environment detection', () => {
    const originalWindow = globalThis.window;
    const originalDocument = globalThis.document;

    afterEach(() => {
      // Restore original globals after each test
      if (originalWindow === undefined) {
        delete (globalThis as Record<string, unknown>).window;
      } else {
        (globalThis as Record<string, unknown>).window = originalWindow;
      }
      if (originalDocument === undefined) {
        delete (globalThis as Record<string, unknown>).document;
      } else {
        (globalThis as Record<string, unknown>).document = originalDocument;
      }
    });

    function simulateBrowser(): void {
      (globalThis as Record<string, unknown>).window = {};
      (globalThis as Record<string, unknown>).document = {};
    }

    function removeBrowserGlobals(): void {
      delete (globalThis as Record<string, unknown>).window;
      delete (globalThis as Record<string, unknown>).document;
    }

    it('should throw when apiKey is set in a browser environment', () => {
      simulateBrowser();

      expect(() => {
        new YorAuth({
          applicationId: 'test-app-id',
          baseUrl: 'https://test.yorauth.example.com',
          apiKey: 'ya_live_test123',
        });
      }).toThrow('YorAuth SECURITY ERROR');
    });

    it('should include actionable guidance in the error message', () => {
      simulateBrowser();

      expect(() => {
        new YorAuth({
          applicationId: 'test-app-id',
          baseUrl: 'https://test.yorauth.example.com',
          apiKey: 'ya_live_test123',
        });
      }).toThrow('dangerouslyAllowBrowser');
    });

    it('should NOT throw when apiKey is set without browser globals', () => {
      removeBrowserGlobals();

      const client = new YorAuth({
        applicationId: 'test-app-id',
        baseUrl: 'https://test.yorauth.example.com',
        apiKey: 'ya_live_test123',
      });

      expect(client).toBeInstanceOf(YorAuth);
      expect(client.getApiKey()).toBe('ya_live_test123');
    });

    it('should NOT throw when dangerouslyAllowBrowser is true even in a browser', () => {
      simulateBrowser();

      const client = new YorAuth({
        applicationId: 'test-app-id',
        baseUrl: 'https://test.yorauth.example.com',
        apiKey: 'ya_live_test123',
        dangerouslyAllowBrowser: true,
      });

      expect(client).toBeInstanceOf(YorAuth);
      expect(client.getApiKey()).toBe('ya_live_test123');
    });

    it('should NOT throw when only token is set in a browser environment', () => {
      simulateBrowser();

      const client = new YorAuth({
        applicationId: 'test-app-id',
        baseUrl: 'https://test.yorauth.example.com',
        token: 'eyJhbGciOiJSUzI1NiI...',
      });

      expect(client).toBeInstanceOf(YorAuth);
      expect(client.getToken()).toBe('eyJhbGciOiJSUzI1NiI...');
    });

    it('should NOT throw when no auth credentials are set in a browser environment', () => {
      simulateBrowser();

      const client = new YorAuth({
        applicationId: 'test-app-id',
        baseUrl: 'https://test.yorauth.example.com',
      });

      expect(client).toBeInstanceOf(YorAuth);
    });

    it('should NOT throw when only refreshToken is set in a browser environment', () => {
      simulateBrowser();

      const client = new YorAuth({
        applicationId: 'test-app-id',
        baseUrl: 'https://test.yorauth.example.com',
        refreshToken: 'test-refresh-token',
      });

      expect(client).toBeInstanceOf(YorAuth);
    });

    it('should throw when both apiKey and token are set in a browser (apiKey triggers it)', () => {
      simulateBrowser();

      expect(() => {
        new YorAuth({
          applicationId: 'test-app-id',
          baseUrl: 'https://test.yorauth.example.com',
          apiKey: 'ya_live_test123',
          token: 'eyJhbGciOiJSUzI1NiI...',
        });
      }).toThrow('YorAuth SECURITY ERROR');
    });
  });
});
