import type { HttpClient } from "../http.js";
import type {
  AuthResponse,
  LoginData,
  MfaChallengeResponse,
  MfaVerifyData,
  MessageResponse,
  RegisterData,
  RegisterResponse,
  ResetPasswordData,
} from "../types.js";

/**
 * Authentication resource handling registration, login, logout,
 * token refresh, password reset, email verification, magic links,
 * and MFA challenge verification.
 *
 * All endpoints in this resource are **public** (no auth required)
 * except `logout` and `refreshToken` which require a refresh token.
 */
export class AuthResource {
  /** @internal */
  constructor(private readonly http: HttpClient) {}

  /**
   * Register a new user for the application.
   *
   * @param data - Registration payload including email, password, and name.
   * @returns The created user data and a confirmation message.
   *
   * @example
   * ```ts
   * const result = await yorauth.auth.register({
   *   email: "user@example.com",
   *   password: "securePassword123",
   *   name: "Jane Doe",
   * });
   * console.log(result.data.id);
   * ```
   */
  async register(data: RegisterData): Promise<RegisterResponse> {
    return this.http.request<RegisterResponse>(
      "POST",
      this.http.buildAppUrl("users/register"),
      { body: data },
    );
  }

  /**
   * Log in a user with email and password.
   *
   * If MFA is enabled for the user, the response will contain
   * `mfa_required: true` along with a `challenge_token`. Use
   * {@link verifyMfa} to complete the login in that case.
   *
   * @param data - Login credentials.
   * @returns Tokens and user data, or an MFA challenge.
   *
   * @example
   * ```ts
   * const result = await yorauth.auth.login({
   *   email: "user@example.com",
   *   password: "securePassword123",
   * });
   *
   * if ("mfa_required" in result) {
   *   // Handle MFA challenge
   * } else {
   *   console.log(result.access_token);
   * }
   * ```
   */
  async login(data: LoginData): Promise<AuthResponse | MfaChallengeResponse> {
    const response = await this.http.request<{ data: AuthResponse | MfaChallengeResponse }>(
      "POST",
      this.http.buildAppUrl("users/login"),
      { body: data },
    );
    return response.data;
  }

  /**
   * Log out the current user by revoking the provided refresh token.
   *
   * @param refreshToken - The refresh token to revoke.
   */
  async logout(refreshToken: string): Promise<void> {
    await this.http.request<void>(
      "POST",
      this.http.buildAppUrl("users/logout"),
      { body: { refresh_token: refreshToken } },
    );
  }

  /**
   * Exchange a refresh token for a new token pair.
   *
   * The previous refresh token is automatically rotated (revoked)
   * and a new one is issued.
   *
   * @param refreshToken - A valid, non-revoked refresh token.
   * @returns A fresh set of tokens and user data.
   */
  async refreshToken(refreshToken: string): Promise<AuthResponse> {
    const response = await this.http.request<{ data: AuthResponse }>(
      "POST",
      this.http.buildAppUrl("users/token/refresh"),
      { body: { refresh_token: refreshToken } },
    );
    return response.data;
  }

  /**
   * Request a password reset email.
   *
   * The API always returns success to prevent email enumeration.
   *
   * @param email - The email address of the account.
   * @returns A confirmation message.
   */
  async forgotPassword(email: string): Promise<MessageResponse> {
    const response = await this.http.request<{ data: MessageResponse }>(
      "POST",
      this.http.buildAppUrl("users/password/forgot"),
      { body: { email } },
    );
    return response.data;
  }

  /**
   * Reset a user's password using a reset token received via email.
   *
   * @param data - Reset token, email, and new password.
   * @returns A confirmation message.
   */
  async resetPassword(data: ResetPasswordData): Promise<MessageResponse> {
    const response = await this.http.request<{ data: MessageResponse }>(
      "POST",
      this.http.buildAppUrl("users/password/reset"),
      { body: data },
    );
    return response.data;
  }

  /**
   * Verify a user's email address using the token received via email.
   *
   * @param token - The email verification token.
   * @returns A confirmation message.
   */
  async verifyEmail(token: string): Promise<MessageResponse> {
    const response = await this.http.request<{ data: MessageResponse }>(
      "POST",
      this.http.buildAppUrl("users/email/verify"),
      { body: { token } },
    );
    return response.data;
  }

  /**
   * Resend the email verification link.
   *
   * The API always returns success to prevent email enumeration.
   *
   * @param email - The email address to send verification to.
   * @returns A confirmation message.
   */
  async resendVerification(email: string): Promise<MessageResponse> {
    const response = await this.http.request<{ data: MessageResponse }>(
      "POST",
      this.http.buildAppUrl("users/email/resend"),
      { body: { email } },
    );
    return response.data;
  }

  /**
   * Request a magic link (passwordless login) to be sent via email.
   *
   * The API always returns success to prevent email enumeration.
   *
   * @param email - The email address to send the magic link to.
   * @param redirectUrl - Optional URL to redirect the user to after login.
   * @returns A confirmation message.
   */
  async requestMagicLink(
    email: string,
    redirectUrl?: string,
  ): Promise<MessageResponse> {
    const response = await this.http.request<{ data: MessageResponse }>(
      "POST",
      this.http.buildAppUrl("users/magic-link"),
      { body: { email, redirect_url: redirectUrl } },
    );
    return response.data;
  }

  /**
   * Verify a magic link token and obtain authentication tokens.
   *
   * @param token - The magic link token from the email.
   * @returns Tokens, user data, and an optional redirect URL.
   */
  async verifyMagicLink(
    token: string,
  ): Promise<AuthResponse & { redirect_url: string | null }> {
    const response = await this.http.request<{
      data: AuthResponse & { redirect_url: string | null };
    }>(
      "POST",
      this.http.buildAppUrl("users/magic-link/verify"),
      { body: { token } },
    );
    return response.data;
  }

  /**
   * Verify an MFA challenge to complete the login flow.
   *
   * Call this after {@link login} returns an `MfaChallengeResponse`.
   *
   * @param data - The challenge token and TOTP/backup code.
   * @returns Tokens and user data upon successful verification.
   */
  async verifyMfa(data: MfaVerifyData): Promise<AuthResponse> {
    const response = await this.http.request<{ data: AuthResponse }>(
      "POST",
      this.http.buildAppUrl("users/mfa/verify"),
      { body: data },
    );
    return response.data;
  }
}
