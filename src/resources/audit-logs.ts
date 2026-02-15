import type { HttpClient } from "../http.js";
import type { AuditLog, AuditLogFilters } from "../types.js";

/**
 * Audit log viewing resource.
 *
 * Provides read-only access to authorization audit logs for an
 * application. Supports filtering by action, target user, and
 * target role. Requires JWT authentication.
 */
export class AuditLogResource {
  /** @internal */
  constructor(private readonly http: HttpClient) {}

  /**
   * List audit log entries with optional filters.
   *
   * Returns the most recent entries (default 50, max 100) sorted
   * by newest first.
   *
   * @param filters - Optional filters for action, target user, target role, and limit.
   * @returns An array of audit log entries.
   *
   * @example
   * ```ts
   * // Get all role assignment events
   * const logs = await yorauth.auditLogs.list({ action: "role.assigned" });
   *
   * // Get all events for a specific user
   * const userLogs = await yorauth.auditLogs.list({
   *   target_user_id: "user-uuid",
   *   limit: 25,
   * });
   * ```
   */
  async list(filters?: AuditLogFilters): Promise<AuditLog[]> {
    const response = await this.http.request<{ data: AuditLog[] }>(
      "GET",
      this.http.buildAppUrl("audit-logs"),
      {
        params: filters as Record<string, string | number | boolean | undefined>,
      },
    );
    return response.data;
  }
}
