import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ApiKeyResource } from '../../src/resources/api-keys.js';
import { createMockHttpClient, mockFetchResponse, mockErrorResponse, mock204Response } from '../helpers.js';

describe('ApiKeyResource', () => {
  let mockFetch: ReturnType<typeof vi.fn>;
  let apiKeys: ApiKeyResource;

  beforeEach(() => {
    mockFetch = vi.fn();
    globalThis.fetch = mockFetch;
    const http = createMockHttpClient();
    apiKeys = new ApiKeyResource(http);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  const mockApiKey = {
    id: 'key-123',
    name: 'Production Key',
    key_prefix: 'ya_prod_',
    last_used_at: '2024-01-05T00:00:00Z',
    expires_at: null,
    revoked_at: null,
    is_active: true,
    created_at: '2024-01-01T00:00:00Z',
  };

  describe('list', () => {
    it('should list API keys', async () => {
      mockFetch.mockResolvedValueOnce(mockFetchResponse({ data: [mockApiKey] }));

      const result = await apiKeys.list();

      expect(result).toEqual([mockApiKey]);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api-keys'),
        expect.objectContaining({ method: 'GET' })
      );
    });

    it('should return empty array when no keys', async () => {
      mockFetch.mockResolvedValueOnce(mockFetchResponse({ data: [] }));

      const result = await apiKeys.list();

      expect(result).toEqual([]);
    });
  });

  describe('create', () => {
    it('should create API key without parameters', async () => {
      const mockResponse = {
        data: {
          ...mockApiKey,
          key: 'ya_prod_abc123def456',
        },
        warning: 'Store this key securely. It will not be shown again.',
      };

      mockFetch.mockResolvedValueOnce(mockFetchResponse(mockResponse));

      const result = await apiKeys.create();

      expect(result.data.key).toBe('ya_prod_abc123def456');
      expect(result.warning).toContain('securely');
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api-keys'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({}),
        })
      );
    });

    it('should create API key with name', async () => {
      const mockResponse = {
        data: {
          ...mockApiKey,
          key: 'ya_prod_abc123def456',
        },
        warning: 'Store this key securely. It will not be shown again.',
      };

      mockFetch.mockResolvedValueOnce(mockFetchResponse(mockResponse));

      await apiKeys.create({ name: 'Production Key' });

      const callBody = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(callBody.name).toBe('Production Key');
    });

    it('should create API key with expiration', async () => {
      const mockResponse = {
        data: {
          ...mockApiKey,
          key: 'ya_prod_abc123def456',
          expires_at: '2024-12-31T23:59:59Z',
        },
        warning: 'Store this key securely. It will not be shown again.',
      };

      mockFetch.mockResolvedValueOnce(mockFetchResponse(mockResponse));

      const result = await apiKeys.create({
        name: 'Temporary Key',
        expires_at: '2024-12-31T23:59:59Z',
      });

      expect(result.data.expires_at).toBe('2024-12-31T23:59:59Z');
    });
  });

  describe('get', () => {
    it('should get API key by ID', async () => {
      mockFetch.mockResolvedValueOnce(mockFetchResponse({ data: mockApiKey }));

      const result = await apiKeys.get('key-123');

      expect(result).toEqual(mockApiKey);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api-keys/key-123'),
        expect.objectContaining({ method: 'GET' })
      );
    });

    it('should not include plaintext key in response', async () => {
      mockFetch.mockResolvedValueOnce(mockFetchResponse({ data: mockApiKey }));

      const result = await apiKeys.get('key-123');

      expect('key' in result).toBe(false);
      expect(result.key_prefix).toBe('ya_prod_');
    });

    it('should handle API key not found', async () => {
      mockFetch.mockResolvedValueOnce(
        mockErrorResponse('API key not found', 'API_KEY_NOT_FOUND', 404)
      );

      await expect(apiKeys.get('invalid-id')).rejects.toThrow();
    });
  });

  describe('delete', () => {
    it('should revoke API key', async () => {
      mockFetch.mockResolvedValueOnce(mock204Response());

      await apiKeys.delete('key-123');

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api-keys/key-123'),
        expect.objectContaining({ method: 'DELETE' })
      );
    });

    it('should handle already revoked key', async () => {
      mockFetch.mockResolvedValueOnce(
        mockErrorResponse('API key already revoked', 'API_KEY_REVOKED', 400)
      );

      await expect(apiKeys.delete('key-123')).rejects.toThrow();
    });
  });
});
