import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { HnClient } from "@hnpwa/core";
import { z } from "zod";

const server = new Server(
  {
    name: "hnpwa-mcp",
    version: "0.1.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

const client = new HnClient();

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
    },
    {
        name: "get_user",
        description: "Get a user from Hacker News",
        inputSchema: {
            type: "object",
            properties: {
                id: { type: "string" }
            },
            required: ["id"]
        }
    },
    {
        name: "get_stories",
        description: "Get stories from Hacker News",
        inputSchema: {
            type: "object",
            properties: {
                topic: { type: "string", description: "topstories, newstories, etc" },
                page: { type: "number", description: "Page number" }
            },
            required: ["topic"]
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

  if (request.params.name === "get_user") {
    const id = (request.params.arguments as any).id;
    const user = await client.getUser(id);
    if (!user) {
        return {
            content: [{ type: "text", text: "User not found" }],
            isError: true
        };
    }
    return {
        content: [{ type: "text", text: JSON.stringify(user, null, 2) }]
    }
  }

  if (request.params.name === "get_stories") {
    const topic = (request.params.arguments as any).topic;
    const page = (request.params.arguments as any).page;
    const stories = await client.getStories(topic, page || 1);
    return {
        content: [{ type: "text", text: JSON.stringify(stories, null, 2) }]
    }
  }

  throw new Error("Tool not found");
});

async function run() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

run().catch((error) => {
  console.error("Server error:", error);
  process.exit(1);
});
