import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "./in-memory-transport.js";
import { HnClient } from "@hnpwa/core";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";

// Setup server function
function createServer() {
    const server = new Server(
      {
        name: "hnpwa-mcp-test",
        version: "0.1.0",
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    const client = new HnClient();

    // Tools definition
    const tools = [
        {
            name: "get_item",
            description: "Get an item (story, comment, etc) from Hacker News",
            inputSchema: {
                type: "object",
                properties: {
                    id: { type: "number" }
                },
                required: ["id"]
            }
        }
    ];

    server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: tools,
      };
    });

    server.setRequestHandler(CallToolRequestSchema, async (request) => {
      if (request.params.name === "get_item") {
        const id = (request.params.arguments as any).id;
        const item = await client.getItem(id);
        if (!item) {
            return {
                content: [{ type: "text", text: "Item not found" }],
                isError: true,
            };
        }
        return {
            content: [{ type: "text", text: JSON.stringify(item, null, 2) }],
        };
      }
      throw new Error("Tool not found");
    });

    return server;
}

// Mock fetch globally
const fetchMock = vi.fn();
global.fetch = fetchMock;

describe('MCP Server Loopback', () => {
    let server: Server;
    let client: Client;
    let serverTransport: InMemoryTransport;
    let clientTransport: InMemoryTransport;

    beforeEach(async () => {
        [serverTransport, clientTransport] = InMemoryTransport.createLinkedPair();
        server = createServer();
        await server.connect(serverTransport);

        client = new Client({ name: "test-client", version: "1.0.0" }, { capabilities: {} });
        await client.connect(clientTransport);
    });

    afterEach(async () => {
        await client.close();
        await server.close();
        vi.clearAllMocks();
    });

    it('should list tools', async () => {
        const tools = await client.listTools();
        expect(tools.tools).toBeDefined();
        const toolNames = tools.tools.map(t => t.name);
        expect(toolNames).toContain('get_item');
    });

    it('should call get_item tool', async () => {
        const mockItem = {
            id: 123,
            type: 'story',
            title: 'Test Story',
            by: 'tester',
            time: 1234567890,
            score: 10,
            descendants: 0,
        };

        // HnClient uses fetch. We need to mock the response for HnClient.fetchItem
        fetchMock.mockResolvedValueOnce({
            ok: true,
            json: async () => mockItem
        });

        const result = await client.callTool({
            name: "get_item",
            arguments: { id: 123 }
        });

        expect(result.content).toBeDefined();
        expect(result.content[0].type).toBe('text');
        const content = JSON.parse(result.content[0].text as string);
        expect(content.title).toBe('Test Story');
    });
});
