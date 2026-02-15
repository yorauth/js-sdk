import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { AuthResource } from '../../src/resources/auth.js';
import { createMockHttpClient, mockFetchResponse, mockErrorResponse } from '../helpers.js';

describe('AuthResource', () => {
  let mockFetch: ReturnType<typeof vi.fn>;
  let auth: AuthResource;

  beforeEach(() => {
    mockFetch = vi.fn();
    globalThis.fetch = mockFetch;
    const http = createMockHttpClient();
    auth = new AuthResource(http);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('register', () => {
    it('should register a new user', async () => {
      const mockResponse = {
        data: {
          id: 'user-123',
          email: 'user@example.com',
          name: 'Jane Doe',
          avatar_url: null,
          email_verified_at: null,
          metadata: null,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        },
        message: 'User registered successfully',
      };

      mockFetch.mockResolvedValueOnce(mockFetchResponse(mockResponse));

      const result = await auth.register({
        email: 'user@example.com',
        password: 'password123',
        name: 'Jane Doe',
      });

      expect(result).toEqual(mockResponse);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/users/register'),
        expect.objectContaining({ method: 'POST' })
      );
    });

    it('should handle registration with metadata', async () => {
      const mockResponse = {
        data: {
          id: 'user-123',
          email: 'user@example.com',
          name: 'Jane Doe',
          avatar_url: null,
          email_verified_at: null,
          metadata: { department: 'Engineering' },
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        },
        message: 'User registered successfully',
      };

      mockFetch.mockResolvedValueOnce(mockFetchResponse(mockResponse));

      const result = await auth.register({
        email: 'user@example.com',
        password: 'password123',
        name: 'Jane Doe',
        metadata: { department: 'Engineering' },
      });

      expect(result.data.metadata).toEqual({ department: 'Engineering' });
    });

    it('should handle registration error', async () => {
      mockFetch.mockResolvedValueOnce(
        mockErrorResponse('Email already exists', 'EMAIL_ALREADY_EXISTS', 422)
      );

      await expect(
        auth.register({
          email: 'existing@example.com',
          password: 'password123',
          name: 'Jane Doe',
        })
      ).rejects.toThrow();
    });
  });

  describe('login', () => {
    it('should login successfully and return tokens', async () => {
      const mockResponse = {
        data: {
          access_token: 'jwt-token',
          refresh_token: 'refresh-token',
          token_type: 'Bearer',
          expires_in: 3600,
          user: {
            id: 'user-123',
            email: 'user@example.com',
            name: 'Jane Doe',
            avatar_url: null,
            email_verified_at: '2024-01-01T00:00:00Z',
            metadata: null,
            created_at: '2024-01-01T00:00:00Z',
            updated_at: '2024-01-01T00:00:00Z',
          },
        },
      };

      mockFetch.mockResolvedValueOnce(mockFetchResponse(mockResponse));

      const result = await auth.login({
        email: 'user@example.com',
        password: 'password123',
      });

      expect(result).toEqual(mockResponse.data);
      expect('access_token' in result).toBe(true);
    });

    it('should return MFA challenge when MFA is required', async () => {
      const mockResponse = {
        data: {
          mfa_required: true,
          challenge_token: 'challenge-abc',
          mfa_methods: ['totp'],
        },
      };

      mockFetch.mockResolvedValueOnce(mockFetchResponse(mockResponse));

      const result = await auth.login({
        email: 'user@example.com',
        password: 'password123',
      });

      expect(result).toEqual(mockResponse.data);
      expect('mfa_required' in result).toBe(true);
      if ('mfa_required' in result) {
        expect(result.challenge_token).toBe('challenge-abc');
      }
    });

    it('should handle login with remember_me flag', async () => {
      const mockResponse = {
        data: {
          access_token: 'jwt-token',
          refresh_token: 'refresh-token',
          token_type: 'Bearer',
          expires_in: 3600,
          user: {
            id: 'user-123',
            email: 'user@example.com',
            name: 'Jane Doe',
            avatar_url: null,
            email_verified_at: '2024-01-01T00:00:00Z',
            metadata: null,
            created_at: '2024-01-01T00:00:00Z',
            updated_at: '2024-01-01T00:00:00Z',
          },
        },
      };

      mockFetch.mockResolvedValueOnce(mockFetchResponse(mockResponse));

      await auth.login({
        email: 'user@example.com',
        password: 'password123',
        remember_me: true,
      });

      const callBody = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(callBody.remember_me).toBe(true);
    });

    it('should handle invalid credentials error', async () => {
      mockFetch.mockResolvedValueOnce(
        mockErrorResponse('Invalid credentials', 'AUTH_INVALID_CREDENTIALS', 401)
      );

      await expect(
        auth.login({
          email: 'user@example.com',
          password: 'wrong',
        })
      ).rejects.toThrow();
    });
  });

  describe('logout', () => {
    it('should logout successfully', async () => {
      mockFetch.mockResolvedValueOnce(new Response(null, { status: 204 }));

      await auth.logout('refresh-token-123');

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/users/logout'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ refresh_token: 'refresh-token-123' }),
        })
      );
    });

    it('should handle logout error', async () => {
      mockFetch.mockResolvedValueOnce(
        mockErrorResponse('Invalid refresh token', 'INVALID_REFRESH_TOKEN', 401)
      );

      await expect(auth.logout('invalid-token')).rejects.toThrow();
    });
  });

  describe('refreshToken', () => {
    it('should refresh token successfully', async () => {
      const mockResponse = {
        data: {
          access_token: 'new-jwt-token',
          refresh_token: 'new-refresh-token',
          token_type: 'Bearer',
          expires_in: 3600,
          user: {
            id: 'user-123',
            email: 'user@example.com',
            name: 'Jane Doe',
            avatar_url: null,
            email_verified_at: '2024-01-01T00:00:00Z',
            metadata: null,
            created_at: '2024-01-01T00:00:00Z',
            updated_at: '2024-01-01T00:00:00Z',
          },
        },
      };

      mockFetch.mockResolvedValueOnce(mockFetchResponse(mockResponse));

      const result = await auth.refreshToken('refresh-token-123');

      expect(result).toEqual(mockResponse.data);
      expect(result.access_token).toBe('new-jwt-token');
    });

    it('should handle invalid refresh token', async () => {
      mockFetch.mockResolvedValueOnce(
        mockErrorResponse('Invalid refresh token', 'INVALID_REFRESH_TOKEN', 401)
      );

      await expect(auth.refreshToken('invalid-token')).rejects.toThrow();
    });
  });

  describe('forgotPassword', () => {
    it('should send password reset email', async () => {
      const mockResponse = {
        data: {
          message: 'Password reset email sent',
        },
      };

      mockFetch.mockResolvedValueOnce(mockFetchResponse(mockResponse));

      const result = await auth.forgotPassword('user@example.com');

      expect(result).toEqual(mockResponse.data);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/users/password/forgot'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ email: 'user@example.com' }),
        })
      );
    });
  });

  describe('resetPassword', () => {
    it('should reset password successfully', async () => {
      const mockResponse = {
        data: {
          message: 'Password reset successfully',
        },
      };

      mockFetch.mockResolvedValueOnce(mockFetchResponse(mockResponse));

      const result = await auth.resetPassword({
        token: 'reset-token-123',
        email: 'user@example.com',
        password: 'newPassword123',
      });

      expect(result).toEqual(mockResponse.data);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/users/password/reset'),
        expect.objectContaining({ method: 'POST' })
      );
    });

    it('should handle invalid reset token', async () => {
      mockFetch.mockResolvedValueOnce(
        mockErrorResponse('Invalid or expired token', 'INVALID_RESET_TOKEN', 400)
      );

      await expect(
        auth.resetPassword({
          token: 'invalid-token',
          email: 'user@example.com',
          password: 'newPassword123',
        })
      ).rejects.toThrow();
    });
  });

  describe('verifyEmail', () => {
    it('should verify email successfully', async () => {
      const mockResponse = {
        data: {
          message: 'Email verified successfully',
        },
      };

      mockFetch.mockResolvedValueOnce(mockFetchResponse(mockResponse));

      const result = await auth.verifyEmail('verify-token-123');

      expect(result).toEqual(mockResponse.data);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/users/email/verify'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ token: 'verify-token-123' }),
        })
      );
    });

    it('should handle invalid verification token', async () => {
      mockFetch.mockResolvedValueOnce(
        mockErrorResponse('Invalid verification token', 'INVALID_VERIFICATION_TOKEN', 400)
      );

      await expect(auth.verifyEmail('invalid-token')).rejects.toThrow();
    });
  });

  describe('resendVerification', () => {
    it('should resend verification email', async () => {
      const mockResponse = {
        data: {
          message: 'Verification email sent',
        },
      };

      mockFetch.mockResolvedValueOnce(mockFetchResponse(mockResponse));

      const result = await auth.resendVerification('user@example.com');

      expect(result).toEqual(mockResponse.data);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/users/email/resend'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ email: 'user@example.com' }),
        })
      );
    });
  });

  describe('requestMagicLink', () => {
    it('should request magic link without redirect URL', async () => {
      const mockResponse = {
        data: {
          message: 'Magic link sent to your email',
        },
      };

      mockFetch.mockResolvedValueOnce(mockFetchResponse(mockResponse));

      const result = await auth.requestMagicLink('user@example.com');

      expect(result).toEqual(mockResponse.data);
      const callBody = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(callBody.email).toBe('user@example.com');
      expect(callBody.redirect_url).toBeUndefined();
    });

    it('should request magic link with redirect URL', async () => {
      const mockResponse = {
        data: {
          message: 'Magic link sent to your email',
        },
      };

      mockFetch.mockResolvedValueOnce(mockFetchResponse(mockResponse));

      await auth.requestMagicLink('user@example.com', 'https://app.example.com/dashboard');

      const callBody = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(callBody.redirect_url).toBe('https://app.example.com/dashboard');
    });
  });

  describe('verifyMagicLink', () => {
    it('should verify magic link and return tokens', async () => {
      const mockResponse = {
        data: {
          access_token: 'jwt-token',
          refresh_token: 'refresh-token',
          token_type: 'Bearer',
          expires_in: 3600,
          user: {
            id: 'user-123',
            email: 'user@example.com',
            name: 'Jane Doe',
            avatar_url: null,
            email_verified_at: '2024-01-01T00:00:00Z',
            metadata: null,
            created_at: '2024-01-01T00:00:00Z',
            updated_at: '2024-01-01T00:00:00Z',
          },
          redirect_url: 'https://app.example.com/dashboard',
        },
      };

      mockFetch.mockResolvedValueOnce(mockFetchResponse(mockResponse));

      const result = await auth.verifyMagicLink('magic-token-123');

      expect(result).toEqual(mockResponse.data);
      expect(result.access_token).toBe('jwt-token');
      expect(result.redirect_url).toBe('https://app.example.com/dashboard');
    });

    it('should handle magic link with null redirect URL', async () => {
      const mockResponse = {
        data: {
          access_token: 'jwt-token',
          refresh_token: 'refresh-token',
          token_type: 'Bearer',
          expires_in: 3600,
          user: {
            id: 'user-123',
            email: 'user@example.com',
            name: 'Jane Doe',
            avatar_url: null,
            email_verified_at: '2024-01-01T00:00:00Z',
            metadata: null,
            created_at: '2024-01-01T00:00:00Z',
            updated_at: '2024-01-01T00:00:00Z',
          },
          redirect_url: null,
        },
      };

      mockFetch.mockResolvedValueOnce(mockFetchResponse(mockResponse));

      const result = await auth.verifyMagicLink('magic-token-123');

      expect(result.redirect_url).toBeNull();
    });

    it('should handle invalid magic link token', async () => {
      mockFetch.mockResolvedValueOnce(
        mockErrorResponse('Invalid magic link token', 'INVALID_MAGIC_LINK', 400)
      );

      await expect(auth.verifyMagicLink('invalid-token')).rejects.toThrow();
    });
  });

  describe('verifyMfa', () => {
    it('should verify MFA and return tokens', async () => {
      const mockResponse = {
        data: {
          access_token: 'jwt-token',
          refresh_token: 'refresh-token',
          token_type: 'Bearer',
          expires_in: 3600,
          user: {
            id: 'user-123',
            email: 'user@example.com',
            name: 'Jane Doe',
            avatar_url: null,
            email_verified_at: '2024-01-01T00:00:00Z',
            metadata: null,
            created_at: '2024-01-01T00:00:00Z',
            updated_at: '2024-01-01T00:00:00Z',
          },
        },
      };

      mockFetch.mockResolvedValueOnce(mockFetchResponse(mockResponse));

      const result = await auth.verifyMfa({
        challenge_token: 'challenge-abc',
        code: '123456',
      });

      expect(result).toEqual(mockResponse.data);
      expect(result.access_token).toBe('jwt-token');
    });

    it('should handle invalid MFA code', async () => {
      mockFetch.mockResolvedValueOnce(
        mockErrorResponse('Invalid MFA code', 'MFA_INVALID_CODE', 400)
      );

      await expect(
        auth.verifyMfa({
          challenge_token: 'challenge-abc',
          code: '000000',
        })
      ).rejects.toThrow();
    });
  });
});
