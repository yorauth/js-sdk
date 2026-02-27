import type { HttpClient } from "../http.js";
import type {
  SamlConnection,
  SamlInitiateData,
  SamlInitiateResponse,
} from "../types.js";

/**
 * SAML Single Sign-On resource for enterprise SSO integration.
 *
 * All endpoints are **public** (no auth required) and are used
 * by client applications to initiate SAML flows and discover
 * available SAML connections.
 */
export class SamlResource {
  /** @internal */
  constructor(private readonly http: HttpClient) {}

  /**
   * Initiate a SAML SSO authentication flow.
   *
   * Returns a redirect URL to the Identity Provider (IdP).
   * The user should be redirected to this URL to authenticate.
   *
   * @param data - SAML initiation parameters including the connection identifier.
   * @returns The IdP redirect URL and request metadata.
   *
   * @example
   * ```ts
   * const result = await yorauth.saml.initiate({
   *   connection_id: "saml-connection-uuid",
   *   redirect_uri: "https://app.example.com/auth/saml/callback",
   * });
   * window.location.href = result.redirect_url;
   * ```
   */
  async initiate(data: SamlInitiateData): Promise<SamlInitiateResponse> {
    const response = await this.http.request<{ data: SamlInitiateResponse }>(
      "POST",
      this.http.buildAppUrl("saml/initiate"),
      { body: data },
    );
    return response.data;
  }

  /**
   * List available SAML connections for the application.
   *
   * Returns the active SAML IdP connections that users can
   * authenticate against.
   *
   * @returns An array of SAML connection configurations.
   *
   * @example
   * ```ts
   * const connections = await yorauth.saml.getConnections();
   * connections.forEach(c => console.log(c.name, c.idp_entity_id));
   * ```
   */
  async getConnections(): Promise<SamlConnection[]> {
    const response = await this.http.request<{ data: SamlConnection[] }>(
      "GET",
      this.http.buildAppUrl("saml/connections"),
    );
    return response.data;
  }
}
