import { describe, it, expect } from 'vitest';
import { YorAuthError } from '../src/errors.js';

describe('YorAuthError', () => {
  it('should set message, code, and status', () => {
    const error = new YorAuthError('Not found', 'NOT_FOUND', 404);

    expect(error.message).toBe('Not found');
    expect(error.code).toBe('NOT_FOUND');
    expect(error.status).toBe(404);
    expect(error.details).toBeUndefined();
  });

  it('should set optional details', () => {
    const details = {
      email: ['The email field is required.'],
      password: ['The password must be at least 8 characters.'],
    };
    const error = new YorAuthError('Validation failed', 'VALIDATION_ERROR', 422, details);

    expect(error.details).toEqual(details);
  });

  it('should be an instance of Error', () => {
    const error = new YorAuthError('Test', 'TEST', 500);

    expect(error).toBeInstanceOf(Error);
    expect(error).toBeInstanceOf(YorAuthError);
  });

  it('should have name set to YorAuthError', () => {
    const error = new YorAuthError('Test', 'TEST', 500);

    expect(error.name).toBe('YorAuthError');
  });

  it('should maintain prototype chain for instanceof checks', () => {
    const error = new YorAuthError('Test', 'TEST', 500);

    expect(Object.getPrototypeOf(error)).toBe(YorAuthError.prototype);
  });

  it('should have a stack trace', () => {
    const error = new YorAuthError('Test', 'TEST', 500);

    expect(error.stack).toBeDefined();
    expect(error.stack).toContain('YorAuthError');
  });
});
