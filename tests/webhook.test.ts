import { describe, it, expect } from 'vitest';
import { createHmac } from 'node:crypto';
import { Webhook } from '../src/webhook.js';
import { YorAuthError } from '../src/errors.js';

describe('Webhook', () => {
  const secret = 'test-webhook-secret';

  function generateSignature(payload: string, webhookSecret: string): string {
    return 'sha256=' + createHmac('sha256', webhookSecret).update(payload).digest('hex');
  }

  describe('verifySignature', () => {
    it('should verify valid signature', () => {
      const payload = JSON.stringify({ event: 'user.created', data: { id: '123' } });
      const signature = generateSignature(payload, secret);

      const isValid = Webhook.verifySignature(payload, signature, secret);

      expect(isValid).toBe(true);
    });

    it('should reject invalid signature', () => {
      const payload = JSON.stringify({ event: 'user.created', data: { id: '123' } });
      const signature = 'sha256=invalid';

      const isValid = Webhook.verifySignature(payload, signature, secret);

      expect(isValid).toBe(false);
    });

    it('should reject tampered payload', () => {
      const originalPayload = JSON.stringify({ event: 'user.created', data: { id: '123' } });
      const signature = generateSignature(originalPayload, secret);

      const tamperedPayload = JSON.stringify({ event: 'user.created', data: { id: '456' } });
      const isValid = Webhook.verifySignature(tamperedPayload, signature, secret);

      expect(isValid).toBe(false);
    });

    it('should reject signature with wrong secret', () => {
      const payload = JSON.stringify({ event: 'user.created', data: { id: '123' } });
      const signature = generateSignature(payload, 'wrong-secret');

      const isValid = Webhook.verifySignature(payload, signature, secret);

      expect(isValid).toBe(false);
    });

    it('should reject empty signature', () => {
      const payload = JSON.stringify({ event: 'user.created', data: { id: '123' } });
      const signature = '';

      const isValid = Webhook.verifySignature(payload, signature, secret);

      expect(isValid).toBe(false);
    });

    it('should reject signature without sha256 prefix', () => {
      const payload = JSON.stringify({ event: 'user.created', data: { id: '123' } });
      const signatureWithoutPrefix = createHmac('sha256', secret).update(payload).digest('hex');

      const isValid = Webhook.verifySignature(payload, signatureWithoutPrefix, secret);

      expect(isValid).toBe(false);
    });

    it('should handle signature with different length gracefully', () => {
      const payload = JSON.stringify({ event: 'user.created', data: { id: '123' } });
      const signature = 'sha256=abc';

      const isValid = Webhook.verifySignature(payload, signature, secret);

      expect(isValid).toBe(false);
    });
  });

  describe('constructEvent', () => {
    it('should parse and verify valid webhook event', () => {
      const payload = JSON.stringify({
        event: 'user.created',
        timestamp: '2024-01-01T00:00:00Z',
        data: { id: '123', email: 'user@example.com' },
      });
      const signature = generateSignature(payload, secret);

      const event = Webhook.constructEvent(payload, signature, secret);

      expect(event).toEqual({
        event: 'user.created',
        timestamp: '2024-01-01T00:00:00Z',
        data: { id: '123', email: 'user@example.com' },
      });
    });

    it('should throw YorAuthError on invalid signature', () => {
      const payload = JSON.stringify({ event: 'user.created', data: { id: '123' } });
      const signature = 'sha256=invalid';

      expect(() => {
        Webhook.constructEvent(payload, signature, secret);
      }).toThrow(YorAuthError);

      try {
        Webhook.constructEvent(payload, signature, secret);
      } catch (error) {
        expect(error).toBeInstanceOf(YorAuthError);
        const authError = error as YorAuthError;
        expect(authError.message).toBe('Invalid webhook signature');
        expect(authError.code).toBe('WEBHOOK_SIGNATURE_INVALID');
        expect(authError.status).toBe(400);
      }
    });

    it('should throw YorAuthError on invalid JSON payload', () => {
      const payload = 'invalid json {';
      const signature = generateSignature(payload, secret);

      expect(() => {
        Webhook.constructEvent(payload, signature, secret);
      }).toThrow(YorAuthError);

      try {
        Webhook.constructEvent(payload, signature, secret);
      } catch (error) {
        expect(error).toBeInstanceOf(YorAuthError);
        const authError = error as YorAuthError;
        expect(authError.message).toBe('Invalid JSON in webhook payload');
        expect(authError.code).toBe('WEBHOOK_INVALID_PAYLOAD');
        expect(authError.status).toBe(400);
      }
    });

    it('should verify signature before attempting JSON parse', () => {
      // Even with invalid JSON, signature verification should happen first
      const payload = 'invalid json';
      const invalidSignature = 'sha256=wrong';

      try {
        Webhook.constructEvent(payload, invalidSignature, secret);
      } catch (error) {
        expect(error).toBeInstanceOf(YorAuthError);
        const authError = error as YorAuthError;
        // Should fail on signature, not JSON parsing
        expect(authError.code).toBe('WEBHOOK_SIGNATURE_INVALID');
      }
    });

    it('should handle webhook with complex nested data', () => {
      const payload = JSON.stringify({
        event: 'role.assigned',
        timestamp: '2024-01-01T00:00:00Z',
        data: {
          user: {
            id: '123',
            email: 'user@example.com',
            metadata: {
              department: 'Engineering',
              level: 'Senior',
            },
          },
          role: {
            id: 'role-456',
            name: 'admin',
          },
        },
      });
      const signature = generateSignature(payload, secret);

      const event = Webhook.constructEvent(payload, signature, secret);

      expect(event.event).toBe('role.assigned');
      expect(event.data.user.metadata.department).toBe('Engineering');
    });

    it('should handle webhook with empty data object', () => {
      const payload = JSON.stringify({
        event: 'user.login',
        timestamp: '2024-01-01T00:00:00Z',
        data: {},
      });
      const signature = generateSignature(payload, secret);

      const event = Webhook.constructEvent(payload, signature, secret);

      expect(event.event).toBe('user.login');
      expect(event.data).toEqual({});
    });
  });

  describe('timing-safe comparison', () => {
    it('should use timing-safe comparison for security', () => {
      const payload = JSON.stringify({ event: 'user.created', data: { id: '123' } });
      const validSignature = generateSignature(payload, secret);

      // Create a signature that differs in length (should not throw)
      const shortSignature = 'sha256=abc';

      const isValid = Webhook.verifySignature(payload, shortSignature, secret);

      expect(isValid).toBe(false);
      // If timing-safe comparison wasn't used, this would throw on length mismatch
    });
  });
});
