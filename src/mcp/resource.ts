import { Api } from '../api';

export interface McpResource {
  register(server: any, api: Api): void;
}
