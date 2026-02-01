# Universal Data SDK Analysis: HNPWA API

## 1. Executive Summary

This document outlines the architectural transformation of the HNPWA API into a **Universal Data SDK**. The goal is to decouple the core Hacker News logic from specific consumption interfaces (Express API, MCP, AI SDKs) by adopting a strict "Four-Layer Monorepo" pattern. This ensures maximum portability, maintainability, and alignment with Agent Design Principles.

## 2. Architectural North Star: The Four-Layer Monorepo

We will restructure the codebase into a monorepo with the following strict dependency chain:

| Layer | Package | Responsibility | Dependencies |
| --- | --- | --- | --- |
| **Foundation** | `@hnpwa/core` | Pure TypeScript. Logic, fetchers, types, and classes. | **Zero** AI/Server deps. |
| **Gateway** | `@hnpwa/mcp` | The executable Model Context Protocol server. | `@hnpwa/core` + `@modelcontextprotocol/server` |
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

## 6. Migration Plan & Verification

We will follow the **State Protocol** defined in `.agent/mcp/state.md`. Each phase must pass its specific verification test before proceeding.

### Phase 0: Workspace Scaffolding
*   **Task:** Initialize npm workspaces and create directory structure for `packages/{core,mcp,llm,ai}`.
*   **Verification:**
    ```bash
    # Check directory structure
    ls -F packages/
    # Expected output: ai/ core/ llm/ mcp/

    # Verify workspace config in root package.json
    grep "workspaces" package.json
    ```

### Phase 1: Core Extraction (`@hnpwa/core`)
*   **Task:** Move `src/api` code to `packages/core`. Refactor to remove Express dependencies.
*   **Verification:**
    ```bash
    # 1. Verify clean dependency tree (no express, no zode)
    grep -E "express|zod" packages/core/package.json
    # Expected: (empty)

    # 2. Verify Client Instantiation (Create a test file verify.ts)
    # import { HnClient } from '@hnpwa/core';
    # console.log(new HnClient() ? 'Success' : 'Fail');
    npx tsx verify.ts
    ```

### Phase 2: Gateway Implementation (`@hnpwa/mcp`)
*   **Task:** Implement `packages/mcp/src/index.ts` mapping tools to `HnClient`.
*   **Verification:**
    ```bash
    # 1. Start Server in dry-run mode (if applicable) or check help
    npx @hnpwa/mcp --help

    # 2. Connect with Inspector (Manual)
    # npx @modelcontextprotocol/inspector npx @hnpwa/mcp
    ```

### Phase 3 & 4: AI Integration (`@hnpwa/llm` & `@hnpwa/ai`)
*   **Task:** Build schema adapters and Vercel AI SDK integration.
*   **Verification:**
    ```bash
    # Verify Vercel SDK compatibility
    # Create test-ai.ts:
    # import { createTools } from '@hnpwa/ai';
    # console.log(JSON.stringify(createTools(), null, 2));
    npx tsx test-ai.ts
    # Expected: Output contains valid JSON Schema for tools
    ```

---

## 7. GitHub Actions Continuous Loop Analysis

### Objective

Create a continuous feedback loop where Jules receives the next prompt upon completion of an action.
- **Success Path:** CI passes -> Auto-merge -> New Jules session triggered with `next-prompt.md`.
- **Failure Path:** CI fails -> Report failure -> New Jules session triggered to fix the issue.

### Analysis of `jules-stitch-loop` Pattern

The reference implementation uses a combination of GitHub Actions and TypeScript scripts to manage this lifecycle.

#### Key Components

1.  **`dispatch-jules.ts`**: A script that triggers a new Jules session.
    -   Uses `@google/jules-sdk`.
    -   Constructs the payload for the new session, including the prompt content.

2.  **`ci-report.ts`**: A script that analyzes the CI run.
    -   Determines if the build/tests failed.
    -   Formats a failure report to be fed back into Jules as the "next prompt".

### Proposed Strategy

#### A. The "Next Prompt" Generation

Jules must generate a `next-prompt.md` file *during* its session, before submitting the PR. This file contains the instructions for the *next* logical step in the project's roadmap (e.g., "Phase 1 is done, now start Phase 2").

*   **Location:** `.jules/next-prompt.md` (or root `next-prompt.md`).
*   **Responsibility:** The Agent (Jules) creates this file as part of its final steps.

#### B. The Loop Implementation

**Scenario 1: Success (Merge)**
1.  **Event:** PR merged (closed with `merged: true`).
2.  **Action:** GitHub Action (`jules-loop.yml`) triggers.
3.  **Step:** Read content of `next-prompt.md` from the *merged commit* (main branch).
4.  **Step:** Execute `scripts/dispatch-jules.ts` using `@google/jules-sdk`.
    -   **Input:** Content of `next-prompt.md`.
    -   **Action:** Triggers a new Jules session on a new branch.

**Scenario 2: Failure (CI Check Failed)**
1.  **Event:** Workflow run completed with `conclusion: failure`.
2.  **Action:** GitHub Action (`jules-rescue.yml`) triggers.
3.  **Step:** Execute `scripts/ci-report.ts` to gather error logs.
4.  **Step:** Execute `scripts/dispatch-jules.ts`.
    -   **Input:** "CI Failed. Fix these errors:\n\n" + [Error Logs].
    -   **Action:** Triggers a new Jules session on the *same branch* to fix the code.

### Implementation Details

**Dependencies**
- `@google/jules-sdk`: For programmatic dispatch.
- `tsx`: To run the TypeScript scripts.
- GitHub Secrets: `JULES_API_KEY`.

**Workflow Structure**

```yaml
# .github/workflows/jules-loop.yml
name: 🔄 Jules Loop
on:
  pull_request:
    types: [closed]

jobs:
  dispatch-next:
    if: github.event.pull_request.merged == true
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Dispatch Jules
        run: npx tsx scripts/dispatch-jules.ts --prompt-file next-prompt.md
```

```yaml
# .github/workflows/jules-rescue.yml
name: 🚑 Jules Rescue
on:
  workflow_run:
    workflows: ["Integration Tests"]
    types: [completed]

jobs:
  dispatch-fix:
    if: github.event.workflow_run.conclusion == 'failure'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Report & Dispatch
        run: |
           npx tsx scripts/ci-report.ts > failure-report.md
           npx tsx scripts/dispatch-jules.ts --prompt-file failure-report.md --branch ${{ github.event.workflow_run.head_branch }}
```
