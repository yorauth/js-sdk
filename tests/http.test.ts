import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { HttpClient } from '../src/http.js';
import { YorAuthError } from '../src/errors.js';
import { createMockHttpClient, mockFetchResponse, mockErrorResponse, mock204Response } from './helpers.js';

describe('HttpClient', () => {
  let mockFetch: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockFetch = vi.fn();
    globalThis.fetch = mockFetch;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('request', () => {
    it('should perform GET request', async () => {
      const http = createMockHttpClient();
      mockFetch.mockResolvedValueOnce(mockFetchResponse({ data: 'test' }));

      await http.request('GET', 'https://api.yorauth.dev/test');

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.yorauth.dev/test',
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            Accept: 'application/json',
          }),
        })
      );
    });

    it('should perform POST request with body', async () => {
      const http = createMockHttpClient();
      mockFetch.mockResolvedValueOnce(mockFetchResponse({ data: 'test' }));

      await http.request('POST', 'https://api.yorauth.dev/test', {
        body: { key: 'value' },
      });

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.yorauth.dev/test',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            Accept: 'application/json',
            'Content-Type': 'application/json',
          }),
          body: JSON.stringify({ key: 'value' }),
        })
      );
    });

    it('should perform PUT request', async () => {
      const http = createMockHttpClient();
      mockFetch.mockResolvedValueOnce(mockFetchResponse({ updated: true }));

      await http.request('PUT', 'https://api.yorauth.dev/test', {
        body: { name: 'updated' },
      });

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.yorauth.dev/test',
        expect.objectContaining({
          method: 'PUT',
        })
      );
    });

    it('should perform DELETE request', async () => {
      const http = createMockHttpClient();
      mockFetch.mockResolvedValueOnce(mock204Response());

      await http.request('DELETE', 'https://api.yorauth.dev/test');

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.yorauth.dev/test',
        expect.objectContaining({
          method: 'DELETE',
        })
      );
    });

    it('should perform PATCH request', async () => {
      const http = createMockHttpClient();
      mockFetch.mockResolvedValueOnce(mockFetchResponse({ patched: true }));

      await http.request('PATCH', 'https://api.yorauth.dev/test', {
        body: { field: 'value' },
      });

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.yorauth.dev/test',
        expect.objectContaining({
          method: 'PATCH',
        })
      );
    });
  });

  describe('authentication headers', () => {
    it('should send Bearer token when token is set', async () => {
      const http = createMockHttpClient({
        baseUrl: 'https://api.yorauth.dev',
        applicationId: 'test-app-id',
        timeout: 5000,
        getToken: () => 'test-token',
        getApiKey: () => undefined,
        getRefreshToken: () => undefined,
        onRefreshSuccess: () => {},
      });
      mockFetch.mockResolvedValueOnce(mockFetchResponse({ data: 'test' }));

      await http.request('GET', 'https://api.yorauth.dev/test');

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: 'Bearer test-token',
          }),
        })
      );
    });

    it('should send X-API-Key when API key is set', async () => {
      const http = createMockHttpClient({
        baseUrl: 'https://api.yorauth.dev',
        applicationId: 'test-app-id',
        timeout: 5000,
        getToken: () => undefined,
        getApiKey: () => 'test-api-key',
        getRefreshToken: () => undefined,
        onRefreshSuccess: () => {},
      });
      mockFetch.mockResolvedValueOnce(mockFetchResponse({ data: 'test' }));

      await http.request('GET', 'https://api.yorauth.dev/test');

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            'X-API-Key': 'test-api-key',
          }),
        })
      );
    });

    it('should prefer Bearer token over API key', async () => {
      const http = createMockHttpClient({
        baseUrl: 'https://api.yorauth.dev',
        applicationId: 'test-app-id',
        timeout: 5000,
        getToken: () => 'test-token',
        getApiKey: () => 'test-api-key',
        getRefreshToken: () => undefined,
        onRefreshSuccess: () => {},
      });
      mockFetch.mockResolvedValueOnce(mockFetchResponse({ data: 'test' }));

      await http.request('GET', 'https://api.yorauth.dev/test');

      const call = mockFetch.mock.calls[0];
      const headers = call[1].headers;
      expect(headers.Authorization).toBe('Bearer test-token');
      expect(headers['X-API-Key']).toBeUndefined();
    });

    it('should not send auth headers when neither token nor API key is set', async () => {
      const http = createMockHttpClient({
        baseUrl: 'https://api.yorauth.dev',
        applicationId: 'test-app-id',
        timeout: 5000,
        getToken: () => undefined,
        getApiKey: () => undefined,
        getRefreshToken: () => undefined,
        onRefreshSuccess: () => {},
      });
      mockFetch.mockResolvedValueOnce(mockFetchResponse({ data: 'test' }));

      await http.request('GET', 'https://api.yorauth.dev/test');

      const call = mockFetch.mock.calls[0];
      const headers = call[1].headers;
      expect(headers.Authorization).toBeUndefined();
      expect(headers['X-API-Key']).toBeUndefined();
    });
  });

  describe('query parameters', () => {
    it('should append query parameters to URL', async () => {
      const http = createMockHttpClient();
      mockFetch.mockResolvedValueOnce(mockFetchResponse({ data: 'test' }));

      await http.request('GET', 'https://api.yorauth.dev/test', {
        params: { foo: 'bar', limit: 10, active: true },
      });

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.yorauth.dev/test?foo=bar&limit=10&active=true',
        expect.any(Object)
      );
    });

    it('should skip undefined query parameters', async () => {
      const http = createMockHttpClient();
      mockFetch.mockResolvedValueOnce(mockFetchResponse({ data: 'test' }));

      await http.request('GET', 'https://api.yorauth.dev/test', {
        params: { foo: 'bar', skip: undefined, limit: 10 },
      });

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.yorauth.dev/test?foo=bar&limit=10',
        expect.any(Object)
      );
    });
  });

  describe('body serialization', () => {
    it('should serialize request body as JSON', async () => {
      const http = createMockHttpClient();
      mockFetch.mockResolvedValueOnce(mockFetchResponse({ data: 'test' }));

      const body = { name: 'test', nested: { value: 42 } };
      await http.request('POST', 'https://api.yorauth.dev/test', { body });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          body: JSON.stringify(body),
        })
      );
    });

    it('should not set Content-Type when body is undefined', async () => {
      const http = createMockHttpClient();
      mockFetch.mockResolvedValueOnce(mockFetchResponse({ data: 'test' }));

      await http.request('GET', 'https://api.yorauth.dev/test');

      const call = mockFetch.mock.calls[0];
      const headers = call[1].headers;
      expect(headers['Content-Type']).toBeUndefined();
    });
  });

  describe('204 No Content handling', () => {
    it('should return undefined for 204 responses', async () => {
      const http = createMockHttpClient();
      mockFetch.mockResolvedValueOnce(mock204Response());

      const result = await http.request('DELETE', 'https://api.yorauth.dev/test');

      expect(result).toBeUndefined();
    });
  });

  describe('error response parsing', () => {
    it('should parse structured YorAuth error', async () => {
      const http = createMockHttpClient();
      mockFetch.mockResolvedValueOnce(
        mockErrorResponse('Invalid credentials', 'AUTH_INVALID_CREDENTIALS', 401)
      );

      try {
        await http.request('POST', 'https://api.yorauth.dev/test');
        expect.unreachable('Should have thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(YorAuthError);
        const authError = error as YorAuthError;
        expect(authError.message).toBe('Invalid credentials');
        expect(authError.code).toBe('AUTH_INVALID_CREDENTIALS');
        expect(authError.status).toBe(401);
      }
    });

    it('should parse validation errors', async () => {
      const http = createMockHttpClient();
      const validationErrors = {
        email: ['The email field is required.'],
        password: ['The password must be at least 8 characters.'],
      };
      mockFetch.mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            message: 'Validation failed',
            errors: validationErrors,
          }),
          {
            status: 422,
            headers: { 'Content-Type': 'application/json' },
          }
        )
      );

      try {
        await http.request('POST', 'https://api.yorauth.dev/test');
      } catch (error) {
        expect(error).toBeInstanceOf(YorAuthError);
        const authError = error as YorAuthError;
        expect(authError.message).toBe('Validation failed');
        expect(authError.code).toBe('VALIDATION_ERROR');
        expect(authError.status).toBe(422);
        expect(authError.details).toEqual(validationErrors);
      }
    });

    it('should parse OIDC error format', async () => {
      const http = createMockHttpClient();
      mockFetch.mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            error: 'invalid_client',
            error_description: 'Client authentication failed',
          }),
          {
            status: 401,
            headers: { 'Content-Type': 'application/json' },
          }
        )
      );

      try {
        await http.request('POST', 'https://api.yorauth.dev/test');
      } catch (error) {
        expect(error).toBeInstanceOf(YorAuthError);
        const authError = error as YorAuthError;
        expect(authError.message).toBe('Client authentication failed');
        expect(authError.code).toBe('invalid_client');
        expect(authError.status).toBe(401);
      }
    });

    it('should handle OIDC error without description', async () => {
      const http = createMockHttpClient();
      mockFetch.mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            error: 'invalid_grant',
          }),
          {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
          }
        )
      );

      try {
        await http.request('POST', 'https://api.yorauth.dev/test');
      } catch (error) {
        expect(error).toBeInstanceOf(YorAuthError);
        const authError = error as YorAuthError;
        expect(authError.message).toBe('invalid_grant');
        expect(authError.code).toBe('invalid_grant');
      }
    });

    it('should handle non-JSON error responses', async () => {
      const http = createMockHttpClient();
      mockFetch.mockResolvedValueOnce(
        new Response('Internal Server Error', {
          status: 500,
          headers: { 'Content-Type': 'text/plain' },
        })
      );

      try {
        await http.request('GET', 'https://api.yorauth.dev/test');
      } catch (error) {
        expect(error).toBeInstanceOf(YorAuthError);
        const authError = error as YorAuthError;
        expect(authError.message).toBe('Internal Server Error');
        expect(authError.code).toBe('HTTP_500');
        expect(authError.status).toBe(500);
      }
    });

    it('should handle empty error response body', async () => {
      const http = createMockHttpClient();
      mockFetch.mockResolvedValueOnce(
        new Response('', {
          status: 503,
          statusText: 'Service Unavailable',
        })
      );

      try {
        await http.request('GET', 'https://api.yorauth.dev/test');
      } catch (error) {
        expect(error).toBeInstanceOf(YorAuthError);
        const authError = error as YorAuthError;
        expect(authError.message).toBe('Service Unavailable');
        expect(authError.code).toBe('HTTP_503');
      }
    });
  });

  describe('timeout handling', () => {
    it('should abort request on timeout', async () => {
      const http = createMockHttpClient({
        baseUrl: 'https://api.yorauth.dev',
        applicationId: 'test-app-id',
        timeout: 100,
        getToken: () => undefined,
        getApiKey: () => undefined,
        getRefreshToken: () => undefined,
        onRefreshSuccess: () => {},
      });

      mockFetch.mockImplementationOnce(
        () =>
          new Promise((_, reject) => {
            setTimeout(() => {
              const error = new DOMException('Aborted', 'AbortError');
              reject(error);
            }, 50);
          })
      );

      try {
        await http.request('GET', 'https://api.yorauth.dev/slow');
      } catch (error) {
        expect(error).toBeInstanceOf(YorAuthError);
        const authError = error as YorAuthError;
        expect(authError.message).toContain('timed out');
        expect(authError.code).toBe('REQUEST_TIMEOUT');
        expect(authError.status).toBe(0);
      }
    });
  });

  describe('auto-refresh on 401', () => {
    it('should refresh token and retry request on 401 when refresh token is available', async () => {
      let tokenValue = 'old-token';
      const onRefreshSuccess = vi.fn((result) => {
        tokenValue = result.accessToken;
      });

      const http = new HttpClient({
        baseUrl: 'https://api.yorauth.dev',
        applicationId: 'test-app-id',
        timeout: 5000,
        getToken: () => tokenValue,
        getApiKey: () => undefined,
        getRefreshToken: () => 'refresh-token',
        onRefreshSuccess,
      });

      // First call returns 401
      mockFetch.mockResolvedValueOnce(
        mockErrorResponse('Token expired', 'TOKEN_EXPIRED', 401)
      );

      // Refresh token endpoint returns new tokens
      mockFetch.mockResolvedValueOnce(
        mockFetchResponse({
          data: {
            access_token: 'new-token',
            refresh_token: 'new-refresh-token',
            expires_in: 3600,
          },
        })
      );

      // Retry with new token succeeds
      mockFetch.mockResolvedValueOnce(mockFetchResponse({ data: 'success' }));

      const result = await http.request('GET', 'https://api.yorauth.dev/test');

      expect(result).toEqual({ data: 'success' });
      expect(onRefreshSuccess).toHaveBeenCalledWith({
        accessToken: 'new-token',
        refreshToken: 'new-refresh-token',
        expiresIn: 3600,
        user: undefined,
      });
      expect(mockFetch).toHaveBeenCalledTimes(3);
    });

    it('should not auto-refresh when refresh token is not available', async () => {
      const http = createMockHttpClient({
        baseUrl: 'https://api.yorauth.dev',
        applicationId: 'test-app-id',
        timeout: 5000,
        getToken: () => 'test-token',
        getApiKey: () => undefined,
        getRefreshToken: () => undefined, // No refresh token
        onRefreshSuccess: () => {},
      });

      mockFetch.mockResolvedValueOnce(
        mockErrorResponse('Token expired', 'TOKEN_EXPIRED', 401)
      );

      try {
        await http.request('GET', 'https://api.yorauth.dev/test');
      } catch (error) {
        expect(error).toBeInstanceOf(YorAuthError);
        const authError = error as YorAuthError;
        expect(authError.status).toBe(401);
      }

      // Should not attempt refresh
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it('should throw original 401 error when refresh fails', async () => {
      const http = new HttpClient({
        baseUrl: 'https://api.yorauth.dev',
        applicationId: 'test-app-id',
        timeout: 5000,
        getToken: () => 'old-token',
        getApiKey: () => undefined,
        getRefreshToken: () => 'invalid-refresh-token',
        onRefreshSuccess: () => {},
      });

      // Original request returns 401
      mockFetch.mockResolvedValueOnce(
        mockErrorResponse('Token expired', 'TOKEN_EXPIRED', 401)
      );

      // Refresh token request also fails
      mockFetch.mockResolvedValueOnce(
        mockErrorResponse('Invalid refresh token', 'INVALID_REFRESH_TOKEN', 401)
      );

      try {
        await http.request('GET', 'https://api.yorauth.dev/test');
      } catch (error) {
        expect(error).toBeInstanceOf(YorAuthError);
        const authError = error as YorAuthError;
        expect(authError.message).toBe('Token expired'); // Original error
        expect(authError.status).toBe(401);
      }
    });

    it('should deduplicate concurrent refresh requests', async () => {
      let tokenValue = 'old-token';
      const onRefreshSuccess = vi.fn((result) => {
        tokenValue = result.accessToken;
      });

      const http = new HttpClient({
        baseUrl: 'https://api.yorauth.dev',
        applicationId: 'test-app-id',
        timeout: 5000,
        getToken: () => tokenValue,
        getApiKey: () => undefined,
        getRefreshToken: () => 'refresh-token',
        onRefreshSuccess,
      });

      // Two requests that both return 401
      mockFetch
        .mockResolvedValueOnce(mockErrorResponse('Token expired', 'TOKEN_EXPIRED', 401))
        .mockResolvedValueOnce(mockErrorResponse('Token expired', 'TOKEN_EXPIRED', 401));

      // Single refresh response
      mockFetch.mockResolvedValueOnce(
        mockFetchResponse({
          data: {
            access_token: 'new-token',
            refresh_token: 'new-refresh-token',
            expires_in: 3600,
          },
        })
      );

      // Both retries succeed
      mockFetch
        .mockResolvedValueOnce(mockFetchResponse({ data: 'success1' }))
        .mockResolvedValueOnce(mockFetchResponse({ data: 'success2' }));

      // Fire two concurrent requests
      const [result1, result2] = await Promise.all([
        http.request('GET', 'https://api.yorauth.dev/test1'),
        http.request('GET', 'https://api.yorauth.dev/test2'),
      ]);

      expect(result1).toEqual({ data: 'success1' });
      expect(result2).toEqual({ data: 'success2' });

      // Should only call refresh endpoint once (deduplication)
      // 2 initial requests + 1 refresh + 2 retries = 5 total
      expect(mockFetch).toHaveBeenCalledTimes(5);
    });
  });

  describe('buildAppUrl', () => {
    it('should build application-scoped URL', () => {
      const http = createMockHttpClient();
      const url = http.buildAppUrl('users/register');

      expect(url).toBe('https://api.yorauth.dev/api/v1/applications/test-app-id/users/register');
    });

    it('should strip leading slashes from path', () => {
      const http = createMockHttpClient();
      const url = http.buildAppUrl('/users/register');

      expect(url).toBe('https://api.yorauth.dev/api/v1/applications/test-app-id/users/register');
    });

    it('should handle base URL with trailing slash', () => {
      const http = new HttpClient({
        baseUrl: 'https://api.yorauth.dev/',
        applicationId: 'test-app-id',
        timeout: 5000,
        getToken: () => undefined,
        getApiKey: () => undefined,
        getRefreshToken: () => undefined,
        onRefreshSuccess: () => {},
      });

      const url = http.buildAppUrl('users');
      expect(url).toBe('https://api.yorauth.dev/api/v1/applications/test-app-id/users');
    });
  });

  describe('buildRootUrl', () => {
    it('should build non-scoped URL', () => {
      const http = createMockHttpClient();
      const url = http.buildRootUrl('.well-known/openid-configuration');

      expect(url).toBe('https://api.yorauth.dev/.well-known/openid-configuration');
    });

    it('should strip leading slashes from path', () => {
      const http = createMockHttpClient();
      const url = http.buildRootUrl('/.well-known/openid-configuration');

      expect(url).toBe('https://api.yorauth.dev/.well-known/openid-configuration');
    });
  });

  describe('network errors', () => {
    it('should wrap network errors in YorAuthError', async () => {
      const http = createMockHttpClient();
      mockFetch.mockRejectedValueOnce(new Error('Network connection failed'));

      try {
        await http.request('GET', 'https://api.yorauth.dev/test');
      } catch (error) {
        expect(error).toBeInstanceOf(YorAuthError);
        const authError = error as YorAuthError;
        expect(authError.message).toBe('Network connection failed');
        expect(authError.code).toBe('NETWORK_ERROR');
        expect(authError.status).toBe(0);
      }
    });

    it('should handle unknown errors', async () => {
      const http = createMockHttpClient();
      mockFetch.mockRejectedValueOnce('Unknown error');

      try {
        await http.request('GET', 'https://api.yorauth.dev/test');
      } catch (error) {
        expect(error).toBeInstanceOf(YorAuthError);
        const authError = error as YorAuthError;
        expect(authError.message).toBe('An unknown error occurred');
        expect(authError.code).toBe('NETWORK_ERROR');
      }
    });
  });
});
