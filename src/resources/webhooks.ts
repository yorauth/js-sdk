import type { HttpClient } from "../http.js";
import type {
  CreateWebhookData,
  UpdateWebhookData,
  WebhookConfig,
  WebhookDelivery,
} from "../types.js";

/**
 * Webhook management resource.
 *
 * Create, update, and delete webhook configurations that receive
 * real-time event notifications. View delivery history for debugging.
 * Requires JWT authentication.
 */
export class WebhookResource {
  /** @internal */
  constructor(private readonly http: HttpClient) {}

  /**
   * List all webhook configurations for the application.
   *
   * @returns An array of webhook configurations.
   *
   * @example
   * ```ts
   * const webhooks = await yorauth.webhooks.list();
   * webhooks.forEach(w => console.log(w.url, w.events));
   * ```
   */
  async list(): Promise<WebhookConfig[]> {
    const response = await this.http.request<{ data: WebhookConfig[] }>(
      "GET",
      this.http.buildAppUrl("webhooks"),
    );
    return response.data;
  }

  /**
   * Create a new webhook configuration.
   *
   * The response includes the webhook `secret` in plaintext.
   * Store it securely to verify incoming webhook signatures.
   *
   * @security Store the returned webhook secret securely for signature verification. It cannot be retrieved later.
   *
   * Valid events:
   * `user.created`, `user.login`, `user.updated`, `user.deleted`,
   * `role.assigned`, `role.removed`, `role.created`, `role.updated`, `role.deleted`,
   * `permission.granted`, `permission.revoked`,
   * `connection.created`, `connection.refreshed`, `connection.failed`, `connection.revoked`,
   * `consent.granted`, `mfa.enabled`, `mfa.disabled`,
   * `policy.created`, `policy.updated`, `policy.deleted`,
   * `attribute.set`, `attribute.deleted`.
   *
   * @param data - Webhook URL and subscribed events.
   * @returns The created webhook including the signing secret.
   */
  async create(data: CreateWebhookData): Promise<WebhookConfig> {
    const response = await this.http.request<{ data: WebhookConfig }>(
      "POST",
      this.http.buildAppUrl("webhooks"),
      { body: data },
    );
    return response.data;
  }

  /**
   * Get a single webhook configuration by ID.
   *
   * @param webhookId - The UUID of the webhook.
   * @returns The webhook configuration.
   */
  async get(webhookId: string): Promise<WebhookConfig> {
    const response = await this.http.request<{ data: WebhookConfig }>(
      "GET",
      this.http.buildAppUrl(`webhooks/${webhookId}`),
    );
    return response.data;
  }

  /**
   * Update a webhook configuration.
   *
   * @param webhookId - The UUID of the webhook to update.
   * @param data - Fields to update (URL, events, active status).
   * @returns The updated webhook configuration.
   */
  async update(webhookId: string, data: UpdateWebhookData): Promise<WebhookConfig> {
    const response = await this.http.request<{ data: WebhookConfig }>(
      "PUT",
      this.http.buildAppUrl(`webhooks/${webhookId}`),
      { body: data },
    );
    return response.data;
  }

  /**
   * Delete a webhook configuration.
   *
   * @param webhookId - The UUID of the webhook to delete.
   */
  async delete(webhookId: string): Promise<void> {
    await this.http.request<void>(
      "DELETE",
      this.http.buildAppUrl(`webhooks/${webhookId}`),
    );
  }

  /**
   * Get recent delivery attempts for a webhook.
   *
   * Returns the most recent 50 deliveries sorted by newest first.
   *
   * @param webhookId - The UUID of the webhook.
   * @returns An array of delivery records.
   */
  async getDeliveries(webhookId: string): Promise<WebhookDelivery[]> {
    const response = await this.http.request<{ data: WebhookDelivery[] }>(
      "GET",
      this.http.buildAppUrl(`webhooks/${webhookId}/deliveries`),
    );
    return response.data;
  }
}
