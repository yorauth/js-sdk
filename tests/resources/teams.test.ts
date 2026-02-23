import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { TeamResource } from '../../src/resources/teams.js';
import { createMockHttpClient, mockFetchResponse, mockErrorResponse, mock204Response } from '../helpers.js';

describe('TeamResource', () => {
  let mockFetch: ReturnType<typeof vi.fn>;
  let teams: TeamResource;

  beforeEach(() => {
    mockFetch = vi.fn();
    globalThis.fetch = mockFetch;
    const http = createMockHttpClient();
    teams = new TeamResource(http);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  const mockTeam = {
    id: 'team-123',
    name: 'Engineering',
    description: 'Engineering team',
    scope: null,
    metadata: null,
    member_count: 5,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
  };

  const mockTeamDetail = {
    ...mockTeam,
    members: [
      { id: 'member-1', user_id: 'user-1', added_by: null, created_at: '2026-01-01T00:00:00Z' },
    ],
    roles: [
      {
        id: 'tr-1',
        role: { id: 'role-1', name: 'admin', display_name: 'Admin' },
        scope: null,
        granted_at: '2026-01-01T00:00:00Z',
        expires_at: null,
      },
    ],
  };

  const mockMember = {
    id: 'member-1',
    user_id: 'user-1',
    added_by: 'user-2',
    created_at: '2026-01-01T00:00:00Z',
  };

  const mockTeamRole = {
    id: 'tr-1',
    role: { id: 'role-1', name: 'editor', display_name: 'Content Editor' },
    scope: null,
    granted_at: '2026-01-01T00:00:00Z',
    expires_at: null,
  };

  describe('list', () => {
    it('should list teams with pagination', async () => {
      const paginatedResponse = {
        data: [mockTeam],
        links: { first: null, last: null, prev: null, next: null },
        meta: { current_page: 1, from: 1, last_page: 1, path: '/teams', per_page: 15, to: 1, total: 1 },
      };
      mockFetch.mockResolvedValueOnce(mockFetchResponse(paginatedResponse));

      const result = await teams.list({ search: 'engineering', per_page: 10 });

      expect(result.data).toEqual([mockTeam]);
      expect(result.meta.total).toBe(1);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/teams'),
        expect.objectContaining({ method: 'GET' })
      );
    });

    it('should list teams without params', async () => {
      const paginatedResponse = {
        data: [mockTeam],
        links: { first: null, last: null, prev: null, next: null },
        meta: { current_page: 1, from: 1, last_page: 1, path: '/teams', per_page: 15, to: 1, total: 1 },
      };
      mockFetch.mockResolvedValueOnce(mockFetchResponse(paginatedResponse));

      const result = await teams.list();

      expect(result.data).toHaveLength(1);
    });
  });

  describe('create', () => {
    it('should create a team', async () => {
      mockFetch.mockResolvedValueOnce(mockFetchResponse({ data: mockTeam }));

      const result = await teams.create({
        name: 'Engineering',
        description: 'Engineering team',
      });

      expect(result).toEqual(mockTeam);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/teams'),
        expect.objectContaining({ method: 'POST' })
      );
    });
  });

  describe('get', () => {
    it('should get team with members and roles', async () => {
      mockFetch.mockResolvedValueOnce(mockFetchResponse({ data: mockTeamDetail }));

      const result = await teams.get('team-123');

      expect(result).toEqual(mockTeamDetail);
      expect(result.members).toHaveLength(1);
      expect(result.roles).toHaveLength(1);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/teams/team-123'),
        expect.objectContaining({ method: 'GET' })
      );
    });
  });

  describe('update', () => {
    it('should update team', async () => {
      const updatedTeam = { ...mockTeam, name: 'Platform Engineering' };
      mockFetch.mockResolvedValueOnce(mockFetchResponse({ data: updatedTeam }));

      const result = await teams.update('team-123', { name: 'Platform Engineering' });

      expect(result.name).toBe('Platform Engineering');
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/teams/team-123'),
        expect.objectContaining({ method: 'PUT' })
      );
    });
  });

  describe('delete', () => {
    it('should delete team', async () => {
      mockFetch.mockResolvedValueOnce(mock204Response());

      await teams.delete('team-123');

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/teams/team-123'),
        expect.objectContaining({ method: 'DELETE' })
      );
    });
  });

  describe('getMembers', () => {
    it('should list team members', async () => {
      mockFetch.mockResolvedValueOnce(mockFetchResponse({ data: [mockMember] }));

      const result = await teams.getMembers('team-123');

      expect(result).toEqual([mockMember]);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/teams/team-123/members'),
        expect.objectContaining({ method: 'GET' })
      );
    });
  });

  describe('addMember', () => {
    it('should add member to team', async () => {
      mockFetch.mockResolvedValueOnce(mockFetchResponse({ data: mockMember }));

      const result = await teams.addMember('team-123', { user_id: 'user-1' });

      expect(result).toEqual(mockMember);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/teams/team-123/members'),
        expect.objectContaining({ method: 'POST' })
      );
    });
  });

  describe('removeMember', () => {
    it('should remove member from team', async () => {
      mockFetch.mockResolvedValueOnce(mock204Response());

      await teams.removeMember('team-123', 'user-1');

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/teams/team-123/members/user-1'),
        expect.objectContaining({ method: 'DELETE' })
      );
    });
  });

  describe('getTeamRoles', () => {
    it('should list team role assignments', async () => {
      mockFetch.mockResolvedValueOnce(mockFetchResponse({ data: [mockTeamRole] }));

      const result = await teams.getTeamRoles('team-123');

      expect(result).toEqual([mockTeamRole]);
      expect(result[0].role.name).toBe('editor');
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/teams/team-123/roles'),
        expect.objectContaining({ method: 'GET' })
      );
    });
  });

  describe('assignTeamRole', () => {
    it('should assign role to team', async () => {
      mockFetch.mockResolvedValueOnce(mockFetchResponse({ data: mockTeamRole }));

      const result = await teams.assignTeamRole('team-123', { role_id: 'role-1' });

      expect(result).toEqual(mockTeamRole);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/teams/team-123/roles'),
        expect.objectContaining({ method: 'POST' })
      );
    });

    it('should assign role with scope and expiration', async () => {
      const scopedRole = { ...mockTeamRole, scope: 'project:abc', expires_at: '2027-01-01T00:00:00Z' };
      mockFetch.mockResolvedValueOnce(mockFetchResponse({ data: scopedRole }));

      const result = await teams.assignTeamRole('team-123', {
        role_id: 'role-1',
        scope: 'project:abc',
        expires_at: '2027-01-01T00:00:00Z',
      });

      expect(result.scope).toBe('project:abc');
      expect(result.expires_at).toBe('2027-01-01T00:00:00Z');
    });
  });

  describe('removeTeamRole', () => {
    it('should remove role from team', async () => {
      mockFetch.mockResolvedValueOnce(mock204Response());

      await teams.removeTeamRole('team-123', 'role-1');

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/teams/team-123/roles/role-1'),
        expect.objectContaining({ method: 'DELETE' })
      );
    });
  });

  describe('getUserTeams', () => {
    it('should get teams for a user', async () => {
      const userTeam = {
        id: 'team-123',
        name: 'Engineering',
        description: 'Engineering team',
        scope: null,
        roles: [{ role_id: 'role-1', role_name: 'admin', scope: null }],
      };
      mockFetch.mockResolvedValueOnce(mockFetchResponse({ data: [userTeam] }));

      const result = await teams.getUserTeams('user-1');

      expect(result).toEqual([userTeam]);
      expect(result[0].roles[0].role_name).toBe('admin');
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/users/user-1/teams'),
        expect.objectContaining({ method: 'GET' })
      );
    });

    it('should return empty array when user has no teams', async () => {
      mockFetch.mockResolvedValueOnce(mockFetchResponse({ data: [] }));

      const result = await teams.getUserTeams('user-1');

      expect(result).toEqual([]);
    });
  });

  describe('error handling', () => {
    it('should throw on team not found', async () => {
      mockFetch.mockResolvedValueOnce(
        mockErrorResponse('Team not found', 'NOT_FOUND', 404)
      );

      await expect(teams.get('nonexistent')).rejects.toThrow();
    });

    it('should throw on create validation error', async () => {
      mockFetch.mockResolvedValueOnce(
        mockErrorResponse('Validation failed', 'VALIDATION_ERROR', 422)
      );

      await expect(
        teams.create({ name: '' })
      ).rejects.toThrow();
    });

    it('should throw on duplicate member', async () => {
      mockFetch.mockResolvedValueOnce(
        mockErrorResponse('User is already a member', 'CONFLICT', 409)
      );

      await expect(
        teams.addMember('team-123', { user_id: 'user-1' })
      ).rejects.toThrow();
    });

    it('should throw on unauthorized access', async () => {
      mockFetch.mockResolvedValueOnce(
        mockErrorResponse('Forbidden', 'FORBIDDEN', 403)
      );

      await expect(teams.delete('team-123')).rejects.toThrow();
    });
  });
});
