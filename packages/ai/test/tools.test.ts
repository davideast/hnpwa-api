import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createTools } from '../src/index';
import { HnClient } from "@hnpwa/core";

// Mock HnClient
const mockGetItem = vi.fn();
const mockGetUser = vi.fn();
const mockGetStories = vi.fn();

vi.mock("@hnpwa/core", () => {
    return {
        HnClient: vi.fn().mockImplementation(() => {
            return {
                getItem: mockGetItem,
                getUser: mockGetUser,
                getStories: mockGetStories
            }
        })
    }
});

describe('AI Framework Tools', () => {
  let tools: ReturnType<typeof createTools>;
  let client: HnClient;

  beforeEach(() => {
      vi.clearAllMocks();
      // Reset mocks
      mockGetItem.mockResolvedValue({ id: 1, title: 'test' });

      client = new HnClient();
      tools = createTools(client);
  });

  it('should define tools with correct descriptions', () => {
    expect(tools.get_item.description).toBeDefined();
    expect(tools.get_user.description).toBeDefined();
    expect(tools.get_stories.description).toBeDefined();
  });

  it('should execute get_item', async () => {
      const result = await tools.get_item.execute({ id: 123 }, { toolCallId: '1', messages: [] });
      expect(mockGetItem).toHaveBeenCalledWith(123);
      expect(JSON.parse(result)).toEqual({ id: 1, title: 'test' });
  });
});
