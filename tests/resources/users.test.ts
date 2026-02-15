import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { UserResource } from '../../src/resources/users.js';
import { createMockHttpClient, mockFetchResponse, mockErrorResponse, mock204Response } from '../helpers.js';

describe('UserResource', () => {
  let mockFetch: ReturnType<typeof vi.fn>;
  let users: UserResource;

  beforeEach(() => {
    mockFetch = vi.fn();
    globalThis.fetch = mockFetch;
    const http = createMockHttpClient();
    users = new UserResource(http);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  const mockUser = {
    id: 'user-123',
    email: 'user@example.com',
    name: 'Jane Doe',
    avatar_url: null,
    email_verified_at: '2024-01-01T00:00:00Z',
    metadata: null,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  };

  describe('getProfile', () => {
    it('should get user profile', async () => {
      mockFetch.mockResolvedValueOnce(mockFetchResponse({ data: mockUser }));

      const result = await users.getProfile('user-123');

      expect(result).toEqual(mockUser);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/users/user-123/profile'),
        expect.objectContaining({ method: 'GET' })
      );
    });

    it('should handle user not found error', async () => {
      mockFetch.mockResolvedValueOnce(mockErrorResponse('User not found', 'USER_NOT_FOUND', 404));

      await expect(users.getProfile('invalid-id')).rejects.toThrow();
    });
  });

  describe('updateProfile', () => {
    it('should update user profile', async () => {
      const updatedUser = { ...mockUser, name: 'Jane Smith' };
      mockFetch.mockResolvedValueOnce(mockFetchResponse({ data: updatedUser }));

      const result = await users.updateProfile('user-123', { name: 'Jane Smith' });

      expect(result).toEqual(updatedUser);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/users/user-123/profile'),
        expect.objectContaining({
          method: 'PUT',
          body: JSON.stringify({ name: 'Jane Smith' }),
        })
      );
    });

    it('should update avatar_url', async () => {
      const updatedUser = { ...mockUser, avatar_url: 'https://example.com/avatar.jpg' };
      mockFetch.mockResolvedValueOnce(mockFetchResponse({ data: updatedUser }));

      const result = await users.updateProfile('user-123', {
        avatar_url: 'https://example.com/avatar.jpg',
      });

      expect(result.avatar_url).toBe('https://example.com/avatar.jpg');
    });

    it('should update metadata', async () => {
      const metadata = { department: 'Engineering', level: 'Senior' };
      const updatedUser = { ...mockUser, metadata };
      mockFetch.mockResolvedValueOnce(mockFetchResponse({ data: updatedUser }));

      const result = await users.updateProfile('user-123', { metadata });

      expect(result.metadata).toEqual(metadata);
    });

    it('should handle validation error', async () => {
      mockFetch.mockResolvedValueOnce(
        mockErrorResponse('Validation failed', 'VALIDATION_ERROR', 422, {
          name: ['Name is required'],
        })
      );

      await expect(users.updateProfile('user-123', { name: '' })).rejects.toThrow();
    });
  });

  describe('changePassword', () => {
    it('should change password successfully', async () => {
      mockFetch.mockResolvedValueOnce(
        mockFetchResponse({ data: { message: 'Password changed successfully' } })
      );

      const result = await users.changePassword('user-123', {
        current_password: 'oldPassword123',
        new_password: 'newPassword123',
        new_password_confirmation: 'newPassword123',
      });

      expect(result.message).toBe('Password changed successfully');
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/users/user-123/change-password'),
        expect.objectContaining({ method: 'POST' })
      );
    });

    it('should handle incorrect current password', async () => {
      mockFetch.mockResolvedValueOnce(
        mockErrorResponse('Current password is incorrect', 'INVALID_PASSWORD', 400)
      );

      await expect(
        users.changePassword('user-123', {
          current_password: 'wrong',
          new_password: 'newPassword123',
          new_password_confirmation: 'newPassword123',
        })
      ).rejects.toThrow();
    });

    it('should handle password confirmation mismatch', async () => {
      mockFetch.mockResolvedValueOnce(
        mockErrorResponse('Password confirmation does not match', 'VALIDATION_ERROR', 422)
      );

      await expect(
        users.changePassword('user-123', {
          current_password: 'oldPassword123',
          new_password: 'newPassword123',
          new_password_confirmation: 'different',
        })
      ).rejects.toThrow();
    });
  });

  describe('deleteAccount', () => {
    it('should delete user account', async () => {
      mockFetch.mockResolvedValueOnce(mock204Response());

      await users.deleteAccount('user-123');

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/users/user-123'),
        expect.objectContaining({ method: 'DELETE' })
      );
    });

    it('should handle unauthorized deletion', async () => {
      mockFetch.mockResolvedValueOnce(mockErrorResponse('Unauthorized', 'UNAUTHORIZED', 403));

      await expect(users.deleteAccount('user-123')).rejects.toThrow();
    });
  });

  describe('exportData', () => {
    it('should export user data', async () => {
      const exportedData = {
        user: mockUser,
        sessions: [{ id: 'session-1', created_at: '2024-01-01T00:00:00Z' }],
        roles: [{ id: 'role-1', name: 'user' }],
      };

      mockFetch.mockResolvedValueOnce(mockFetchResponse({ data: exportedData }));

      const result = await users.exportData('user-123');

      expect(result).toEqual(exportedData);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/users/user-123/data-export'),
        expect.objectContaining({ method: 'GET' })
      );
    });

    it('should handle rate limit error', async () => {
      mockFetch.mockResolvedValueOnce(
        mockErrorResponse('Rate limit exceeded', 'RATE_LIMIT_EXCEEDED', 429)
      );

      await expect(users.exportData('user-123')).rejects.toThrow();
    });
  });
});
