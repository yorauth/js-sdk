import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { OidcResource } from '../../src/resources/oidc.js';
import { createMockHttpClient, mockFetchResponse, mockErrorResponse, mock204Response } from '../helpers.js';

describe('OidcResource', () => {
  let mockFetch: ReturnType<typeof vi.fn>;
  let oidc: OidcResource;

  beforeEach(() => {
    mockFetch = vi.fn();
    globalThis.fetch = mockFetch;
    const http = createMockHttpClient();
    oidc = new OidcResource(http);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  const mockClient = {
    id: 'client-123',
    client_id: 'oidc_client_abc',
    name: 'My App',
    description: 'Test application',
    logo_url: null,
    redirect_uris: ['https://example.com/callback'],
    allowed_scopes: ['openid', 'profile', 'email'],
    is_active: true,
    created_at: '2024-01-01T00:00:00Z',
  };

  describe('listClients', () => {
    it('should list OIDC clients', async () => {
      mockFetch.mockResolvedValueOnce(mockFetchResponse({ data: [mockClient] }));

      const result = await oidc.listClients();

      expect(result).toEqual([mockClient]);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/oidc/clients'),
        expect.objectContaining({ method: 'GET' })
      );
    });
  });

  describe('createClient', () => {
    it('should create OIDC client with secret', async () => {
      const clientWithSecret = { ...mockClient, client_secret: 'secret_abc123' };
      mockFetch.mockResolvedValueOnce(mockFetchResponse({ data: clientWithSecret }));

      const result = await oidc.createClient({
        name: 'My App',
        redirect_uris: ['https://example.com/callback'],
      });

      expect(result.client_secret).toBe('secret_abc123');
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/oidc/clients'),
        expect.objectContaining({ method: 'POST' })
      );
    });

    it('should create client with all optional fields', async () => {
      mockFetch.mockResolvedValueOnce(mockFetchResponse({ data: mockClient }));

      await oidc.createClient({
        name: 'My App',
        redirect_uris: ['https://example.com/callback'],
        description: 'Test app',
        logo_url: 'https://example.com/logo.png',
        allowed_scopes: ['openid', 'profile'],
      });

      const callBody = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(callBody.description).toBe('Test app');
      expect(callBody.logo_url).toBe('https://example.com/logo.png');
    });
  });

  describe('getClient', () => {
    it('should get OIDC client by ID', async () => {
      mockFetch.mockResolvedValueOnce(mockFetchResponse({ data: mockClient }));

      const result = await oidc.getClient('client-123');

      expect(result).toEqual(mockClient);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/oidc/clients/client-123'),
        expect.objectContaining({ method: 'GET' })
      );
    });
  });

  describe('updateClient', () => {
    it('should update OIDC client', async () => {
      const updatedClient = { ...mockClient, name: 'Updated App' };
      mockFetch.mockResolvedValueOnce(mockFetchResponse({ data: updatedClient }));

      const result = await oidc.updateClient('client-123', { name: 'Updated App' });

      expect(result.name).toBe('Updated App');
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/oidc/clients/client-123'),
        expect.objectContaining({ method: 'PUT' })
      );
    });

    it('should deactivate client', async () => {
      mockFetch.mockResolvedValueOnce(mockFetchResponse({ data: mockClient }));

      await oidc.updateClient('client-123', { is_active: false });

      const callBody = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(callBody.is_active).toBe(false);
    });
  });

  describe('deleteClient', () => {
    it('should delete OIDC client', async () => {
      mockFetch.mockResolvedValueOnce(mock204Response());

      await oidc.deleteClient('client-123');

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/oidc/clients/client-123'),
        expect.objectContaining({ method: 'DELETE' })
      );
    });
  });

  describe('getDiscovery', () => {
    it('should fetch OIDC discovery document', async () => {
      const discovery = {
        issuer: 'https://api.yorauth.dev',
        authorization_endpoint: 'https://api.yorauth.dev/oidc/authorize',
        token_endpoint: 'https://api.yorauth.dev/oidc/token',
        userinfo_endpoint: 'https://api.yorauth.dev/oidc/userinfo',
        jwks_uri: 'https://api.yorauth.dev/.well-known/jwks.json',
      };

      mockFetch.mockResolvedValueOnce(mockFetchResponse(discovery));

      const result = await oidc.getDiscovery();

      expect(result.issuer).toBe('https://api.yorauth.dev');
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('.well-known/openid-configuration'),
        expect.any(Object)
      );
    });
  });

  describe('getJwks', () => {
    it('should fetch JWKS', async () => {
      const jwks = {
        keys: [
          {
            kty: 'RSA',
            use: 'sig',
            kid: 'key-1',
            n: 'modulus',
            e: 'AQAB',
          },
        ],
      };

      mockFetch.mockResolvedValueOnce(mockFetchResponse(jwks));

      const result = await oidc.getJwks();

      expect(result.keys).toHaveLength(1);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('.well-known/jwks.json'),
        expect.any(Object)
      );
    });
  });

  describe('authorize', () => {
    it('should initiate authorization code flow', async () => {
      mockFetch.mockResolvedValueOnce(
        mockFetchResponse({
          code: 'auth_code_123',
          state: 'state_abc',
          redirect_uri: 'https://example.com/callback',
        })
      );

      const result = await oidc.authorize({
        response_type: 'code',
        client_id: 'oidc_client_abc',
        redirect_uri: 'https://example.com/callback',
        scope: 'openid profile email',
      });

      expect(result.code).toBe('auth_code_123');
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/oidc/authorize'),
        expect.objectContaining({ method: 'GET' })
      );
    });

    it('should include PKCE parameters', async () => {
      mockFetch.mockResolvedValueOnce(
        mockFetchResponse({ code: 'auth_code_123', state: null, redirect_uri: 'https://example.com/callback' })
      );

      await oidc.authorize({
        response_type: 'code',
        client_id: 'oidc_client_abc',
        redirect_uri: 'https://example.com/callback',
        scope: 'openid',
        code_challenge: 'challenge_abc',
        code_challenge_method: 'S256',
      });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('code_challenge=challenge_abc'),
        expect.any(Object)
      );
    });
  });

  describe('exchangeToken', () => {
    it('should exchange authorization code for tokens', async () => {
      mockFetch.mockResolvedValueOnce(
        mockFetchResponse({
          access_token: 'access_token_abc',
          token_type: 'Bearer',
          expires_in: 3600,
          id_token: 'id_token_jwt',
        })
      );

      const result = await oidc.exchangeToken({
        grant_type: 'authorization_code',
        code: 'auth_code_123',
        redirect_uri: 'https://example.com/callback',
        client_id: 'oidc_client_abc',
        client_secret: 'secret_abc',
      });

      expect(result.access_token).toBe('access_token_abc');
      expect(result.id_token).toBe('id_token_jwt');
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/oidc/token'),
        expect.objectContaining({ method: 'POST' })
      );
    });

    it('should include PKCE verifier', async () => {
      mockFetch.mockResolvedValueOnce(mockFetchResponse({ access_token: 'token', token_type: 'Bearer', expires_in: 3600, id_token: 'jwt' }));

      await oidc.exchangeToken({
        grant_type: 'authorization_code',
        code: 'auth_code_123',
        redirect_uri: 'https://example.com/callback',
        client_id: 'oidc_client_abc',
        client_secret: 'secret_abc',
        code_verifier: 'verifier_abc',
      });

      const callBody = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(callBody.code_verifier).toBe('verifier_abc');
    });

    it('should handle invalid code error', async () => {
      mockFetch.mockResolvedValueOnce(
        new Response(JSON.stringify({ error: 'invalid_grant', error_description: 'Invalid authorization code' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        })
      );

      await expect(
        oidc.exchangeToken({
          grant_type: 'authorization_code',
          code: 'invalid_code',
          redirect_uri: 'https://example.com/callback',
          client_id: 'oidc_client_abc',
          client_secret: 'secret_abc',
        })
      ).rejects.toThrow();
    });
  });

  describe('getUserInfo', () => {
    it('should get user info with default scopes', async () => {
      mockFetch.mockResolvedValueOnce(
        mockFetchResponse({
          sub: 'user-123',
          name: 'Jane Doe',
          email: 'jane@example.com',
          email_verified: true,
        })
      );

      const result = await oidc.getUserInfo();

      expect(result.sub).toBe('user-123');
      expect(result.email).toBe('jane@example.com');
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/oidc/userinfo'),
        expect.objectContaining({ method: 'GET' })
      );
    });

    it('should get user info with custom scopes', async () => {
      mockFetch.mockResolvedValueOnce(mockFetchResponse({ sub: 'user-123' }));

      await oidc.getUserInfo('openid profile');

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('scopes=openid+profile'),
        expect.any(Object)
      );
    });
  });
});
