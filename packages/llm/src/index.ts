import { z } from "zod";

export const HN_TOOLS = {
  get_item: {
    description: "Get an item (story, comment, etc) from Hacker News",
    parameters: z.object({
      id: z.number().describe("The ID of the item"),
    }),
  },
  get_user: {
    description: "Get a user from Hacker News",
    parameters: z.object({
      id: z.string().describe("The user ID"),
    }),
  },
  get_stories: {
    description: "Get stories from Hacker News",
    parameters: z.object({
      topic: z.enum(["topstories", "newstories", "beststories", "askstories", "showstories", "jobstories"]).describe("The topic of stories"),
      page: z.number().optional().describe("The page number (defaults to 1)"),
    }),
  },
};
