# Universal Data SDK Analysis: HNPWA API

## 1. Executive Summary

This document outlines the architectural transformation of the HNPWA API into a **Universal Data SDK**. The goal is to decouple the core Hacker News logic from specific consumption interfaces (Express API, MCP, AI SDKs) by adopting a strict "Four-Layer Monorepo" pattern. This ensures maximum portability, maintainability, and alignment with Agent Design Principles.

## 2. Architectural North Star: The Four-Layer Monorepo

We will restructure the codebase into a monorepo with the following strict dependency chain:

| Layer | Package | Responsibility | Dependencies |
| --- | --- | --- | --- |
| **Foundation** | `@hnpwa/core` | Pure TypeScript. Logic, fetchers, types, and classes. | **Zero** AI/Server deps. |
| **Gateway** | `@hnpwa/mcp` | The executable Model Context Protocol server. | `@hnpwa/core` + `@modelcontextprotocol/sdk` |
| **Translator** | `@hnpwa/llm` | Pure logic adapters. Maps tools to provider schemas. | `@hnpwa/core` |
| **Framework** | `@hnpwa/ai` | The Framework Kit. Exports tools for Vercel AI SDK. | `@hnpwa/core` + `@hnpwa/llm` |

---

## 3. Layer 1: The Foundation (`@hnpwa/core`)

**Goal:** Extract business logic from `src/api` into a pure TypeScript library.

### Strategy
1.  **Migrate Types:** Move `Story`, `Item`, `User`, and `HackerNewsItem` interfaces to `packages/core/src/types.ts`.
2.  **Extract Logic:** Move `storyFactory`, `itemTransform`, and `apiMap` logic to `packages/core/src/client.ts`.
3.  **Network Abstraction:** The current `firebase` dependency might be heavy. If possible, switch to a lighter HTTP fetcher or keep `firebase` contained strictly within this package, ensuring no leakage to upper layers.
4.  **Zero-Dep Rule:** Ensure `express` and routing logic remain in the legacy app or a separate package, not in `core`.

---

## 4. Layer 2: The Gateway (`@hnpwa/mcp`)

**Goal:** Implement the MCP Server using **Behavior-Based Tools**.

This layer acts as the "Hands" of the agent, providing raw evidence. We apply Agent Design Principles here to ensure tools are deterministic and behavior-oriented.

### Proposed Behavior-Based Tools

#### Tool 1: `read_news_feed`
*   **Behavior:** Simulates scanning the front page or specific sections.
*   **Inputs:** `topic` ("news", "ask", "jobs", etc.), `page` (number).
*   **Output:** List of story summaries.
*   **Implementation:** Wraps `@hnpwa/core`'s feed fetching methods.

#### Tool 2: `read_story_discussion`
*   **Behavior:** Simulates clicking a story to read content and discussion.
*   **Inputs:** `item_id` (number).
*   **Zoom Mechanic:** The `core` returns a full tree. The `mcp` layer must implement a "Zoom" strategy:
    *   *Default:* Return story text + flattened top 10 comments.
    *   *Detail:* Allow requesting specific sub-threads if needed (future expansion).
*   **Output:** Story details + curated comment list.

#### Tool 3: `read_user_profile`
*   **Behavior:** Checking a user's background.
*   **Inputs:** `username`.
*   **Output:** User bio and stats.

### Implementation Detail
This package depends on `@hnpwa/core` for data and `@modelcontextprotocol/server` for the transport. It does **not** contain business logic.

---

## 5. Layers 3 & 4: Translator & Framework (`@hnpwa/llm` & `@hnpwa/ai`)

**Goal:** Enable direct usage in AI applications (Vercel AI SDK).

*   **`@hnpwa/llm`:** Contains pure adapters that convert `@hnpwa/core` types into schemas (e.g., JSON Schema for OpenAI).
*   **`@hnpwa/ai`:** Exports a `createTools()` function compatible with the Vercel AI SDK `generateText` function. This allows developers to use HNPWA tools directly in their Next.js/Node.js AI apps without running a separate MCP server process.

---

## 6. Migration Plan (State Protocol)

We will follow the **State Protocol** defined in `.agent/mcp/state.md`.

### Phase 0: Workspace Scaffolding
*   Initialize npm workspaces.
*   Create directory structure for `packages/{core,mcp,llm,ai}`.

### Phase 1: Core Extraction
*   Move `src/api` code to `packages/core`.
*   Refactor to remove Express dependencies.
*   Verify `import { HnClient } from '@hnpwa/core'` works.

### Phase 2: MCP Server
*   Implement `packages/mcp/src/index.ts`.
*   Map `read_news_feed` -> `HnClient.getStories()`.
*   Verify `npx @hnpwa/mcp` starts the server.

### Phase 3 & 4: AI Integration
*   Build the adapters and framework kit.
