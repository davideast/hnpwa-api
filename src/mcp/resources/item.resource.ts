import { Api } from '../../api/index';
import { McpResource } from '../resource';

export const itemResource: McpResource = {
  register(server: any, hnapi: Api) {
    server.resource(
      "item",
      "hn://item/{id}",
      async (uri: any, { id }: any) => {
        const itemId = parseInt(id, 10);
        const item = await hnapi.item(itemId);
        if (!item) {
          throw new Error(`Item ${id} not found`);
        }
        return {
          contents: [{
            uri: uri.href,
            text: JSON.stringify(item, null, 2),
            mimeType: "application/json"
          }]
        };
      }
    );
  }
};
