import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { createBareExpressApp, initializeApp } from '../src/server';
import api, { MAX_PAGES } from '../src/api';

describe('Integration: API & Server', () => {
  let app: any;

  beforeAll(() => {
    // Initialize app with default config
    app = createBareExpressApp();
  });

  it('should have Express server running and responding to /', async () => {
    const response = await request(app).get('/');
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('name');
    expect(response.body.name).toContain('HNPWA API');
  });

  it('should handle API routes (e.g., /news.json)', async () => {
    // This hits the real HN Firebase, so it tests Firebase setup too.
    // We limit page to 1 to avoid heavy load.
    const response = await request(app).get('/news.json?page=1');
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body.length).toBeGreaterThan(0);
    expect(response.body[0]).toHaveProperty('id');
    expect(response.body[0]).toHaveProperty('title');
  });

  it('should fetch item details correctly', async () => {
    // Fetch a known item (e.g., id 1 or a recent one from news)
    // We'll use the one we just fetched to be safe it exists
    const newsResponse = await request(app).get('/news.json?page=1');
    const firstItem = newsResponse.body[0];

    const itemResponse = await request(app).get(`/item/${firstItem.id}.json`);
    expect(itemResponse.status).toBe(200);
    expect(itemResponse.body).toHaveProperty('id', firstItem.id);
    expect(itemResponse.body).toHaveProperty('title');
  });

  it('should fetch poll data correctly', async () => {
    // This is a known poll item
    const pollId = 33223222;
    const response = await request(app).get(`/item/${pollId}.json`);
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('id', pollId);
    expect(response.body).toHaveProperty('type', 'poll');
    expect(response.body).toHaveProperty('parts');
    expect(Array.isArray(response.body.parts)).toBe(true);
    expect(response.body.parts.length).toBeGreaterThan(0);
    expect(response.body.parts[0]).toHaveProperty('id');
    expect(response.body.parts[0]).toHaveProperty('type', 'pollopt');
  });

  it('should fetch user details correctly', async () => {
    // 'davideast' is used in the example endpoint factory
    const response = await request(app).get('/user/davideast.json');
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('id', 'davideast');
    expect(response.body).toHaveProperty('created_time');
  });

  it('should handle 404 for unknown routes', async () => {
    const response = await request(app).get('/unknown-route');
    // Express default 404 is HTML usually, but createBareExpressApp might not have a catch-all
    // Let's check status.
    expect(response.status).toBe(404);
  });
});
