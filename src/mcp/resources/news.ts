import { Api } from '../../api';

/**
 * Register the News resource with the MCP server.
 * Exposes stories (news, newest, ask, show, jobs) via hn://{topic}
 *
 * @param server - The McpServer instance
 * @param hnapi - The Hacker News API instance
 */
export function registerNewsResource(server: any, hnapi: Api) {
  server.resource(
    "news",
    "hn://{topic}",
    async (uri: any, { topic }: any) => {
      const validTopics = ['news', 'newest', 'ask', 'show', 'jobs'];
      if (!validTopics.includes(topic)) {
        throw new Error(`Invalid topic: ${topic}`);
      }

      // uri is a URL object from @modelcontextprotocol/sdk
      const pageStr = uri.searchParams?.get("page") || "1";
      const page = parseInt(pageStr, 10);

      const stories = await (hnapi as any)[topic]({ page });

      return {
        contents: [{
          uri: uri.href,
          text: JSON.stringify(stories, null, 2),
          mimeType: "application/json"
        }]
      };
    }
  );
}
