import type { HttpClient } from "../http.js";
import type { ApiKey, ApiKeyWithSecret, CreateApiKeyData } from "../types.js";

/**
 * API key management resource.
 *
 * Create, view, and revoke API keys for programmatic access to the
 * application. Requires JWT authentication.
 */
export class ApiKeyResource {
  /** @internal */
  constructor(private readonly http: HttpClient) {}

  /**
   * List all API keys for the application.
   *
   * Note: plaintext keys are never returned after creation.
   *
   * @returns An array of API key records.
   *
   * @example
   * ```ts
   * const keys = await yorauth.apiKeys.list();
   * keys.forEach(k => console.log(k.name, k.key_prefix, k.is_active));
   * ```
   */
  async list(): Promise<ApiKey[]> {
    const response = await this.http.request<{ data: ApiKey[] }>(
      "GET",
      this.http.buildAppUrl("api-keys"),
    );
    return response.data;
  }

  /**
   * Create a new API key.
   *
   * The plaintext key is returned **only once** in the response.
   * Store it securely -- it cannot be retrieved again.
   *
   * @param data - Optional key name and expiration date.
   * @returns The created API key including the one-time plaintext key.
   */
  async create(
    data?: CreateApiKeyData,
  ): Promise<{ data: ApiKeyWithSecret; warning: string }> {
    return this.http.request<{ data: ApiKeyWithSecret; warning: string }>(
      "POST",
      this.http.buildAppUrl("api-keys"),
      { body: data ?? {} },
    );
  }

  /**
   * Get a single API key by ID.
   *
   * Does not include the plaintext key.
   *
   * @param apiKeyId - The UUID of the API key.
   * @returns The API key record.
   */
  async get(apiKeyId: string): Promise<ApiKey> {
    const response = await this.http.request<{ data: ApiKey }>(
      "GET",
      this.http.buildAppUrl(`api-keys/${apiKeyId}`),
    );
    return response.data;
  }

  /**
   * Revoke (soft-delete) an API key.
   *
   * The key will immediately stop working for authentication.
   *
   * @param apiKeyId - The UUID of the API key to revoke.
   */
  async delete(apiKeyId: string): Promise<void> {
    await this.http.request<void>(
      "DELETE",
      this.http.buildAppUrl(`api-keys/${apiKeyId}`),
    );
  }
}
