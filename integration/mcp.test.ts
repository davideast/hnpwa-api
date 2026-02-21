import { describe, it, expect, vi, beforeEach } from 'vitest';
import { installMcpServer } from '../src/mcp/server';

// Mock the MCP SDK since it might not be installed in the environment
vi.mock("@modelcontextprotocol/sdk/server/mcp.js", () => {
  const McpServer = vi.fn().mockImplementation(function() {
    return {
      resource: vi.fn(),
      connect: vi.fn().mockResolvedValue(undefined),
    };
  });
  return { McpServer };
});

vi.mock("@modelcontextprotocol/sdk/server/sse.js", () => {
  const SSEServerTransport = vi.fn().mockImplementation(function() {
    return {
      handlePostMessage: vi.fn().mockResolvedValue(undefined),
    };
  });
  return { SSEServerTransport };
});

describe('MCP Integration', () => {
  let handlers: Record<string, any>;
  let mockApp: any;
  let mockHnapi: any;

  beforeEach(() => {
    handlers = {};
    mockApp = {
      get: vi.fn((path, handler) => { handlers[path] = handler; }),
      post: vi.fn((path, handler) => { handlers[path] = handler; }),
    };
    mockHnapi = {
      user: vi.fn(),
    };
    vi.clearAllMocks();
  });

  it('should register MCP endpoints and handle sessions', async () => {
    installMcpServer(mockApp, mockHnapi);

    // Give some time for internal async initialization
    await new Promise(resolve => setTimeout(resolve, 50));

    expect(handlers['/sse']).toBeDefined();
    expect(handlers['/messages']).toBeDefined();

    // 1. Connect via SSE to get a session
    const mockRes: any = {
      writeHead: vi.fn(),
      end: vi.fn(),
    };
    const mockReq: any = {
      on: vi.fn(),
    };

    await handlers['/sse'](mockReq, mockRes);

    // Extract sessionId from SSEServerTransport constructor
    const { SSEServerTransport } = await import("@modelcontextprotocol/sdk/server/sse.js");
    const calls = (SSEServerTransport as any).mock.calls;
    const lastCall = calls[calls.length - 1];
    const endpoint = lastCall ? lastCall[0] : '';
    const sessionId = endpoint.includes('=') ? endpoint.split('=')[1] : undefined;
    expect(sessionId).toBeDefined();

    // 2. Post a message using that session ID
    const mockMsgRes: any = {
      status: vi.fn().mockReturnThis(),
      send: vi.fn().mockReturnThis(),
    };
    const mockMsgReq: any = {
      query: { sessionId },
      body: { jsonrpc: "2.0", method: "test", id: 1 }
    };

    await handlers['/messages'](mockMsgReq, mockMsgRes);

    // Check that handlePostMessage was called on the transport
    const results = (SSEServerTransport as any).mock.results;
    const transport = results[results.length - 1].value;
    expect(transport.handlePostMessage).toHaveBeenCalledWith(mockMsgReq, mockMsgRes);

    // 3. Post a message with an invalid session ID
    const invalidMsgRes: any = {
      status: vi.fn().mockReturnThis(),
      send: vi.fn().mockReturnThis(),
    };
    const invalidMsgReq: any = {
      query: { sessionId: 'invalid' }
    };

    await handlers['/messages'](invalidMsgReq, invalidMsgRes);

    expect(invalidMsgRes.status).toHaveBeenCalledWith(400);
    expect(invalidMsgRes.send).toHaveBeenCalledWith('Invalid or expired session ID');
  });

  it('should handle multiple concurrent sessions', async () => {
    installMcpServer(mockApp, mockHnapi);
    await new Promise(resolve => setTimeout(resolve, 50));

    const { SSEServerTransport } = await import("@modelcontextprotocol/sdk/server/sse.js");

    // Session 1
    const res1: any = { writeHead: vi.fn(), end: vi.fn() };
    const req1: any = { on: vi.fn() };
    await handlers['/sse'](req1, res1);
    const sessionId1 = (SSEServerTransport as any).mock.calls[(SSEServerTransport as any).mock.calls.length - 1][0].split('=')[1];

    // Session 2
    const res2: any = { writeHead: vi.fn(), end: vi.fn() };
    const req2: any = { on: vi.fn() };
    await handlers['/sse'](req2, res2);
    const sessionId2 = (SSEServerTransport as any).mock.calls[(SSEServerTransport as any).mock.calls.length - 1][0].split('=')[1];

    expect(sessionId1).not.toBe(sessionId2);

    // Both should work
    const msgRes1: any = { status: vi.fn().mockReturnThis(), send: vi.fn().mockReturnThis() };
    await handlers['/messages']({ query: { sessionId: sessionId1 } }, msgRes1);
    expect(msgRes1.status).not.toHaveBeenCalledWith(400);

    const msgRes2: any = { status: vi.fn().mockReturnThis(), send: vi.fn().mockReturnThis() };
    await handlers['/messages']({ query: { sessionId: sessionId2 } }, msgRes2);
    expect(msgRes2.status).not.toHaveBeenCalledWith(400);
  });
});
