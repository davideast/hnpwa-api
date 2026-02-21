import { describe, it, expect, vi } from 'vitest';
import { registerUserResource } from '../src/mcp/resources/user';

describe('MCP User Resource', () => {
  it('should register a resource named user with correct URI pattern', async () => {
    const mockServer = {
      resource: vi.fn()
    };
    const mockHnapi = {
      user: vi.fn()
    };

    registerUserResource(mockServer, mockHnapi);

    expect(mockServer.resource).toHaveBeenCalledWith(
      "user",
      "hn://user/{id}",
      expect.any(Function)
    );
  });

  it('should fetch user data when the resource handler is called', async () => {
    const mockServer = {
      resource: vi.fn()
    };
    const mockUser = { id: 'pg', karma: 1000 };
    const mockHnapi = {
      user: vi.fn().mockResolvedValue(mockUser)
    };

    registerUserResource(mockServer, mockHnapi);

    // Get the handler function passed to mockServer.resource
    const handler = mockServer.resource.mock.calls[0][2];

    const mockUri = { href: 'hn://user/pg' };
    const result = await handler(mockUri, { id: 'pg' });

    expect(mockHnapi.user).toHaveBeenCalledWith('pg');
    expect(result).toEqual({
      contents: [{
        uri: 'hn://user/pg',
        text: JSON.stringify(mockUser, null, 2),
        mimeType: "application/json"
      }]
    });
  });

  it('should throw error when user is not found', async () => {
    const mockServer = {
      resource: vi.fn()
    };
    const mockHnapi = {
      user: vi.fn().mockResolvedValue(null)
    };

    registerUserResource(mockServer, mockHnapi);

    const handler = mockServer.resource.mock.calls[0][2];

    const mockUri = { href: 'hn://user/nonexistent' };
    await expect(handler(mockUri, { id: 'nonexistent' })).rejects.toThrow('User nonexistent not found');
  });
});
