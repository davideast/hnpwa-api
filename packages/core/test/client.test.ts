import { describe, it, expect, vi, beforeEach } from 'vitest';
import { HnClient } from '../src/client';

// Mock fetch
const fetchMock = vi.fn();
global.fetch = fetchMock;

describe('HnClient', () => {
  let client: HnClient;

  beforeEach(() => {
    client = new HnClient();
    vi.clearAllMocks();
  });

  it('should fetch an item correctly', async () => {
    const mockItem = {
      id: 1,
      type: 'story',
      title: 'Test Story',
      by: 'user1',
      time: 1600000000,
      url: 'http://example.com',
      score: 100,
      descendants: 0,
    };

    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => mockItem,
    });

    const result = await client.getItem(1);
    expect(result).toBeDefined();
    expect(result?.title).toBe('Test Story');
    expect(result?.comments_count).toBe(0);
  });

  it('should fetch user correctly', async () => {
     const mockUser = {
        id: 'user1',
        created: 1600000000,
        karma: 100,
        about: 'About me'
     };

     fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => mockUser
     });

     const result = await client.getUser('user1');
     expect(result).toBeDefined();
     expect(result?.id).toBe('user1');
  });

  it('should fetch stories correctly', async () => {
     const mockIds = [1, 2, 3];
     const mockItem1 = { id: 1, title: 'Story 1', type: 'story', time: 1600000000, by: 'user1', score: 10 };
     const mockItem2 = { id: 2, title: 'Story 2', type: 'story', time: 1600000000, by: 'user2', score: 20 };
     const mockItem3 = { id: 3, title: 'Story 3', type: 'story', time: 1600000000, by: 'user3', score: 30 };

     fetchMock
        .mockResolvedValueOnce({ ok: true, json: async () => mockIds })
        .mockResolvedValueOnce({ ok: true, json: async () => mockItem1 })
        .mockResolvedValueOnce({ ok: true, json: async () => mockItem2 })
        .mockResolvedValueOnce({ ok: true, json: async () => mockItem3 });

     const result = await client.getStories('topstories', 1);
     expect(result).toHaveLength(3);
     expect(result[0].title).toBe('Story 1');
  });
});
