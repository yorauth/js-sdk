import { createHmac, timingSafeEqual } from "node:crypto";
import { YorAuthError } from "./errors.js";
import type { WebhookEvent } from "./types.js";

/**
 * Webhook signature verification utility.
 *
 * Use this class on your server to verify incoming webhook payloads
 * from the YorAuth platform. Webhooks are signed with HMAC-SHA256
 * using your webhook secret.
 *
 * @example
 * ```ts
 * import { Webhook } from "@yorauth/sdk";
 *
 * // In your webhook handler (Express, Fastify, etc.)
 * const payload = req.body; // raw string body
 * const signature = req.headers["x-yorauth-signature"];
 *
 * const event = Webhook.constructEvent(payload, signature, webhookSecret);
 * console.log(event.event); // e.g. "user.created"
 * ```
 */
export class Webhook {
  /**
   * Verify a webhook signature using timing-safe comparison.
   *
   * @param payload - Raw JSON request body (string).
   * @param signature - Value of the `X-YorAuth-Signature` header.
   * @param secret - Your webhook secret.
   * @returns `true` if the signature is valid, `false` otherwise.
   */
  static verifySignature(
    payload: string,
    signature: string,
    secret: string,
  ): boolean {
    const expected =
      "sha256=" + createHmac("sha256", secret).update(payload).digest("hex");

    // Use timing-safe comparison to prevent timing attacks
    try {
      return timingSafeEqual(
        Buffer.from(expected, "utf8"),
        Buffer.from(signature, "utf8"),
      );
    } catch {
      // Buffers of different lengths throw — that means mismatch
      return false;
    }
  }

  /**
   * Verify the signature and parse the webhook payload.
   *
   * @param payload - Raw JSON request body (string).
   * @param signature - Value of the `X-YorAuth-Signature` header.
   * @param secret - Your webhook secret.
   * @returns The parsed webhook event.
   * @throws {YorAuthError} If the signature is invalid or the payload is malformed.
   */
  static constructEvent(
    payload: string,
    signature: string,
    secret: string,
  ): WebhookEvent {
    if (!Webhook.verifySignature(payload, signature, secret)) {
      throw new YorAuthError(
        "Invalid webhook signature",
        "WEBHOOK_SIGNATURE_INVALID",
        400,
      );
    }

    try {
      return JSON.parse(payload) as WebhookEvent;
    } catch {
      throw new YorAuthError(
        "Invalid JSON in webhook payload",
        "WEBHOOK_INVALID_PAYLOAD",
        400,
      );
    }
  }
}
