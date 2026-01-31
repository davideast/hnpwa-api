import { tool } from "ai";
import { HnClient } from "@hnpwa/core";
import { HN_TOOLS } from "@hnpwa/llm";

export function createTools(client: HnClient = new HnClient()) {
  return {
    get_item: tool({
      description: HN_TOOLS.get_item.description,
      parameters: HN_TOOLS.get_item.parameters,
      execute: async ({ id }) => {
        const item = await client.getItem(id);
        if (!item) return "Item not found";
        return JSON.stringify(item, null, 2);
      },
    }),
    get_user: tool({
      description: HN_TOOLS.get_user.description,
      parameters: HN_TOOLS.get_user.parameters,
      execute: async ({ id }) => {
        const user = await client.getUser(id);
        if (!user) return "User not found";
        return JSON.stringify(user, null, 2);
      },
    }),
    get_stories: tool({
      description: HN_TOOLS.get_stories.description,
      parameters: HN_TOOLS.get_stories.parameters,
      execute: async ({ topic, page }) => {
        const stories = await client.getStories(topic, page || 1);
        return JSON.stringify(stories, null, 2);
      },
    }),
  };
}
