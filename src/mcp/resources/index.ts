import { Api } from '../../api';
import { registerUserResource } from './user';

/**
 * Register all MCP resources.
 *
 * @param server - The McpServer instance
 * @param hnapi - The Hacker News API instance
 */
export function registerAllResources(server: any, hnapi: Api) {
  registerUserResource(server, hnapi);
}
