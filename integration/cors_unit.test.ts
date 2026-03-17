import { describe, it, expect, vi } from 'vitest';
import cors from 'cors';
import { trigger } from '../src/index';

// Mock firebase-functions
vi.mock('firebase-functions/v1', () => ({
  runWith: vi.fn().mockReturnValue({
    https: {
      onRequest: vi.fn().mockImplementation((handler) => handler)
    }
  })
}));

// Mock the server module to avoid complex dependencies
vi.mock('../src/server', () => ({
  createExpressApp: vi.fn(),
  FIREBASE_APP_NAME: 'test-app'
}));

// Mock cors to see what options it's called with
vi.mock('cors', () => ({
  default: vi.fn().mockReturnValue((req, res, next) => next())
}));

describe('CORS Configuration', () => {
  it('should use origin: true by default when useCors is enabled', () => {
    trigger({ useCors: true });
    expect(cors).toHaveBeenCalledWith(expect.objectContaining({ origin: true }));
  });

  it('should use custom origin when provided', () => {
    const customOrigin = 'https://example.com';
    trigger({ useCors: true, corsOrigin: customOrigin });
    expect(cors).toHaveBeenCalledWith(expect.objectContaining({ origin: customOrigin }));
  });

  it('should use custom origin array when provided', () => {
    const customOrigins = ['https://example.com', 'https://another.com'];
    trigger({ useCors: true, corsOrigin: customOrigins });
    expect(cors).toHaveBeenCalledWith(expect.objectContaining({ origin: customOrigins }));
  });

  it('should use origin: false when explicitly set', () => {
    trigger({ useCors: true, corsOrigin: false });
    expect(cors).toHaveBeenCalledWith(expect.objectContaining({ origin: false }));
  });
});
