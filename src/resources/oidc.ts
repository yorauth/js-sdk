import type { HttpClient } from "../http.js";
import type {
  CreateOidcClientData,
  OidcAuthorizeParams,
  OidcAuthorizeResponse,
  OidcClient,
  OidcClientWithSecret,
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
   *
   * @param params - Code exchange parameters.
   * @returns The token response including the ID token.
   */
  async exchangeToken(params: OidcTokenParams): Promise<OidcTokenResponse> {
    return this.http.request<OidcTokenResponse>(
      "POST",
      this.http.buildRootUrl("api/oidc/token"),
      { body: params },
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
}
