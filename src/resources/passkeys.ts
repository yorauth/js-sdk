import type { HttpClient } from "../http.js";
import type {
  AuthResponse,
  MfaChallengeResponse,
  MessageResponse,
  PasskeyAuthenticationOptions,
  PasskeyAuthenticateVerifyData,
  PasskeyRegistrationOptions,
  PasskeyRegisterVerifyData,
  PasskeyCredential,
  UpdatePasskeyData,
} from "../types.js";

/**
 * Passkey (WebAuthn) resource for passwordless authentication
 * and credential management.
 *
 * Authentication endpoints (authenticateOptions, authenticateVerify) are
 * **public** (no auth required). Registration and management endpoints
 * require JWT authentication and user ownership.
 */
export class PasskeyResource {
  /** @internal */
  constructor(private readonly http: HttpClient) {}

  // -----------------------------------------------------------------------
  // Passkey Authentication (public — no auth required)
  // -----------------------------------------------------------------------

  /**
   * Request authentication options for a passkey login.
   *
   * Returns a PublicKeyCredentialRequestOptions-compatible object
   * that should be passed to `navigator.credentials.get()`.
   *
   * @returns Authentication options including challenge and allowed credentials.
   *
   * @example
   * ```ts
   * const options = await yorauth.passkeys.authenticateOptions();
   * const credential = await navigator.credentials.get({
   *   publicKey: options,
   * });
   * ```
   */
  async authenticateOptions(): Promise<PasskeyAuthenticationOptions> {
    const response = await this.http.request<{ data: PasskeyAuthenticationOptions }>(
      "POST",
      this.http.buildAppUrl("users/passkey/authenticate/options"),
    );
    return response.data;
  }

  /**
   * Verify a passkey authentication assertion and complete login.
   *
   * Pass the credential returned by `navigator.credentials.get()`.
   * If MFA is enabled, the response may contain an MFA challenge.
   *
   * @param data - The WebAuthn assertion response data.
   * @returns Tokens and user data, or an MFA challenge.
   *
   * @example
   * ```ts
   * const result = await yorauth.passkeys.authenticateVerify({
   *   id: credential.id,
   *   rawId: btoa(String.fromCharCode(...new Uint8Array(credential.rawId))),
   *   response: {
   *     authenticatorData: btoa(String.fromCharCode(...new Uint8Array(credential.response.authenticatorData))),
   *     clientDataJSON: btoa(String.fromCharCode(...new Uint8Array(credential.response.clientDataJSON))),
   *     signature: btoa(String.fromCharCode(...new Uint8Array(credential.response.signature))),
   *   },
   *   type: "public-key",
   * });
   * ```
   */
  async authenticateVerify(
    data: PasskeyAuthenticateVerifyData,
  ): Promise<AuthResponse | MfaChallengeResponse> {
    const response = await this.http.request<{ data: AuthResponse | MfaChallengeResponse }>(
      "POST",
      this.http.buildAppUrl("users/passkey/authenticate/verify"),
      { body: data },
    );
    return response.data;
  }

  // -----------------------------------------------------------------------
  // Passkey Registration (JWT + user ownership required)
  // -----------------------------------------------------------------------

  /**
   * Request registration options for creating a new passkey.
   *
   * Returns a PublicKeyCredentialCreationOptions-compatible object
   * that should be passed to `navigator.credentials.create()`.
   *
   * @param userId - The UUID of the user registering the passkey.
   * @returns Registration options including challenge and relying party info.
   *
   * @example
   * ```ts
   * const options = await yorauth.passkeys.registerOptions("user-uuid");
   * const credential = await navigator.credentials.create({
   *   publicKey: options,
   * });
   * ```
   */
  async registerOptions(userId: string): Promise<PasskeyRegistrationOptions> {
    const response = await this.http.request<{ data: PasskeyRegistrationOptions }>(
      "POST",
      this.http.buildAppUrl(`users/${userId}/passkeys/register/options`),
    );
    return response.data;
  }

  /**
   * Verify a passkey registration attestation and store the credential.
   *
   * Pass the credential returned by `navigator.credentials.create()`.
   *
   * @param userId - The UUID of the user.
   * @param data - The WebAuthn attestation response data.
   * @returns The created passkey credential record.
   *
   * @example
   * ```ts
   * const passkey = await yorauth.passkeys.registerVerify("user-uuid", {
   *   id: credential.id,
   *   rawId: btoa(String.fromCharCode(...new Uint8Array(credential.rawId))),
   *   response: {
   *     attestationObject: btoa(String.fromCharCode(...new Uint8Array(credential.response.attestationObject))),
   *     clientDataJSON: btoa(String.fromCharCode(...new Uint8Array(credential.response.clientDataJSON))),
   *   },
   *   type: "public-key",
   * });
   * ```
   */
  async registerVerify(
    userId: string,
    data: PasskeyRegisterVerifyData,
  ): Promise<PasskeyCredential> {
    const response = await this.http.request<{ data: PasskeyCredential }>(
      "POST",
      this.http.buildAppUrl(`users/${userId}/passkeys/register/verify`),
      { body: data },
    );
    return response.data;
  }

  // -----------------------------------------------------------------------
  // Passkey Management (JWT + user ownership required)
  // -----------------------------------------------------------------------

  /**
   * List all registered passkeys for a user.
   *
   * @param userId - The UUID of the user.
   * @returns An array of passkey credential records.
   *
   * @example
   * ```ts
   * const passkeys = await yorauth.passkeys.list("user-uuid");
   * passkeys.forEach(pk => console.log(pk.name, pk.created_at));
   * ```
   */
  async list(userId: string): Promise<PasskeyCredential[]> {
    const response = await this.http.request<{ data: PasskeyCredential[] }>(
      "GET",
      this.http.buildAppUrl(`users/${userId}/passkeys`),
    );
    return response.data;
  }

  /**
   * Update a passkey's metadata (e.g., friendly name).
   *
   * @param userId - The UUID of the user.
   * @param credentialId - The credential ID of the passkey to update.
   * @param data - Fields to update.
   * @returns The updated passkey credential record.
   */
  async update(
    userId: string,
    credentialId: string,
    data: UpdatePasskeyData,
  ): Promise<PasskeyCredential> {
    const response = await this.http.request<{ data: PasskeyCredential }>(
      "PUT",
      this.http.buildAppUrl(`users/${userId}/passkeys/${credentialId}`),
      { body: data },
    );
    return response.data;
  }

  /**
   * Delete a registered passkey.
   *
   * @param userId - The UUID of the user.
   * @param credentialId - The credential ID of the passkey to delete.
   */
  async delete(userId: string, credentialId: string): Promise<void> {
    await this.http.request<void>(
      "DELETE",
      this.http.buildAppUrl(`users/${userId}/passkeys/${credentialId}`),
    );
  }
}
