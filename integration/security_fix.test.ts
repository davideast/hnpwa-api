import { describe, it, expect, beforeAll, vi } from 'vitest';
import request from 'supertest';
import { createExpressApp } from '../src/server';

// Mock offline API to avoid missing file errors
vi.mock('../src/offline/api', () => {
  return {
    default: vi.fn().mockReturnValue({
      index: () => ({ name: 'Welcome to the HNPWA API' }),
      news: async () => ([{ id: 1, title: 'Test' }]),
      newest: async () => ([]),
      ask: async () => ([]),
      show: async () => ([]),
      jobs: async () => ([]),
      user: async () => ({ id: 'test' }),
      item: async () => ({ id: 1 })
    })
  };
});

describe('Security Fix: Race Condition in Global Configuration', () => {
  let app: any;

  beforeAll(() => {
    // We use createExpressApp to include the prettyPrint middleware
    app = createExpressApp({
      firebaseAppName: 'test-security-fix',
      offline: true // use offline to avoid real Firebase calls in this test
    });
  });

  it('should return minified JSON by default', async () => {
    const response = await request(app).get('/news.json');
    expect(response.status).toBe(200);
    // Check that there are no newlines in the body (minified)
    expect(response.text).not.toContain('\n');
  });

  it('should return pretty-printed JSON when print=pretty is provided', async () => {
    const response = await request(app).get('/news.json?print=pretty');
    expect(response.status).toBe(200);
    // Check that there are newlines and indentation
    expect(response.text).toContain('\n');
    expect(response.text).toContain('  "');
  });

  it('should return pretty-printed JSON for the index page', async () => {
    const response = await request(app).get('/');
    expect(response.status).toBe(200);
    // Index page is forced to be pretty by prettyIndex middleware
    expect(response.text).toContain('\n');
    expect(response.text).toContain('  "');
  });

  it('should handle JSONP and respect pretty print', async () => {
    const response = await request(app).get('/news.json?callback=myCallback&print=pretty');
    expect(response.status).toBe(200);
    expect(response.text).toContain('/**/ typeof myCallback === \'function\' && myCallback(');
    expect(response.text).toContain('\n');
    expect(response.text).toContain('  "');
  });

  it('should handle JSONP minified by default', async () => {
    const response = await request(app).get('/news.json?callback=myCallback');
    expect(response.status).toBe(200);
    expect(response.text).toContain('/**/ typeof myCallback === \'function\' && myCallback(');
    expect(response.text).not.toContain('\n');
  });
});
