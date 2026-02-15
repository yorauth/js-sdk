import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { SessionResource } from '../../src/resources/sessions.js';
import { createMockHttpClient, mockFetchResponse, mockErrorResponse, mock204Response } from '../helpers.js';

describe('SessionResource', () => {
  let mockFetch: ReturnType<typeof vi.fn>;
  let sessions: SessionResource;

  beforeEach(() => {
    mockFetch = vi.fn();
    globalThis.fetch = mockFetch;
    const http = createMockHttpClient();
    sessions = new SessionResource(http);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  const mockSession = {
    id: 'session-123',
    device_info: { browser: 'Chrome', os: 'macOS' },
    is_remember_me: false,
    last_used_at: '2024-01-01T12:00:00Z',
    expires_at: '2024-01-08T00:00:00Z',
    created_at: '2024-01-01T00:00:00Z',
  };

  describe('list', () => {
    it('should list user sessions', async () => {
      mockFetch.mockResolvedValueOnce(mockFetchResponse({ data: [mockSession] }));

      const result = await sessions.list('user-123');

      expect(result).toEqual([mockSession]);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/users/user-123/sessions'),
        expect.objectContaining({ method: 'GET' })
      );
    });

    it('should return empty array when no sessions', async () => {
      mockFetch.mockResolvedValueOnce(mockFetchResponse({ data: [] }));

      const result = await sessions.list('user-123');

      expect(result).toEqual([]);
    });

    it('should handle unauthorized access', async () => {
      mockFetch.mockResolvedValueOnce(
        mockErrorResponse('Unauthorized', 'UNAUTHORIZED', 403)
      );

      await expect(sessions.list('other-user')).rejects.toThrow();
    });
  });

  describe('destroyAll', () => {
    it('should revoke all sessions', async () => {
      mockFetch.mockResolvedValueOnce(
        mockFetchResponse({
          data: {
            revoked_count: 3,
            message: 'All sessions revoked successfully',
          },
        })
      );

      const result = await sessions.destroyAll('user-123');

      expect(result.revoked_count).toBe(3);
      expect(result.message).toBe('All sessions revoked successfully');
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/users/user-123/sessions'),
        expect.objectContaining({ method: 'DELETE' })
      );
    });

    it('should handle zero sessions revoked', async () => {
      mockFetch.mockResolvedValueOnce(
        mockFetchResponse({
          data: {
            revoked_count: 0,
            message: 'No active sessions found',
          },
        })
      );

      const result = await sessions.destroyAll('user-123');

      expect(result.revoked_count).toBe(0);
    });
  });

  describe('destroy', () => {
    it('should revoke specific session', async () => {
      mockFetch.mockResolvedValueOnce(mock204Response());

      await sessions.destroy('user-123', 'session-456');

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/users/user-123/sessions/session-456'),
        expect.objectContaining({ method: 'DELETE' })
      );
    });

    it('should handle session not found', async () => {
      mockFetch.mockResolvedValueOnce(
        mockErrorResponse('Session not found', 'SESSION_NOT_FOUND', 404)
      );

      await expect(sessions.destroy('user-123', 'invalid-session')).rejects.toThrow();
    });

    it('should handle revoking already revoked session', async () => {
      mockFetch.mockResolvedValueOnce(
        mockErrorResponse('Session already revoked', 'SESSION_ALREADY_REVOKED', 400)
      );

      await expect(sessions.destroy('user-123', 'session-456')).rejects.toThrow();
    });
  });
});
