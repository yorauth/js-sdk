import type { HttpClient } from "../http.js";
import type {
  AddTeamMemberData,
  AssignTeamRoleData,
  CreateTeamData,
  ListTeamsParams,
  PaginatedResponse,
  Team,
  TeamDetail,
  TeamMember,
  TeamRoleAssignment,
  UpdateTeamData,
  UserTeam,
} from "../types.js";

/**
 * Team management resource.
 *
 * Provides CRUD operations for teams, member management,
 * team role assignments, and user team lookups.
 * All endpoints require JWT authentication.
 */
export class TeamResource {
  /** @internal */
  constructor(private readonly http: HttpClient) {}

  /**
   * List teams for the application with optional search and pagination.
   *
   * @param params - Optional search and pagination options.
   * @returns A paginated list of teams.
   *
   * @example
   * ```ts
   * const teams = await yorauth.teams.list({ search: "engineering", per_page: 10 });
   * console.log(teams.data);
   * ```
   */
  async list(params?: ListTeamsParams): Promise<PaginatedResponse<Team>> {
    return this.http.request<PaginatedResponse<Team>>(
      "GET",
      this.http.buildAppUrl("teams"),
      {
        params: params as Record<string, string | number | boolean | undefined>,
      },
    );
  }

  /**
   * Create a new team.
   *
   * @param data - Team name, description, scope, and metadata.
   * @returns The created team.
   */
  async create(data: CreateTeamData): Promise<Team> {
    const response = await this.http.request<{ data: Team }>(
      "POST",
      this.http.buildAppUrl("teams"),
      { body: data },
    );
    return response.data;
  }

  /**
   * Get a single team by ID, including its members and roles.
   *
   * @param teamId - The UUID of the team.
   * @returns The team with members and roles.
   */
  async get(teamId: string): Promise<TeamDetail> {
    const response = await this.http.request<{ data: TeamDetail }>(
      "GET",
      this.http.buildAppUrl(`teams/${teamId}`),
    );
    return response.data;
  }

  /**
   * Update an existing team's name, description, scope, or metadata.
   *
   * @param teamId - The UUID of the team to update.
   * @param data - Fields to update.
   * @returns The updated team.
   */
  async update(teamId: string, data: UpdateTeamData): Promise<Team> {
    const response = await this.http.request<{ data: Team }>(
      "PUT",
      this.http.buildAppUrl(`teams/${teamId}`),
      { body: data },
    );
    return response.data;
  }

  /**
   * Delete a team.
   *
   * @param teamId - The UUID of the team to delete.
   */
  async delete(teamId: string): Promise<void> {
    await this.http.request<void>(
      "DELETE",
      this.http.buildAppUrl(`teams/${teamId}`),
    );
  }

  /**
   * List all members of a team.
   *
   * @param teamId - The UUID of the team.
   * @returns The team's members.
   */
  async getMembers(teamId: string): Promise<TeamMember[]> {
    const response = await this.http.request<{ data: TeamMember[] }>(
      "GET",
      this.http.buildAppUrl(`teams/${teamId}/members`),
    );
    return response.data;
  }

  /**
   * Add a member to a team.
   *
   * @param teamId - The UUID of the team.
   * @param data - The user ID to add.
   * @returns The created team member record.
   */
  async addMember(teamId: string, data: AddTeamMemberData): Promise<TeamMember> {
    const response = await this.http.request<{ data: TeamMember }>(
      "POST",
      this.http.buildAppUrl(`teams/${teamId}/members`),
      { body: data },
    );
    return response.data;
  }

  /**
   * Remove a member from a team.
   *
   * @param teamId - The UUID of the team.
   * @param userId - The UUID of the user to remove.
   */
  async removeMember(teamId: string, userId: string): Promise<void> {
    await this.http.request<void>(
      "DELETE",
      this.http.buildAppUrl(`teams/${teamId}/members/${userId}`),
    );
  }

  /**
   * List all role assignments for a team.
   *
   * @param teamId - The UUID of the team.
   * @returns The team's role assignments.
   */
  async getTeamRoles(teamId: string): Promise<TeamRoleAssignment[]> {
    const response = await this.http.request<{ data: TeamRoleAssignment[] }>(
      "GET",
      this.http.buildAppUrl(`teams/${teamId}/roles`),
    );
    return response.data;
  }

  /**
   * Assign a role to a team.
   *
   * @param teamId - The UUID of the team.
   * @param data - Role ID, optional scope, and optional expiration.
   * @returns The created team role assignment.
   */
  async assignTeamRole(teamId: string, data: AssignTeamRoleData): Promise<TeamRoleAssignment> {
    const response = await this.http.request<{ data: TeamRoleAssignment }>(
      "POST",
      this.http.buildAppUrl(`teams/${teamId}/roles`),
      { body: data },
    );
    return response.data;
  }

  /**
   * Remove a role assignment from a team.
   *
   * @param teamId - The UUID of the team.
   * @param roleId - The UUID of the role to remove.
   * @param scope - Optional scope to target a specific scoped assignment.
   */
  async removeTeamRole(teamId: string, roleId: string, scope?: string): Promise<void> {
    await this.http.request<void>("DELETE", this.http.buildAppUrl(`teams/${teamId}/roles/${roleId}`), {
      params: scope ? { scope } : undefined,
    });
  }

  /**
   * Get all teams that a user belongs to.
   *
   * @param userId - The UUID of the user.
   * @returns The user's teams with role information.
   */
  async getUserTeams(userId: string): Promise<UserTeam[]> {
    const response = await this.http.request<{ data: UserTeam[] }>(
      "GET",
      this.http.buildAppUrl(`users/${userId}/teams`),
    );
    return response.data;
  }
}
