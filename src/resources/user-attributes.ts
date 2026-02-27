import type { HttpClient } from "../http.js";
import type { MessageResponse, UserAttribute } from "../types.js";

/**
 * User attribute resource for Attribute-Based Access Control (ABAC).
 *
 * Manages custom key-value attributes on user profiles that can be
 * used in ABAC policy evaluations. Requires JWT authentication with
 * appropriate permissions (`attributes:read` or `attributes:manage`).
 */
export class UserAttributeResource {
  /** @internal */
  constructor(private readonly http: HttpClient) {}

  /**
   * Get all attributes for a user.
   *
   * Requires `attributes:read` permission.
   *
   * @param userId - The UUID of the user.
   * @returns A flat key-value map of user attributes.
   *
   * @example
   * ```ts
   * const attrs = await yorauth.userAttributes.get("user-uuid");
   * console.log(attrs["department"]); // "engineering"
   * ```
   */
  async get(userId: string): Promise<UserAttribute> {
    const response = await this.http.request<{ data: UserAttribute }>(
      "GET",
      this.http.buildAppUrl(`users/${userId}/attributes`),
    );
    return response.data;
  }

  /**
   * Set (create or update) attributes for a user.
   *
   * Attributes are upserted: existing keys are updated, new keys are created.
   * Requires `attributes:manage` permission.
   *
   * @param userId - The UUID of the user.
   * @param attributes - Key-value pairs to set on the user.
   * @returns The updated flat key-value map of user attributes.
   *
   * @example
   * ```ts
   * const attrs = await yorauth.userAttributes.set("user-uuid", {
   *   department: "engineering",
   *   clearance_level: 3,
   *   region: "us-west",
   * });
   * ```
   */
  async set(
    userId: string,
    attributes: Record<string, unknown>,
  ): Promise<UserAttribute> {
    const response = await this.http.request<{ data: UserAttribute }>(
      "PUT",
      this.http.buildAppUrl(`users/${userId}/attributes`),
      { body: { attributes } },
    );
    return response.data;
  }

  /**
   * Delete a single attribute from a user.
   *
   * Requires `attributes:manage` permission.
   *
   * @param userId - The UUID of the user.
   * @param key - The attribute key to delete.
   */
  async delete(userId: string, key: string): Promise<void> {
    await this.http.request<void>(
      "DELETE",
      this.http.buildAppUrl(`users/${userId}/attributes/${encodeURIComponent(key)}`),
    );
  }
}
