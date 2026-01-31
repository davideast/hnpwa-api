import { describe, it, expect } from 'vitest';
import { HN_TOOLS } from '../src/index';
import { z } from 'zod';

describe('LLM Tool Schemas', () => {
  it('should validate get_item parameters', () => {
    const valid = { id: 12345 };
    const invalid = { id: "12345" };

    expect(HN_TOOLS.get_item.parameters.safeParse(valid).success).toBe(true);
    expect(HN_TOOLS.get_item.parameters.safeParse(invalid).success).toBe(false);
  });

  it('should validate get_user parameters', () => {
    const valid = { id: "pg" };
    const invalid = { id: 123 };

    expect(HN_TOOLS.get_user.parameters.safeParse(valid).success).toBe(true);
    expect(HN_TOOLS.get_user.parameters.safeParse(invalid).success).toBe(false);
  });

  it('should validate get_stories parameters', () => {
    const valid = { topic: "topstories", page: 1 };
    const invalidTopic = { topic: "invalid", page: 1 };

    expect(HN_TOOLS.get_stories.parameters.safeParse(valid).success).toBe(true);
    expect(HN_TOOLS.get_stories.parameters.safeParse(invalidTopic).success).toBe(false);
  });
});
