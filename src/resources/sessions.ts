import type { HttpClient } from "../http.js";
import type { DestroyAllSessionsResult, Session } from "../types.js";

/**
 * Session management resource.
 *
 * Allows users to view and revoke their active sessions (refresh tokens).
 * Requires JWT authentication and user ownership verification.
 */
export class SessionResource {
  /** @internal */
  constructor(private readonly http: HttpClient) {}

  /**
   * List all active sessions for a user.
   *
   * Active sessions are non-revoked, non-expired refresh tokens.
   *
   * @param userId - The UUID of the user.
   * @returns An array of active sessions.
   *
   * @example
   * ```ts
   * const sessions = await yorauth.sessions.list("user-uuid");
   * sessions.forEach(s => console.log(s.device_info, s.created_at));
   * ```
   */
  async list(userId: string): Promise<Session[]> {
    const response = await this.http.request<{ data: Session[] }>(
      "GET",
      this.http.buildAppUrl(`users/${userId}/sessions`),
    );
    return response.data;
  }

  /**
   * Revoke all active sessions for a user.
   *
   * This invalidates every refresh token, effectively logging the user
   * out of all devices.
   *
   * @param userId - The UUID of the user.
   * @returns The count of revoked sessions and a confirmation message.
   */
  async destroyAll(userId: string): Promise<DestroyAllSessionsResult> {
    const response = await this.http.request<{ data: DestroyAllSessionsResult }>(
      "DELETE",
      this.http.buildAppUrl(`users/${userId}/sessions`),
    );
    return response.data;
  }

  /**
   * Revoke a specific session.
   *
   * @param userId - The UUID of the user.
   * @param sessionId - The UUID of the session (refresh token) to revoke.
   */
  async destroy(userId: string, sessionId: string): Promise<void> {
    await this.http.request<void>(
      "DELETE",
      this.http.buildAppUrl(`users/${userId}/sessions/${sessionId}`),
    );
  }
}
