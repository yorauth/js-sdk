import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { WebhookResource } from '../../src/resources/webhooks.js';
import { createMockHttpClient, mockFetchResponse, mockErrorResponse, mock204Response } from '../helpers.js';

describe('WebhookResource', () => {
  let mockFetch: ReturnType<typeof vi.fn>;
  let webhooks: WebhookResource;

  beforeEach(() => {
    mockFetch = vi.fn();
    globalThis.fetch = mockFetch;
    const http = createMockHttpClient();
    webhooks = new WebhookResource(http);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  const mockWebhook = {
    id: 'webhook-123',
    url: 'https://example.com/webhook',
    events: ['user.created', 'user.login'],
    is_active: true,
    created_at: '2024-01-01T00:00:00Z',
  };

  describe('list', () => {
    it('should list webhooks', async () => {
      mockFetch.mockResolvedValueOnce(mockFetchResponse({ data: [mockWebhook] }));

      const result = await webhooks.list();

      expect(result).toEqual([mockWebhook]);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/webhooks'),
        expect.objectContaining({ method: 'GET' })
      );
    });
  });

  describe('create', () => {
    it('should create webhook with secret', async () => {
      const webhookWithSecret = { ...mockWebhook, secret: 'whsec_abc123' };
      mockFetch.mockResolvedValueOnce(mockFetchResponse({ data: webhookWithSecret }));

      const result = await webhooks.create({
        url: 'https://example.com/webhook',
        events: ['user.created', 'user.login'],
      });

      expect(result.secret).toBe('whsec_abc123');
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/webhooks'),
        expect.objectContaining({ method: 'POST' })
      );
    });

    it('should handle invalid URL error', async () => {
      mockFetch.mockResolvedValueOnce(
        mockErrorResponse('Invalid webhook URL', 'INVALID_WEBHOOK_URL', 422)
      );

      await expect(
        webhooks.create({ url: 'invalid-url', events: ['user.created'] })
      ).rejects.toThrow();
    });
  });

  describe('get', () => {
    it('should get webhook by ID', async () => {
      mockFetch.mockResolvedValueOnce(mockFetchResponse({ data: mockWebhook }));

      const result = await webhooks.get('webhook-123');

      expect(result).toEqual(mockWebhook);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/webhooks/webhook-123'),
        expect.objectContaining({ method: 'GET' })
      );
    });
  });

  describe('update', () => {
    it('should update webhook URL', async () => {
      const updatedWebhook = { ...mockWebhook, url: 'https://example.com/new-webhook' };
      mockFetch.mockResolvedValueOnce(mockFetchResponse({ data: updatedWebhook }));

      const result = await webhooks.update('webhook-123', {
        url: 'https://example.com/new-webhook',
      });

      expect(result.url).toBe('https://example.com/new-webhook');
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/webhooks/webhook-123'),
        expect.objectContaining({ method: 'PUT' })
      );
    });

    it('should update webhook events', async () => {
      mockFetch.mockResolvedValueOnce(mockFetchResponse({ data: mockWebhook }));

      await webhooks.update('webhook-123', {
        events: ['role.assigned', 'role.removed'],
      });

      const callBody = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(callBody.events).toEqual(['role.assigned', 'role.removed']);
    });

    it('should deactivate webhook', async () => {
      mockFetch.mockResolvedValueOnce(mockFetchResponse({ data: { ...mockWebhook, is_active: false } }));

      const result = await webhooks.update('webhook-123', { is_active: false });

      expect(result.is_active).toBe(false);
    });
  });

  describe('delete', () => {
    it('should delete webhook', async () => {
      mockFetch.mockResolvedValueOnce(mock204Response());

      await webhooks.delete('webhook-123');

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/webhooks/webhook-123'),
        expect.objectContaining({ method: 'DELETE' })
      );
    });
  });

  describe('getDeliveries', () => {
    it('should get webhook deliveries', async () => {
      const deliveries = [
        {
          id: 'delivery-1',
          event: 'user.created',
          response_status: 200,
          delivered_at: '2024-01-01T00:00:00Z',
          retry_count: 0,
          created_at: '2024-01-01T00:00:00Z',
        },
        {
          id: 'delivery-2',
          event: 'user.login',
          response_status: null,
          delivered_at: null,
          retry_count: 3,
          created_at: '2024-01-02T00:00:00Z',
        },
      ];

      mockFetch.mockResolvedValueOnce(mockFetchResponse({ data: deliveries }));

      const result = await webhooks.getDeliveries('webhook-123');

      expect(result).toEqual(deliveries);
      expect(result[0].response_status).toBe(200);
      expect(result[1].response_status).toBeNull();
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/webhooks/webhook-123/deliveries'),
        expect.objectContaining({ method: 'GET' })
      );
    });

    it('should return empty array when no deliveries', async () => {
      mockFetch.mockResolvedValueOnce(mockFetchResponse({ data: [] }));

      const result = await webhooks.getDeliveries('webhook-123');

      expect(result).toEqual([]);
    });
  });
});
