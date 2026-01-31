# MCP Transition Analysis for HNPWA API

## 1. Executive Summary

This document analyzes the path to converting the existing HNPWA (Hacker News Progressive Web App) API into a Model Context Protocol (MCP) server. The goal is to move beyond simple CRUD/data domain tools and design "behavior-based" tools that align with Agent Design Principles. This approach empowers AI agents to interact with Hacker News data more effectively, mimicking human workflows rather than database queries.

## 2. Current Architecture Analysis

The current API (`src/api/index.ts`) provides a set of optimized endpoints that aggregate data from the official Hacker News Firebase API. It is designed primarily for UI consumption, focusing on reducing network requests and payload size.

### Key Existing Capabilities (Schema-Based)
*   **Feeds:** `news`, `newest`, `ask`, `show`, `jobs` (Returns `Story[]`).
*   **Items:** `item(id)` (Returns `Item` with recursive `comments` tree).
*   **Users:** `user(id)` (Returns `User` profile).

These functions are currently mapped to Express.js routes (`src/server.ts`) like `/news.json` and `/item/:id.json`.

## 3. Agent Design Principles Application

To build a robust MCP server, we must apply the following principles:

### A. Tools vs. Skills
*   **Principle:** Tools provide evidence (raw data/facts); Skills provide expertise (decisions/logic).
*   **Application:** Our tools should strictly fetch HN data without attempting to summarize sentiment or decide if a story is "interesting." That is the job of the Agent's "Skill" (the prompt/model).

### B. Deterministic Verbs
*   **Principle:** Use mechanical verbs for tools (`read`, `get`) rather than cognitive verbs (`analyze`, `check`).
*   **Application:**
    *   *Bad:* `check_top_stories`, `analyze_comments`.
    *   *Good:* `read_news_feed`, `read_story_discussion`.

### C. Map Behaviors, Not Schemas
*   **Principle:** Tool names should reflect *User Behavior* rather than internal data structures.
*   **Application:**
    *   *Schema-based (Current):* `get_item`, `get_user`, `get_stories`.
    *   *Behavior-based (Proposed):* `read_news_feed` (scanning headlines), `read_story_discussion` (reading content & comments), `read_user_profile` (checking background).

### D. Zoom Mechanics
*   **Principle:** Handle scale by offering summaries ("Zoom Out") and details ("Zoom In") to manage context window limits.
*   **Application:** The `item(id)` function currently returns a potentially massive recursive comment tree. An agent-friendly tool must handle this by either truncating deep comments or providing a way to fetch specific branches.

## 4. Proposed Behavior-Based Tools

Based on the analysis, we propose the following set of MCP tools.

### Tool 1: `read_news_feed`
**Behavior:** Simulates a user visiting a specific page of Hacker News (e.g., Front Page, New, Ask HN) to scan for interesting content.
*   **Inputs:**
    *   `topic` (string, enum): `news` (default), `newest`, `ask`, `show`, `jobs`.
    *   `page` (number, optional): Page number (1-10).
*   **Output:** A list of story summaries (Title, ID, Score, Author, TimeAgo).
*   **Why Behavior-Based?** It matches the workflow of "checking the news" rather than "querying the story database."

### Tool 2: `read_story_discussion`
**Behavior:** Simulates a user clicking on a story to read the content and the discussion surrounding it.
*   **Inputs:**
    *   `item_id` (number): The ID of the story or item.
*   **Output:** The story details (Title, Text/URL) and a *flattened* or *truncated* list of top-level comments.
*   **Zoom Mechanic:**
    *   *Problem:* The current `itemMap` returns a deeply nested tree.
    *   *Solution:* The tool should format the output to be token-efficient. It might return the story text + top 10 root comments, with a note that "X more comments exist" to prompt further specific queries if needed.

### Tool 3: `read_user_profile`
**Behavior:** Simulates a user clicking on a username to see their bio and stats.
*   **Inputs:**
    *   `username` (string): The user's handle.
*   **Output:** User bio, creation date, karma.
*   **Why Behavior-Based?** Matches the intent of "vetting" a source or learning about a community member.

## 5. Technical Implementation Strategy

### Step 1: Install MCP SDK
Add `@modelcontextprotocol/server` and `zod` to the dependencies.

### Step 2: Create MCP Server Entrypoint
Create a new file `src/mcp/server.ts` that initializes the `McpServer`.

### Step 3: Implement Tool Wrappers
Wrap the existing `hnapi` functions into MCP Tools.

**Example `read_news_feed` Implementation:**
```typescript
server.tool(
  "read_news_feed",
  "Read the latest headlines from Hacker News to see what is happening.",
  {
    topic: z.enum(["news", "newest", "ask", "show", "jobs"]).default("news"),
    page: z.number().min(1).max(10).default(1)
  },
  async ({ topic, page }) => {
    // Reuse existing logic from src/api/index.ts
    const stories = await hnapi[topic]({ page });
    return {
      content: [{
        type: "text",
        text: JSON.stringify(stories, null, 2)
      }]
    };
  }
);
```

### Step 4: Express Integration
Mount the MCP server onto the existing Express app using the MCP Express adapter (or SSE transport) to allow it to run alongside the existing JSON API.

## 6. Conclusion

By adopting these behavior-based tools, the HNPWA API will evolve from a passive data source into an active participant in an Agent's workflow. The shift from `getItem` to `read_story_discussion` is subtle in code but profound in how it guides the LLM to interact with the system effectively and deterministically.
