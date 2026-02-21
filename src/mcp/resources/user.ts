import { Api } from '../../api';

/**
 * Register the User resource with the MCP server.
 * Exposes user profiles via hn://user/{id}
 *
 * @param server - The McpServer instance
 * @param hnapi - The Hacker News API instance
 */
export function registerUserResource(server: any, hnapi: Api) {
  server.resource(
    "user",
    "hn://user/{id}",
    async (uri: any, { id }: any) => {
      const user = await hnapi.user(id);
      if (!user) {
        throw new Error(`User ${id} not found`);
      }
      return {
        contents: [{
          uri: uri.href,
          text: JSON.stringify(user, null, 2),
          mimeType: "application/json"
        }]
      };
    }
  );
}
