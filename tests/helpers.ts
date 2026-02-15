import { HttpClient, type HttpClientConfig } from '../src/http.js';

/**
 * Create a mock HttpClient for testing with overridable config.
 */
export function createMockHttpClient(overrides?: Partial<HttpClientConfig>): HttpClient {
  return new HttpClient({
    baseUrl: 'https://api.yorauth.dev',
    applicationId: 'test-app-id',
    timeout: 5000,
    getToken: () => 'test-token',
    getApiKey: () => undefined,
    getRefreshToken: () => undefined,
    onRefreshSuccess: () => {},
    ...overrides,
  });
}

/**
 * Create a mock Response object with JSON data.
 */
export function mockFetchResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

/**
 * Create a mock error Response with YorAuth API error format.
 */
export function mockErrorResponse(
  message: string,
  code: string,
  status: number,
  details?: Record<string, string[]>
): Response {
  return new Response(
    JSON.stringify({
      error: {
        message,
        code,
        ...(details && { details }),
      },
    }),
    {
      status,
      headers: { 'Content-Type': 'application/json' },
    }
  );
}

/**
 * Create a mock 204 No Content Response.
 */
export function mock204Response(): Response {
  return new Response(null, { status: 204 });
}
