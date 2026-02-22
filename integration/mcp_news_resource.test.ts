import { describe, it, expect, vi } from 'vitest';
import { newsResource } from '../src/mcp/resources/news.resource';

describe('MCP News Resource', () => {
  it('should register a resource named news with correct URI pattern', async () => {
    const mockServer = {
      resource: vi.fn()
    };
    const mockHnapi = {};

    newsResource.register(mockServer, mockHnapi as any);

    expect(mockServer.resource).toHaveBeenCalledWith(
      "news",
      "hn://{topic}",
      expect.any(Function)
    );
  });

  it('should fetch news stories when the resource handler is called', async () => {
    const mockServer = {
      resource: vi.fn()
    };
    const mockStories = [{ id: 1, title: 'Story 1' }];
    const mockHnapi = {
      news: vi.fn().mockResolvedValue(mockStories)
    };

    newsResource.register(mockServer, mockHnapi as any);

    const handler = mockServer.resource.mock.calls[0][2];

    const mockUri = new URL('hn://news');
    const result = await handler(mockUri, { topic: 'news' });

    expect(mockHnapi.news).toHaveBeenCalledWith({ page: 1 });
    expect(result).toEqual({
      contents: [{
        uri: mockUri.href,
        text: JSON.stringify(mockStories, null, 2),
        mimeType: "application/json"
      }]
    });
  });

  it('should handle pagination via page query parameter', async () => {
    const mockServer = {
      resource: vi.fn()
    };
    const mockStories = [{ id: 2, title: 'Story 2' }];
    const mockHnapi = {
      news: vi.fn().mockResolvedValue(mockStories)
    };

    newsResource.register(mockServer, mockHnapi as any);

    const handler = mockServer.resource.mock.calls[0][2];

    const mockUri = new URL('hn://news?page=2');
    const result = await handler(mockUri, { topic: 'news' });

    expect(mockHnapi.news).toHaveBeenCalledWith({ page: 2 });
    expect(result.contents[0].uri).toContain('page=2');
  });

  it('should fetch other topics like newest', async () => {
    const mockServer = {
      resource: vi.fn()
    };
    const mockStories = [{ id: 3, title: 'Newest Story' }];
    const mockHnapi = {
      newest: vi.fn().mockResolvedValue(mockStories)
    };

    newsResource.register(mockServer, mockHnapi as any);

    const handler = mockServer.resource.mock.calls[0][2];

    const mockUri = new URL('hn://newest');
    await handler(mockUri, { topic: 'newest' });

    expect(mockHnapi.newest).toHaveBeenCalledWith({ page: 1 });
  });

  it('should throw error for invalid topics', async () => {
    const mockServer = {
      resource: vi.fn()
    };
    const mockHnapi = {};

    newsResource.register(mockServer, mockHnapi as any);

    const handler = mockServer.resource.mock.calls[0][2];

    const mockUri = new URL('hn://invalid');
    await expect(handler(mockUri, { topic: 'invalid' })).rejects.toThrow('Invalid topic: invalid');
  });
});
