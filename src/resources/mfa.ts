import type { HttpClient } from "../http.js";
import type {
  MfaBackupCodesResponse,
  MfaConfirmResponse,
  MfaSetupResponse,
  MfaStatus,
} from "../types.js";

/**
 * Multi-Factor Authentication management resource.
 *
 * Provides TOTP setup, confirmation, status checking, and backup code
 * management. Requires JWT authentication and user ownership verification.
 */
export class MfaResource {
  /** @internal */
  constructor(private readonly http: HttpClient) {}

  /**
   * Begin TOTP MFA setup for a user.
   *
   * Returns a provisioning URI suitable for QR code generation and
   * the raw TOTP secret for manual entry.
   *
   * @param userId - The UUID of the user.
   * @param label - Optional human-readable label for the TOTP method.
   * @returns The method ID, provisioning URI, and secret.
   *
   * @example
   * ```ts
   * const setup = await yorauth.mfa.setupTotp("user-uuid");
   * // Render QR code from setup.provisioning_uri
   * // User enters 6-digit code from authenticator app
   * await yorauth.mfa.confirmTotp("user-uuid", {
   *   method_id: setup.method_id,
   *   code: "123456",
   * });
   * ```
   */
  async setupTotp(userId: string, label?: string): Promise<MfaSetupResponse> {
    const response = await this.http.request<{ data: MfaSetupResponse }>(
      "POST",
      this.http.buildAppUrl(`users/${userId}/mfa/totp/setup`),
      { body: { label } },
    );
    return response.data;
  }

  /**
   * Confirm TOTP setup by verifying a code from the authenticator app.
   *
   * On success, MFA is activated and one-time backup codes are returned.
   * Store these backup codes securely -- they cannot be retrieved again.
   *
   * @param userId - The UUID of the user.
   * @param data - The method ID from setup and a 6-digit TOTP code.
   * @returns A confirmation message and backup codes.
   */
  async confirmTotp(
    userId: string,
    data: { method_id: string; code: string },
  ): Promise<MfaConfirmResponse> {
    const response = await this.http.request<{ data: MfaConfirmResponse }>(
      "POST",
      this.http.buildAppUrl(`users/${userId}/mfa/totp/confirm`),
      { body: data },
    );
    return response.data;
  }

  /**
   * Disable TOTP MFA for a user.
   *
   * Requires the user's current password for re-authentication.
   *
   * @param userId - The UUID of the user.
   * @param password - The user's current password for verification.
   */
  async disableTotp(userId: string, password: string): Promise<void> {
    await this.http.request<void>(
      "DELETE",
      this.http.buildAppUrl(`users/${userId}/mfa/totp`),
      { body: { password } },
    );
  }

  /**
   * Get the current MFA status for a user.
   *
   * Returns whether MFA is enabled, the configured methods, and
   * the remaining backup code count.
   *
   * @param userId - The UUID of the user.
   * @returns The MFA status summary.
   */
  async getStatus(userId: string): Promise<MfaStatus> {
    const response = await this.http.request<{ data: MfaStatus }>(
      "GET",
      this.http.buildAppUrl(`users/${userId}/mfa/status`),
    );
    return response.data;
  }

  /**
   * Regenerate backup codes, invalidating any previous codes.
   *
   * Requires the user's current password for re-authentication.
   *
   * @param userId - The UUID of the user.
   * @param password - The user's current password for verification.
   * @returns New backup codes and a confirmation message.
   */
  async regenerateBackupCodes(
    userId: string,
    password: string,
  ): Promise<MfaBackupCodesResponse> {
    const response = await this.http.request<{ data: MfaBackupCodesResponse }>(
      "POST",
      this.http.buildAppUrl(`users/${userId}/mfa/backup-codes/regenerate`),
      { body: { password } },
    );
    return response.data;
  }
}
