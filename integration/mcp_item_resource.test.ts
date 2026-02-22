import { describe, it, expect, vi } from 'vitest';
import { registerItemResource } from '../src/mcp/resources/item';

describe('MCP Item Resource', () => {
  it('should register a resource named item with correct URI pattern', async () => {
    const mockServer = {
      resource: vi.fn()
    };
    const mockHnapi = {};

    registerItemResource(mockServer, mockHnapi as any);

    expect(mockServer.resource).toHaveBeenCalledWith(
      "item",
      "hn://item/{id}",
      expect.any(Function)
    );
  });

  it('should fetch item data when the resource handler is called', async () => {
    const mockServer = {
      resource: vi.fn()
    };
    const mockItem = { id: 123, title: 'Test Item' };
    const mockHnapi = {
      item: vi.fn().mockResolvedValue(mockItem)
    };

    registerItemResource(mockServer, mockHnapi as any);

    const handler = mockServer.resource.mock.calls[0][2];

    const mockUri = { href: 'hn://item/123' };
    const result = await handler(mockUri, { id: '123' });

    expect(mockHnapi.item).toHaveBeenCalledWith(123);
    expect(result).toEqual({
      contents: [{
        uri: 'hn://item/123',
        text: JSON.stringify(mockItem, null, 2),
        mimeType: "application/json"
      }]
    });
  });

  it('should throw error when item is not found', async () => {
    const mockServer = {
      resource: vi.fn()
    };
    const mockHnapi = {
      item: vi.fn().mockResolvedValue(null)
    };

    registerItemResource(mockServer, mockHnapi as any);

    const handler = mockServer.resource.mock.calls[0][2];

    const mockUri = { href: 'hn://item/999' };
    await expect(handler(mockUri, { id: '999' })).rejects.toThrow('Item 999 not found');
  });
});
