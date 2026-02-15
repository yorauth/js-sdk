import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { AuditLogResource } from '../../src/resources/audit-logs.js';
import { createMockHttpClient, mockFetchResponse } from '../helpers.js';

describe('AuditLogResource', () => {
  let mockFetch: ReturnType<typeof vi.fn>;
  let auditLogs: AuditLogResource;

  beforeEach(() => {
    mockFetch = vi.fn();
    globalThis.fetch = mockFetch;
    const http = createMockHttpClient();
    auditLogs = new AuditLogResource(http);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  const mockLog = {
    id: 'log-123',
    action: 'role.assigned',
    actor_id: 'admin-user-123',
    target_user_id: 'user-456',
    target_role_id: 'role-789',
    metadata: {
      scope: 'project:123',
      assigned_by: 'admin',
    },
    ip_address: '192.168.1.1',
    created_at: '2024-01-01T00:00:00Z',
  };

  describe('list', () => {
    it('should list audit logs without filters', async () => {
      mockFetch.mockResolvedValueOnce(mockFetchResponse({ data: [mockLog] }));

      const result = await auditLogs.list();

      expect(result).toEqual([mockLog]);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/audit-logs'),
        expect.objectContaining({ method: 'GET' })
      );
    });

    it('should filter by action', async () => {
      mockFetch.mockResolvedValueOnce(mockFetchResponse({ data: [mockLog] }));

      await auditLogs.list({ action: 'role.assigned' });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('action=role.assigned'),
        expect.any(Object)
      );
    });

    it('should filter by target_user_id', async () => {
      mockFetch.mockResolvedValueOnce(mockFetchResponse({ data: [] }));

      await auditLogs.list({ target_user_id: 'user-456' });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('target_user_id=user-456'),
        expect.any(Object)
      );
    });

    it('should filter by target_role_id', async () => {
      mockFetch.mockResolvedValueOnce(mockFetchResponse({ data: [] }));

      await auditLogs.list({ target_role_id: 'role-789' });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('target_role_id=role-789'),
        expect.any(Object)
      );
    });

    it('should apply limit', async () => {
      mockFetch.mockResolvedValueOnce(mockFetchResponse({ data: [] }));

      await auditLogs.list({ limit: 25 });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('limit=25'),
        expect.any(Object)
      );
    });

    it('should apply multiple filters', async () => {
      mockFetch.mockResolvedValueOnce(mockFetchResponse({ data: [] }));

      await auditLogs.list({
        action: 'role.removed',
        target_user_id: 'user-456',
        limit: 10,
      });

      const url = mockFetch.mock.calls[0][0];
      expect(url).toContain('action=role.removed');
      expect(url).toContain('target_user_id=user-456');
      expect(url).toContain('limit=10');
    });

    it('should return empty array when no logs match', async () => {
      mockFetch.mockResolvedValueOnce(mockFetchResponse({ data: [] }));

      const result = await auditLogs.list({ action: 'nonexistent.action' });

      expect(result).toEqual([]);
    });

    it('should handle logs with null metadata', async () => {
      const logWithNullMetadata = { ...mockLog, metadata: null };
      mockFetch.mockResolvedValueOnce(mockFetchResponse({ data: [logWithNullMetadata] }));

      const result = await auditLogs.list();

      expect(result[0].metadata).toBeNull();
    });

    it('should handle logs with null target_user_id', async () => {
      const systemLog = { ...mockLog, target_user_id: null, action: 'system.maintenance' };
      mockFetch.mockResolvedValueOnce(mockFetchResponse({ data: [systemLog] }));

      const result = await auditLogs.list();

      expect(result[0].target_user_id).toBeNull();
    });

    it('should handle logs with null actor_id', async () => {
      const automaticLog = { ...mockLog, actor_id: null, action: 'token.expired' };
      mockFetch.mockResolvedValueOnce(mockFetchResponse({ data: [automaticLog] }));

      const result = await auditLogs.list();

      expect(result[0].actor_id).toBeNull();
    });
  });
});
