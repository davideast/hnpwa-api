import { Api } from '../../api/index.ts';
import { McpResource } from '../resource';

export const userResource: McpResource = {
  register(server: any, hnapi: Api) {
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
};
