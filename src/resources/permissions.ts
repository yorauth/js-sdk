import type { HttpClient } from "../http.js";
import type { BulkPermissionCheckResult, PermissionCheckResult } from "../types.js";

/**
 * Permission checking resource.
 *
 * Provides single and bulk authorization checks with Redis caching
 * on the server side. Requires JWT authentication.
 */
export class PermissionsResource {
  /** @internal */
  constructor(private readonly http: HttpClient) {}

  /**
   * Check if a user has a specific permission.
   *
   * Permissions follow the `resource:action` format (e.g. `"posts:create"`).
   * Supports wildcard matching (e.g. `"posts:*"`).
   *
   * @param userId - The UUID of the user to check.
   * @param permission - The permission string in `resource:action` format.
   * @returns Whether the user is allowed, the permission checked, and cache status.
   *
   * @example
   * ```ts
   * const result = await yorauth.permissions.check("user-uuid", "posts:create");
   * if (result.allowed) {
   *   // User can create posts
   * }
   * ```
   */
  async check(userId: string, permission: string): Promise<PermissionCheckResult> {
    return this.http.request<PermissionCheckResult>(
      "GET",
      this.http.buildAppUrl("authz/check"),
      {
        params: {
          user_id: userId,
          permission,
        },
      },
    );
  }

  /**
   * Check multiple permissions for a user in a single request.
   *
   * More efficient than calling {@link check} multiple times.
   * Limited to 50 permissions per request.
   *
   * @param userId - The UUID of the user to check.
   * @param permissions - Array of permission strings in `resource:action` format.
   * @returns A map of permission strings to boolean results.
   *
   * @example
   * ```ts
   * const result = await yorauth.permissions.checkBulk("user-uuid", [
   *   "posts:create",
   *   "posts:delete",
   *   "users:manage",
   * ]);
   * console.log(result.results["posts:create"]); // true or false
   * ```
   */
  async checkBulk(
    userId: string,
    permissions: string[],
  ): Promise<BulkPermissionCheckResult> {
    return this.http.request<BulkPermissionCheckResult>(
      "POST",
      this.http.buildAppUrl("authz/check-bulk"),
      {
        body: {
          user_id: userId,
          permissions,
        },
      },
    );
  }
}
