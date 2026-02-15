import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { MfaResource } from '../../src/resources/mfa.js';
import { createMockHttpClient, mockFetchResponse, mockErrorResponse, mock204Response } from '../helpers.js';

describe('MfaResource', () => {
  let mockFetch: ReturnType<typeof vi.fn>;
  let mfa: MfaResource;

  beforeEach(() => {
    mockFetch = vi.fn();
    globalThis.fetch = mockFetch;
    const http = createMockHttpClient();
    mfa = new MfaResource(http);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('setupTotp', () => {
    it('should setup TOTP without label', async () => {
      mockFetch.mockResolvedValueOnce(
        mockFetchResponse({
          data: {
            method_id: 'method-123',
            provisioning_uri: 'otpauth://totp/YorAuth:user@example.com?secret=SECRET&issuer=YorAuth',
            secret: 'SECRET123',
          },
        })
      );

      const result = await mfa.setupTotp('user-123');

      expect(result.method_id).toBe('method-123');
      expect(result.secret).toBe('SECRET123');
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/users/user-123/mfa/totp/setup'),
        expect.objectContaining({ method: 'POST' })
      );
    });

    it('should setup TOTP with custom label', async () => {
      mockFetch.mockResolvedValueOnce(
        mockFetchResponse({
          data: {
            method_id: 'method-123',
            provisioning_uri: 'otpauth://totp/My%20Phone?secret=SECRET',
            secret: 'SECRET123',
          },
        })
      );

      await mfa.setupTotp('user-123', 'My Phone');

      const callBody = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(callBody.label).toBe('My Phone');
    });
  });

  describe('confirmTotp', () => {
    it('should confirm TOTP setup', async () => {
      mockFetch.mockResolvedValueOnce(
        mockFetchResponse({
          data: {
            message: 'MFA enabled successfully',
            backup_codes: ['CODE1', 'CODE2', 'CODE3'],
          },
        })
      );

      const result = await mfa.confirmTotp('user-123', {
        method_id: 'method-123',
        code: '123456',
      });

      expect(result.message).toBe('MFA enabled successfully');
      expect(result.backup_codes).toHaveLength(3);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/users/user-123/mfa/totp/confirm'),
        expect.objectContaining({ method: 'POST' })
      );
    });

    it('should handle invalid TOTP code', async () => {
      mockFetch.mockResolvedValueOnce(
        mockErrorResponse('Invalid TOTP code', 'MFA_INVALID_CODE', 400)
      );

      await expect(
        mfa.confirmTotp('user-123', { method_id: 'method-123', code: '000000' })
      ).rejects.toThrow();
    });
  });

  describe('disableTotp', () => {
    it('should disable TOTP with password', async () => {
      mockFetch.mockResolvedValueOnce(mock204Response());

      await mfa.disableTotp('user-123', 'password123');

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/users/user-123/mfa/totp'),
        expect.objectContaining({
          method: 'DELETE',
          body: JSON.stringify({ password: 'password123' }),
        })
      );
    });

    it('should handle incorrect password', async () => {
      mockFetch.mockResolvedValueOnce(
        mockErrorResponse('Incorrect password', 'INVALID_PASSWORD', 400)
      );

      await expect(mfa.disableTotp('user-123', 'wrong')).rejects.toThrow();
    });
  });

  describe('getStatus', () => {
    it('should get MFA status when enabled', async () => {
      mockFetch.mockResolvedValueOnce(
        mockFetchResponse({
          data: {
            mfa_enabled: true,
            methods: [
              {
                id: 'method-123',
                type: 'totp',
                label: 'My Phone',
                is_primary: true,
                verified_at: '2024-01-01T00:00:00Z',
                last_used_at: '2024-01-05T00:00:00Z',
              },
            ],
            backup_codes_remaining: 8,
          },
        })
      );

      const result = await mfa.getStatus('user-123');

      expect(result.mfa_enabled).toBe(true);
      expect(result.methods).toHaveLength(1);
      expect(result.backup_codes_remaining).toBe(8);
    });

    it('should get MFA status when disabled', async () => {
      mockFetch.mockResolvedValueOnce(
        mockFetchResponse({
          data: {
            mfa_enabled: false,
            methods: [],
            backup_codes_remaining: 0,
          },
        })
      );

      const result = await mfa.getStatus('user-123');

      expect(result.mfa_enabled).toBe(false);
      expect(result.methods).toEqual([]);
    });
  });

  describe('regenerateBackupCodes', () => {
    it('should regenerate backup codes', async () => {
      mockFetch.mockResolvedValueOnce(
        mockFetchResponse({
          data: {
            backup_codes: ['NEW1', 'NEW2', 'NEW3', 'NEW4', 'NEW5', 'NEW6', 'NEW7', 'NEW8'],
            message: 'Backup codes regenerated successfully',
          },
        })
      );

      const result = await mfa.regenerateBackupCodes('user-123', 'password123');

      expect(result.backup_codes).toHaveLength(8);
      expect(result.message).toBe('Backup codes regenerated successfully');
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/users/user-123/mfa/backup-codes/regenerate'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ password: 'password123' }),
        })
      );
    });

    it('should handle MFA not enabled error', async () => {
      mockFetch.mockResolvedValueOnce(
        mockErrorResponse('MFA not enabled', 'MFA_NOT_ENABLED', 400)
      );

      await expect(mfa.regenerateBackupCodes('user-123', 'password123')).rejects.toThrow();
    });
  });
});
