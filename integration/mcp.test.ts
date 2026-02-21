import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import { installMcpServer } from '../src/mcp/server';

// Mock the MCP SDK since it might not be installed in the environment
vi.mock("@modelcontextprotocol/sdk/server/mcp.js", () => {
  return {
    McpServer: vi.fn().mockImplementation(() => ({
      resource: vi.fn(),
      connect: vi.fn().mockResolvedValue(undefined),
    })),
  };
});

vi.mock("@modelcontextprotocol/sdk/server/sse.js", () => {
  return {
    SSEServerTransport: vi.fn().mockImplementation((endpoint, res) => ({
      handlePostMessage: vi.fn().mockResolvedValue(undefined),
    })),
  };
});

describe('MCP Integration', () => {
  let app: any;
  let mockHnapi: any;

  beforeEach(() => {
    app = express();
    mockHnapi = {
      user: vi.fn(),
    };
  });

  it('should register MCP endpoints and handle sessions', async () => {
    installMcpServer(app, mockHnapi);

    // 1. Connect via SSE to get a session
    const sseResponse = await request(app).get('/sse');
    expect(sseResponse.status).toBe(200);

    // The endpoint should include a sessionId
    // In our implementation, we don't return it in the body but it's in the SSEServerTransport constructor
    // Since we are mocking, we can't easily see the sessionId unless we spy on the constructor
    const { SSEServerTransport } = await import("@modelcontextprotocol/sdk/server/sse.js");
    const lastCall = (SSEServerTransport as any).mock.calls[(SSEServerTransport as any).mock.calls.length - 1];
    const endpoint = lastCall[0];
    const sessionId = endpoint.split('=')[1];
    expect(sessionId).toBeDefined();

    // 2. Post a message using that session ID
    const msgResponse = await request(app)
      .post(`/messages?sessionId=${sessionId}`)
      .send({ jsonrpc: "2.0", method: "test", id: 1 });

    expect(msgResponse.status).toBe(200);

    // 3. Post a message with an invalid session ID
    const invalidMsgResponse = await request(app)
      .post('/messages?sessionId=invalid')
      .send({ jsonrpc: "2.0", method: "test", id: 1 });

    expect(invalidMsgResponse.status).toBe(400);
    expect(invalidMsgResponse.text).toBe('Invalid or expired session ID');
  });

  it('should handle multiple concurrent sessions', async () => {
    installMcpServer(app, mockHnapi);

    // Client 1
    await request(app).get('/sse');
    const { SSEServerTransport } = await import("@modelcontextprotocol/sdk/server/sse.js");
    const sessionId1 = (SSEServerTransport as any).mock.calls[(SSEServerTransport as any).mock.calls.length - 1][0].split('=')[1];

    // Client 2
    await request(app).get('/sse');
    const sessionId2 = (SSEServerTransport as any).mock.calls[(SSEServerTransport as any).mock.calls.length - 1][0].split('=')[1];

    expect(sessionId1).not.toBe(sessionId2);

    // Both should be valid
    expect((await request(app).post(`/messages?sessionId=${sessionId1}`)).status).toBe(200);
    expect((await request(app).post(`/messages?sessionId=${sessionId2}`)).status).toBe(200);
  });
});
