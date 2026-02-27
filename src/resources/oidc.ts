import type { HttpClient } from "../http.js";
import type {
  CreateOidcClientData,
  OidcAuthorizeParams,
  OidcAuthorizeResponse,
  OidcClient,
  OidcClientCredentialsTokenParams,
  OidcClientWithSecret,
  OidcDeviceAuthorizeParams,
  OidcDeviceAuthorizationResponse,
  OidcDeviceCodeTokenParams,
  OidcLogoutParams,
  OidcTokenParams,
  OidcTokenResponse,
  OidcUserInfo,
  UpdateOidcClientData,
} from "../types.js";

/**
 * OpenID Connect resource combining OIDC client management and
 * OIDC provider endpoints (discovery, authorize, token, userinfo).
 *
 * Client management endpoints require JWT authentication.
 * Discovery and JWKS are public. Authorize and userinfo require JWT.
 * Token exchange is client-authenticated.
 */
export class OidcResource {
  /** @internal */
  constructor(private readonly http: HttpClient) {}

  // -----------------------------------------------------------------------
  // OIDC Client Management
  // -----------------------------------------------------------------------

  /**
   * List all OIDC clients (relying parties) for the application.
   *
   * @returns An array of OIDC client configurations.
   */
  async listClients(): Promise<OidcClient[]> {
    const response = await this.http.request<{ data: OidcClient[] }>(
      "GET",
      this.http.buildAppUrl("oidc/clients"),
    );
    return response.data;
  }

  /**
   * Create a new OIDC client.
   *
   * The response includes the `client_secret` in plaintext.
   * Store it securely -- it cannot be retrieved again.
   *
   * @security Store the returned client_secret securely — it is shown only once. Client secrets are server-side credentials and must never be exposed in client-side code.
   *
   * @param data - Client name, redirect URIs, and optional settings.
   * @returns The created client including the one-time client secret.
   */
  async createClient(data: CreateOidcClientData): Promise<OidcClientWithSecret> {
    const response = await this.http.request<{ data: OidcClientWithSecret }>(
      "POST",
      this.http.buildAppUrl("oidc/clients"),
      { body: data },
    );
    return response.data;
  }

  /**
   * Get a single OIDC client by its internal ID.
   *
   * @param clientId - The internal UUID of the OIDC client.
   * @returns The OIDC client configuration.
   */
  async getClient(clientId: string): Promise<OidcClient> {
    const response = await this.http.request<{ data: OidcClient }>(
      "GET",
      this.http.buildAppUrl(`oidc/clients/${clientId}`),
    );
    return response.data;
  }

  /**
   * Update an existing OIDC client.
   *
   * @param clientId - The internal UUID of the OIDC client.
   * @param data - Fields to update.
   * @returns The updated OIDC client.
   */
  async updateClient(clientId: string, data: UpdateOidcClientData): Promise<OidcClient> {
    const response = await this.http.request<{ data: OidcClient }>(
      "PUT",
      this.http.buildAppUrl(`oidc/clients/${clientId}`),
      { body: data },
    );
    return response.data;
  }

  /**
   * Delete an OIDC client.
   *
   * @param clientId - The internal UUID of the OIDC client to delete.
   */
  async deleteClient(clientId: string): Promise<void> {
    await this.http.request<void>(
      "DELETE",
      this.http.buildAppUrl(`oidc/clients/${clientId}`),
    );
  }

  // -----------------------------------------------------------------------
  // OIDC Provider Endpoints
  // -----------------------------------------------------------------------

  /**
   * Fetch the OpenID Connect Discovery document.
   *
   * Public endpoint -- no authentication required.
   *
   * @returns The OIDC discovery document.
   */
  async getDiscovery(): Promise<Record<string, unknown>> {
    return this.http.request<Record<string, unknown>>(
      "GET",
      this.http.buildRootUrl("api/.well-known/openid-configuration"),
    );
  }

  /**
   * Fetch the JSON Web Key Set (JWKS) used to verify ID tokens.
   *
   * Public endpoint -- no authentication required.
   *
   * @returns The JWKS document.
   */
  async getJwks(): Promise<Record<string, unknown>> {
    return this.http.request<Record<string, unknown>>(
      "GET",
      this.http.buildRootUrl("api/.well-known/jwks.json"),
    );
  }

  /**
   * Initiate an OIDC authorization code request.
   *
   * Requires JWT authentication. Returns an authorization code that
   * can be exchanged for tokens via {@link exchangeToken}.
   *
   * @param params - Standard OIDC authorization parameters.
   * @returns The authorization code, state, and redirect URI.
   */
  async authorize(params: OidcAuthorizeParams): Promise<OidcAuthorizeResponse> {
    return this.http.request<OidcAuthorizeResponse>(
      "GET",
      this.http.buildRootUrl("api/oidc/authorize"),
      {
        params: params as unknown as Record<string, string>,
      },
    );
  }

  /**
   * Exchange an authorization code for an ID token.
   *
   * Client-authenticated endpoint (uses client_id + client_secret).
   * Sends the request as `application/x-www-form-urlencoded` per RFC 6749.
   *
   * @security The client_secret parameter must never be included in client-side code. Token exchange must happen on a server.
   *
   * @param params - Code exchange parameters.
   * @returns The token response including the ID token.
   */
  async exchangeToken(params: OidcTokenParams): Promise<OidcTokenResponse> {
    const formBody: Record<string, string | undefined> = {};
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined) formBody[key] = String(value);
    }
    return this.http.request<OidcTokenResponse>(
      "POST",
      this.http.buildRootUrl("api/oidc/token"),
      { formBody },
    );
  }

  /**
   * Get claims about the authenticated user.
   *
   * Requires JWT authentication.
   *
   * @param scopes - Space-separated scopes (defaults to `"openid profile email"`).
   * @returns User claims based on the requested scopes.
   */
  async getUserInfo(scopes?: string): Promise<OidcUserInfo> {
    return this.http.request<OidcUserInfo>(
      "GET",
      this.http.buildRootUrl("api/oidc/userinfo"),
      {
        params: scopes ? { scopes } : undefined,
      },
    );
  }

  /**
   * Initiate device authorization for input-constrained devices (RFC 8628).
   *
   * Returns a device code and user code. Display the user code and
   * verification URI to the user, then poll {@link exchangeToken} with
   * a device_code grant type.
   *
   * Public endpoint -- no authentication required.
   *
   * @param params - Device authorization parameters (client_id, optional scope).
   * @returns Device code, user code, verification URI, and polling interval.
   *
   * @example
   * ```ts
   * const device = await yorauth.oidc.deviceAuthorize({
   *   client_id: "your-client-id",
   *   scope: "openid profile email",
   * });
   * console.log(`Go to: ${device.verification_uri}`);
   * console.log(`Enter code: ${device.user_code}`);
   * ```
   */
  async deviceAuthorize(
    params: OidcDeviceAuthorizeParams,
  ): Promise<OidcDeviceAuthorizationResponse> {
    return this.http.request<OidcDeviceAuthorizationResponse>(
      "POST",
      this.http.buildRootUrl("api/oidc/device/authorize"),
      { formBody: { ...params } },
    );
  }

  /**
   * Exchange client credentials for an access token (RFC 6749 Section 4.4).
   *
   * Service-to-service authentication without user context.
   * The returned JWT has `sub` set to the client_id.
   *
   * @security Server-to-server only. Both client_id and client_secret are required and must be kept server-side.
   *
   * @param params - Client credentials including client_id and client_secret.
   * @returns Token response (access_token, token_type, expires_in).
   *
   * @example
   * ```ts
   * const tokens = await yorauth.oidc.clientCredentialsToken({
   *   grant_type: "client_credentials",
   *   client_id: "your-client-id",
   *   client_secret: "your-client-secret",
   *   scope: "custom-scope",
   * });
   * ```
   */
  async clientCredentialsToken(
    params: OidcClientCredentialsTokenParams,
  ): Promise<OidcTokenResponse> {
    const formBody: Record<string, string | undefined> = {};
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined) formBody[key] = String(value);
    }
    return this.http.request<OidcTokenResponse>(
      "POST",
      this.http.buildRootUrl("api/oidc/token"),
      { formBody },
    );
  }

  /**
   * Exchange a device code for tokens (RFC 8628).
   *
   * Poll this method at the interval specified by {@link deviceAuthorize}.
   * Throws `YorAuthError` with specific codes during polling:
   * - `authorization_pending` -- user hasn't acted yet, keep polling
   * - `slow_down` -- polling too fast, increase interval
   * - `expired_token` -- device code expired, restart flow
   * - `access_denied` -- user denied the request
   *
   * @param params - Device code token exchange parameters.
   * @returns Token response on successful authorization.
   *
   * @example
   * ```ts
   * const tokens = await yorauth.oidc.deviceCodeToken({
   *   grant_type: "urn:ietf:params:oauth:grant-type:device_code",
   *   device_code: device.device_code,
   *   client_id: "your-client-id",
   * });
   * ```
   */
  async deviceCodeToken(
    params: OidcDeviceCodeTokenParams,
  ): Promise<OidcTokenResponse> {
    const formBody: Record<string, string | undefined> = {};
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined) formBody[key] = String(value);
    }
    return this.http.request<OidcTokenResponse>(
      "POST",
      this.http.buildRootUrl("api/oidc/token"),
      { formBody },
    );
  }

  /**
   * Build an OIDC RP-Initiated Logout URL.
   *
   * Returns a URL string to redirect the user to for server-side
   * session logout. This is a GET endpoint.
   *
   * @param params - Optional logout parameters (id_token_hint, post_logout_redirect_uri).
   * @returns The fully-qualified logout URL.
   *
   * @example
   * ```ts
   * const logoutUrl = yorauth.oidc.buildLogoutUrl({
   *   id_token_hint: idToken,
   *   post_logout_redirect_uri: "https://app.example.com/logged-out",
   * });
   * window.location.href = logoutUrl;
   * ```
   */
  buildLogoutUrl(params?: OidcLogoutParams): string {
    const url = new URL(this.http.buildRootUrl("api/oidc/logout"));
    if (params?.id_token_hint) {
      url.searchParams.set("id_token_hint", params.id_token_hint);
    }
    if (params?.post_logout_redirect_uri) {
      url.searchParams.set("post_logout_redirect_uri", params.post_logout_redirect_uri);
    }
    return url.toString();
  }
}
