import { Api } from '../../api/types';
import { McpResource } from '../resource';

export const newsResource: McpResource = {
  register(server: any, hnapi: Api) {
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

        const stories = await hnapi[topic]({ page });

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
};
