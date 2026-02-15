import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { PermissionsResource } from '../../src/resources/permissions.js';
import { createMockHttpClient, mockFetchResponse, mockErrorResponse } from '../helpers.js';

describe('PermissionsResource', () => {
  let mockFetch: ReturnType<typeof vi.fn>;
  let permissions: PermissionsResource;

  beforeEach(() => {
    mockFetch = vi.fn();
    globalThis.fetch = mockFetch;
    const http = createMockHttpClient();
    permissions = new PermissionsResource(http);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('check', () => {
    it('should check permission for user', async () => {
      mockFetch.mockResolvedValueOnce(
        mockFetchResponse({ allowed: true, permission: 'posts:create', cached: false })
      );

      const result = await permissions.check('user-123', 'posts:create');

      expect(result.allowed).toBe(true);
      expect(result.permission).toBe('posts:create');
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('user_id=user-123'),
        expect.objectContaining({ method: 'GET' })
      );
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('permission=posts%3Acreate'),
        expect.any(Object)
      );
    });

    it('should return denied permission', async () => {
      mockFetch.mockResolvedValueOnce(
        mockFetchResponse({ allowed: false, permission: 'admin:manage', cached: true })
      );

      const result = await permissions.check('user-123', 'admin:manage');

      expect(result.allowed).toBe(false);
      expect(result.cached).toBe(true);
    });

    it('should handle wildcard permissions', async () => {
      mockFetch.mockResolvedValueOnce(
        mockFetchResponse({ allowed: true, permission: 'posts:*', cached: false })
      );

      const result = await permissions.check('user-123', 'posts:*');

      expect(result.allowed).toBe(true);
      expect(result.permission).toBe('posts:*');
    });

    it('should handle error checking permission', async () => {
      mockFetch.mockResolvedValueOnce(
        mockErrorResponse('User not found', 'USER_NOT_FOUND', 404)
      );

      await expect(permissions.check('invalid-user', 'posts:create')).rejects.toThrow();
    });
  });

  describe('checkBulk', () => {
    it('should check multiple permissions', async () => {
      mockFetch.mockResolvedValueOnce(
        mockFetchResponse({
          user_id: 'user-123',
          results: {
            'posts:create': true,
            'posts:delete': false,
            'users:manage': false,
          },
        })
      );

      const result = await permissions.checkBulk('user-123', [
        'posts:create',
        'posts:delete',
        'users:manage',
      ]);

      expect(result.user_id).toBe('user-123');
      expect(result.results['posts:create']).toBe(true);
      expect(result.results['posts:delete']).toBe(false);
      expect(result.results['users:manage']).toBe(false);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/authz/check-bulk'),
        expect.objectContaining({ method: 'POST' })
      );
    });

    it('should send permissions in request body', async () => {
      mockFetch.mockResolvedValueOnce(mockFetchResponse({ user_id: 'user-123', results: {} }));

      await permissions.checkBulk('user-123', ['posts:create', 'posts:edit']);

      const callBody = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(callBody.user_id).toBe('user-123');
      expect(callBody.permissions).toEqual(['posts:create', 'posts:edit']);
    });

    it('should handle empty permission list', async () => {
      mockFetch.mockResolvedValueOnce(mockFetchResponse({ user_id: 'user-123', results: {} }));

      const result = await permissions.checkBulk('user-123', []);

      expect(result.results).toEqual({});
    });

    it('should handle bulk check error', async () => {
      mockFetch.mockResolvedValueOnce(
        mockErrorResponse('Too many permissions', 'BULK_CHECK_LIMIT_EXCEEDED', 400)
      );

      await expect(
        permissions.checkBulk('user-123', new Array(100).fill('permission'))
      ).rejects.toThrow();
    });
  });
});
