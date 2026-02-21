import { Express } from 'express';
import { Api } from '../api';
import { registerAllResources } from './resources';

/**
 * Install the MCP server into the Express app.
 *
 * @param app - The Express application instance
 * @param hnapi - The Hacker News API instance
 */
export function installMcpServer(app: Express, hnapi: Api) {
  // Use a promise to track initialization
  const initPromise = (async () => {
    try {
      const { McpServer } = await import("@modelcontextprotocol/sdk/server/mcp.js");
      const { SSEServerTransport } = await import("@modelcontextprotocol/sdk/server/sse.js");

      const server = new McpServer({
        name: "hnpwa",
        version: "1.0.0"
      });

      registerAllResources(server, hnapi);

      return { server, SSEServerTransport };
    } catch (e) {
      console.warn("MCP SDK not found or failed to initialize:", e);
      return null;
    }
  })();

  // Map to store active transports by session ID to handle concurrency
  const transports = new Map<string, any>();

  app.get("/sse", async (req, res) => {
    const init = await initPromise;
    if (!init) {
      return res.status(500).send("MCP Server not initialized");
    }

    const { server, SSEServerTransport } = init;

    // Create a unique session ID for this connection
    const sessionId = Math.random().toString(36).substring(2);

    const transport = new SSEServerTransport(`/messages?sessionId=${sessionId}`, res);
    transports.set(sessionId, transport);

    req.on("close", () => {
      transports.delete(sessionId);
    });

    await server.connect(transport);
  });

  app.post("/messages", async (req, res) => {
    const init = await initPromise;
    if (!init) {
      return res.status(500).send("MCP Server not initialized");
    }

    const sessionId = req.query.sessionId as string;
    const transport = transports.get(sessionId);

    if (transport) {
      await transport.handlePostMessage(req, res);
    } else {
      res.status(400).send("Invalid or expired session ID");
    }
  });
}
