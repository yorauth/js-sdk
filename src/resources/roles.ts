import type { HttpClient } from "../http.js";
import type {
  AssignRoleData,
  ComputedPermissions,
  CreateRoleData,
  ListRolesParams,
  PaginatedResponse,
  Role,
  UpdateRoleData,
  UserRoleAssignment,
} from "../types.js";

/**
 * RBAC role management resource.
 *
 * Provides CRUD operations for roles, user-role assignments, and
 * computed permission retrieval. All endpoints require JWT authentication.
 */
export class RoleResource {
  /** @internal */
  constructor(private readonly http: HttpClient) {}

  /**
   * List roles for the application with optional search and pagination.
   *
   * @param params - Optional search, pagination, and include options.
   * @returns A paginated list of roles.
   *
   * @example
   * ```ts
   * const roles = await yorauth.roles.list({ search: "admin", per_page: 10 });
   * console.log(roles.data);
   * ```
   */
  async list(params?: ListRolesParams): Promise<PaginatedResponse<Role>> {
    return this.http.request<PaginatedResponse<Role>>(
      "GET",
      this.http.buildAppUrl("roles"),
      {
        params: params as Record<string, string | number | boolean | undefined>,
      },
    );
  }

  /**
   * Create a new role with optional permissions.
   *
   * @param data - Role name, display name, description, and permission names.
   * @returns The created role wrapped in an API resource envelope.
   */
  async create(data: CreateRoleData): Promise<Role> {
    const response = await this.http.request<{ data: Role }>(
      "POST",
      this.http.buildAppUrl("roles"),
      { body: data },
    );
    return response.data;
  }

  /**
   * Get a single role by ID, including its permissions.
   *
   * @param roleId - The UUID of the role.
   * @returns The role with permissions and counts.
   */
  async get(roleId: string): Promise<Role> {
    const response = await this.http.request<{ data: Role }>(
      "GET",
      this.http.buildAppUrl(`roles/${roleId}`),
    );
    return response.data;
  }

  /**
   * Update an existing role's display name, description, or permissions.
   *
   * @param roleId - The UUID of the role to update.
   * @param data - Fields to update.
   * @returns The updated role.
   */
  async update(roleId: string, data: UpdateRoleData): Promise<Role> {
    const response = await this.http.request<{ data: Role }>(
      "PUT",
      this.http.buildAppUrl(`roles/${roleId}`),
      { body: data },
    );
    return response.data;
  }

  /**
   * Delete a role.
   *
   * System roles and roles currently assigned to users cannot be deleted.
   *
   * @param roleId - The UUID of the role to delete.
   */
  async delete(roleId: string): Promise<void> {
    await this.http.request<void>(
      "DELETE",
      this.http.buildAppUrl(`roles/${roleId}`),
    );
  }

  /**
   * List all roles assigned to a specific user.
   *
   * @param userId - The UUID of the user.
   * @param scope - Optional scope filter.
   * @returns The user's role assignments.
   */
  async getUserRoles(userId: string, scope?: string): Promise<UserRoleAssignment[]> {
    const response = await this.http.request<{ data: UserRoleAssignment[] }>(
      "GET",
      this.http.buildAppUrl(`users/${userId}/roles`),
      { params: { scope } },
    );
    return response.data;
  }

  /**
   * Assign a role to a user.
   *
   * @param userId - The UUID of the user.
   * @param data - Role ID, optional scope, and optional expiration.
   * @returns The created assignment record.
   */
  async assignRole(userId: string, data: AssignRoleData): Promise<UserRoleAssignment> {
    const response = await this.http.request<{ data: UserRoleAssignment }>(
      "POST",
      this.http.buildAppUrl(`users/${userId}/roles`),
      { body: data },
    );
    return response.data;
  }

  /**
   * Remove a role from a user.
   *
   * @param userId - The UUID of the user.
   * @param roleId - The UUID of the role to remove.
   * @param scope - Optional scope to match.
   */
  async removeRole(userId: string, roleId: string, scope?: string): Promise<void> {
    await this.http.request<void>(
      "DELETE",
      this.http.buildAppUrl(`users/${userId}/roles/${roleId}`),
      { params: { scope } },
    );
  }

  /**
   * Get the computed (aggregated) permissions for a user across all their roles.
   *
   * @param userId - The UUID of the user.
   * @param scope - Optional scope filter.
   * @returns The user's computed permissions and contributing roles.
   */
  async getUserPermissions(userId: string, scope?: string): Promise<ComputedPermissions> {
    const response = await this.http.request<{ data: ComputedPermissions }>(
      "GET",
      this.http.buildAppUrl(`users/${userId}/permissions`),
      { params: { scope } },
    );
    return response.data;
  }
}
