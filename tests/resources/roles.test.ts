import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { RoleResource } from '../../src/resources/roles.js';
import { createMockHttpClient, mockFetchResponse, mockErrorResponse, mock204Response } from '../helpers.js';

describe('RoleResource', () => {
  let mockFetch: ReturnType<typeof vi.fn>;
  let roles: RoleResource;

  beforeEach(() => {
    mockFetch = vi.fn();
    globalThis.fetch = mockFetch;
    const http = createMockHttpClient();
    roles = new RoleResource(http);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  const mockRole = {
    id: 'role-123',
    application_id: 'app-123',
    name: 'admin',
    display_name: 'Administrator',
    description: 'Full access',
    is_system_role: false,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  };

  describe('list', () => {
    it('should list roles with pagination', async () => {
      const mockResponse = {
        data: [mockRole],
        meta: {
          current_page: 1,
          from: 1,
          last_page: 1,
          path: '/api/v1/applications/test-app-id/roles',
          per_page: 15,
          to: 1,
          total: 1,
        },
        links: {
          first: null,
          last: null,
          prev: null,
          next: null,
        },
      };

      mockFetch.mockResolvedValueOnce(mockFetchResponse(mockResponse));

      const result = await roles.list();

      expect(result).toEqual(mockResponse);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/roles'),
        expect.objectContaining({ method: 'GET' })
      );
    });

    it('should list roles with search and pagination params', async () => {
      mockFetch.mockResolvedValueOnce(mockFetchResponse({ data: [], meta: {}, links: {} }));

      await roles.list({ search: 'admin', per_page: 10, page: 2 });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('search=admin'),
        expect.any(Object)
      );
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('per_page=10'),
        expect.any(Object)
      );
    });

    it('should include permissions when requested', async () => {
      mockFetch.mockResolvedValueOnce(mockFetchResponse({ data: [], meta: {}, links: {} }));

      await roles.list({ include_permissions: true });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('include_permissions=true'),
        expect.any(Object)
      );
    });
  });

  describe('create', () => {
    it('should create a role', async () => {
      mockFetch.mockResolvedValueOnce(mockFetchResponse({ data: mockRole }));

      const result = await roles.create({
        name: 'admin',
        display_name: 'Administrator',
        description: 'Full access',
      });

      expect(result).toEqual(mockRole);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/roles'),
        expect.objectContaining({ method: 'POST' })
      );
    });

    it('should create role with permissions', async () => {
      mockFetch.mockResolvedValueOnce(mockFetchResponse({ data: mockRole }));

      await roles.create({
        name: 'editor',
        permissions: ['posts:create', 'posts:edit'],
      });

      const callBody = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(callBody.permissions).toEqual(['posts:create', 'posts:edit']);
    });

    it('should handle duplicate role name error', async () => {
      mockFetch.mockResolvedValueOnce(
        mockErrorResponse('Role name already exists', 'ROLE_NAME_EXISTS', 422)
      );

      await expect(roles.create({ name: 'admin' })).rejects.toThrow();
    });
  });

  describe('get', () => {
    it('should get role by ID', async () => {
      mockFetch.mockResolvedValueOnce(mockFetchResponse({ data: mockRole }));

      const result = await roles.get('role-123');

      expect(result).toEqual(mockRole);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/roles/role-123'),
        expect.objectContaining({ method: 'GET' })
      );
    });

    it('should handle role not found', async () => {
      mockFetch.mockResolvedValueOnce(mockErrorResponse('Role not found', 'ROLE_NOT_FOUND', 404));

      await expect(roles.get('invalid-id')).rejects.toThrow();
    });
  });

  describe('update', () => {
    it('should update role', async () => {
      const updatedRole = { ...mockRole, display_name: 'Super Admin' };
      mockFetch.mockResolvedValueOnce(mockFetchResponse({ data: updatedRole }));

      const result = await roles.update('role-123', { display_name: 'Super Admin' });

      expect(result.display_name).toBe('Super Admin');
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/roles/role-123'),
        expect.objectContaining({ method: 'PUT' })
      );
    });

    it('should update role permissions', async () => {
      mockFetch.mockResolvedValueOnce(mockFetchResponse({ data: mockRole }));

      await roles.update('role-123', { permissions: ['posts:*'] });

      const callBody = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(callBody.permissions).toEqual(['posts:*']);
    });
  });

  describe('delete', () => {
    it('should delete role', async () => {
      mockFetch.mockResolvedValueOnce(mock204Response());

      await roles.delete('role-123');

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/roles/role-123'),
        expect.objectContaining({ method: 'DELETE' })
      );
    });

    it('should handle system role deletion error', async () => {
      mockFetch.mockResolvedValueOnce(
        mockErrorResponse('Cannot delete system role', 'SYSTEM_ROLE_PROTECTED', 403)
      );

      await expect(roles.delete('role-123')).rejects.toThrow();
    });
  });

  describe('getUserRoles', () => {
    it('should get user roles', async () => {
      const assignments = [
        {
          id: 'assignment-1',
          user_id: 'user-123',
          role_id: 'role-123',
          scope: null,
          expires_at: null,
          created_at: '2024-01-01T00:00:00Z',
        },
      ];

      mockFetch.mockResolvedValueOnce(mockFetchResponse({ data: assignments }));

      const result = await roles.getUserRoles('user-123');

      expect(result).toEqual(assignments);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/users/user-123/roles'),
        expect.objectContaining({ method: 'GET' })
      );
    });

    it('should filter by scope', async () => {
      mockFetch.mockResolvedValueOnce(mockFetchResponse({ data: [] }));

      await roles.getUserRoles('user-123', 'project:123');

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('scope=project%3A123'),
        expect.any(Object)
      );
    });
  });

  describe('assignRole', () => {
    it('should assign role to user', async () => {
      const assignment = {
        id: 'assignment-1',
        user_id: 'user-123',
        role_id: 'role-123',
        scope: null,
        expires_at: null,
        created_at: '2024-01-01T00:00:00Z',
      };

      mockFetch.mockResolvedValueOnce(mockFetchResponse({ data: assignment }));

      const result = await roles.assignRole('user-123', { role_id: 'role-123' });

      expect(result).toEqual(assignment);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/users/user-123/roles'),
        expect.objectContaining({ method: 'POST' })
      );
    });

    it('should assign scoped role with expiration', async () => {
      const assignment = {
        id: 'assignment-1',
        user_id: 'user-123',
        role_id: 'role-123',
        scope: 'project:123',
        expires_at: '2024-12-31T23:59:59Z',
        created_at: '2024-01-01T00:00:00Z',
      };

      mockFetch.mockResolvedValueOnce(mockFetchResponse({ data: assignment }));

      const result = await roles.assignRole('user-123', {
        role_id: 'role-123',
        scope: 'project:123',
        expires_at: '2024-12-31T23:59:59Z',
      });

      expect(result.scope).toBe('project:123');
      expect(result.expires_at).toBe('2024-12-31T23:59:59Z');
    });
  });

  describe('removeRole', () => {
    it('should remove role from user', async () => {
      mockFetch.mockResolvedValueOnce(mock204Response());

      await roles.removeRole('user-123', 'role-123');

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/users/user-123/roles/role-123'),
        expect.objectContaining({ method: 'DELETE' })
      );
    });

    it('should remove scoped role', async () => {
      mockFetch.mockResolvedValueOnce(mock204Response());

      await roles.removeRole('user-123', 'role-123', 'project:123');

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('scope=project%3A123'),
        expect.any(Object)
      );
    });
  });

  describe('getUserPermissions', () => {
    it('should get computed user permissions', async () => {
      const permissions = {
        user_id: 'user-123',
        scope: null,
        permissions: ['posts:create', 'posts:edit', 'posts:delete'],
        roles: ['editor', 'admin'],
      };

      mockFetch.mockResolvedValueOnce(mockFetchResponse({ data: permissions }));

      const result = await roles.getUserPermissions('user-123');

      expect(result).toEqual(permissions);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/users/user-123/permissions'),
        expect.objectContaining({ method: 'GET' })
      );
    });

    it('should get scoped permissions', async () => {
      mockFetch.mockResolvedValueOnce(mockFetchResponse({ data: {} }));

      await roles.getUserPermissions('user-123', 'project:123');

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('scope=project%3A123'),
        expect.any(Object)
      );
    });
  });
});
