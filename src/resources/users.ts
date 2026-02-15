import type { HttpClient } from "../http.js";
import type {
  AppUser,
  ChangePasswordData,
  MessageResponse,
  UpdateProfileData,
} from "../types.js";

/**
 * User profile management resource.
 *
 * All endpoints require JWT authentication **and** user ownership
 * verification (the authenticated user must match the `userId` parameter).
 */
export class UserResource {
  /** @internal */
  constructor(private readonly http: HttpClient) {}

  /**
   * Get the profile of a specific user.
   *
   * @param userId - The UUID of the user.
   * @returns The user profile data.
   *
   * @example
   * ```ts
   * const profile = await yorauth.users.getProfile("user-uuid");
   * console.log(profile.email);
   * ```
   */
  async getProfile(userId: string): Promise<AppUser> {
    const response = await this.http.request<{ data: AppUser }>(
      "GET",
      this.http.buildAppUrl(`users/${userId}/profile`),
    );
    return response.data;
  }

  /**
   * Update a user's profile information.
   *
   * @param userId - The UUID of the user.
   * @param data - Fields to update (name, avatar_url, metadata).
   * @returns The updated user profile.
   */
  async updateProfile(userId: string, data: UpdateProfileData): Promise<AppUser> {
    const response = await this.http.request<{ data: AppUser }>(
      "PUT",
      this.http.buildAppUrl(`users/${userId}/profile`),
      { body: data },
    );
    return response.data;
  }

  /**
   * Change the authenticated user's password.
   *
   * @param userId - The UUID of the user.
   * @param data - Current password and new password with confirmation.
   * @returns A confirmation message.
   */
  async changePassword(userId: string, data: ChangePasswordData): Promise<MessageResponse> {
    const response = await this.http.request<{ data: MessageResponse }>(
      "POST",
      this.http.buildAppUrl(`users/${userId}/change-password`),
      { body: data },
    );
    return response.data;
  }

  /**
   * Delete (soft-delete) a user account.
   *
   * This revokes all active refresh tokens and marks the user as deleted.
   *
   * @param userId - The UUID of the user to delete.
   */
  async deleteAccount(userId: string): Promise<void> {
    await this.http.request<void>(
      "DELETE",
      this.http.buildAppUrl(`users/${userId}`),
    );
  }

  /**
   * Export all personal data for a user (GDPR Article 15 - Right of Access).
   *
   * Rate limited to 1 request per 60 minutes per user.
   *
   * @param userId - The UUID of the user.
   * @returns The exported data payload.
   */
  async exportData(userId: string): Promise<Record<string, unknown>> {
    const response = await this.http.request<{ data: Record<string, unknown> }>(
      "GET",
      this.http.buildAppUrl(`users/${userId}/data-export`),
    );
    return response.data;
  }
}
