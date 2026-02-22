# Merge Conflict Prevention and Codebase Improvement Analysis

## Goal
The goal of this analysis is to identify strategies to reduce merge conflicts and improve typed specifications, enabling parallel development by remote-based agents with minimal friction. This involves avoiding code generation where possible, deprecating barrel files, and breaking monolithic code into smaller, single-responsibility files without compromising security or performance.

## Current State Analysis

### 1. Barrel Files with Logic
**File:** `src/api/index.ts`
- **Issue:** This file acts as a barrel file (re-exporting from other modules) but also contains significant business logic, including factory functions (`storyFactory`, `topicEndpointFactory`), type definitions (`ApiOptions`, `Api`), and the main `api` implementation.
- **Impact:** Any change to the core API structure, types, or factory logic requires modifying this single file. This increases the likelihood of merge conflicts when multiple agents work on different features that touch the API surface. It also creates circular dependencies (see below).

### 2. Mixed Responsibilities in Interfaces
**File:** `src/api/interfaces.ts`
- **Issue:** This file defines TypeScript interfaces (`HackerNewsItem`, `Story`, `Item`) but also includes data transformation logic (`story`, `cleanText`, `itemTransform`, `recurseCommentTree`).
- **Impact:** Agents modifying data models will conflict with agents modifying data transformation logic. Tying logic to interface definitions makes the code harder to test in isolation and increases the "blast radius" of changes.

### 3. Monolithic Server Entry Point
**File:** `src/server.ts`
- **Issue:** This file handles multiple distinct responsibilities:
  - Express server configuration and middleware setup.
  - Caching logic (`SimpleLRU` instances).
  - API route implementation (`getNewsAndStuff`, `getItemAndComments`).
  - Firebase initialization.
- **Impact:** As the primary entry point, it becomes a bottleneck. Adding new routes, changing caching strategies, or updating middleware all require editing this same file, leading to high contention.

### 4. Circular Dependencies
**Files:** `src/api/item.ts` <-> `src/api/index.ts`
- **Issue:** `src/api/item.ts` imports types from `../api` (which resolves to `src/api/index.ts`). `src/api/index.ts` imports `getItemAndComments` from `./item`.
- **Impact:** Circular dependencies confuse static analysis tools and can lead to runtime errors or complex initialization orders. They also make it harder for agents to trace the dependency graph, leading to incorrect assumptions about code structure.

### 5. Weak Type Specifications
**Files:** `tsconfig.json`, `src/server.ts`, `src/api/index.ts`
- **Issue:**
  - `tsconfig.json` does not have `strict: true` enabled (only `noImplicitAny` and `strictNullChecks`).
  - `src/server.ts` uses `any` for Express request and response objects (`req: any`, `res: any`).
  - `src/api/index.ts` uses `[key: string]: any` in the `Api` interface.
- **Impact:** Weak typing forces agents to rely on implementation details rather than contracts. This increases the risk of introducing bugs when refactoring and makes it harder for agents to verify their changes without running the entire test suite.

## Action Items

### 1. Dismantle the Barrel File (`src/api/index.ts`)
- **Action:** Move the logic out of `src/api/index.ts`.
  - Extract factory functions to `src/api/factories.ts`.
  - Extract the `Api` and `ApiOptions` types to `src/api/types.ts`.
  - Extract the main `api` creator to `src/api/client.ts` (or similar).
- **Goal:** `src/api/index.ts` should either be removed (preferred, forcing direct imports) or become a pure re-export file with no logic.

### 2. Separate Types from Logic (`src/api/interfaces.ts`)
- **Status:** Completed (2026-02-22)
- **Action:** Split `src/api/interfaces.ts` into two files:
  - `src/api/types.ts` (or keep `interfaces.ts` strictly for interfaces): Contains only `interface` and `type` definitions.
  - `src/api/transforms.ts`: Contains `story`, `cleanText`, `itemTransform`, and `recurseCommentTree` functions.
- **Goal:** Allow type definitions to evolve independently of the logic that processes them.

### 3. Modularize Server Handlers (`src/server.ts`)
- **Action:** Extract route handlers into a dedicated directory `src/handlers/`.
  - Create `src/handlers/news.ts` for `getNewsAndStuff`.
  - Create `src/handlers/item.ts` for `getItemAndComments`.
  - Create `src/handlers/user.ts` for `getUserInfo`.
- **Goal:** `src/server.ts` should only be responsible for wiring up the server, middleware, and routes, not implementing the business logic for each route.

### 4. Resolve Circular Dependencies
- **Status:** Completed (2026-02-22)
- **Action:** Update imports in `src/api/item.ts` (and others) to import types directly from `src/api/interfaces.ts` (or the new `types.ts`) instead of importing from the barrel file `src/api/index.ts`.
- **Goal:** Eliminate dependency cycles to improve code stability and analysis.

### 5. Strengthen Type Safety
- **Action:**
  - Enable `strict: true` in `tsconfig.json` to catch more potential issues.
  - Replace `any` in `src/server.ts` with proper Express types (`Request`, `Response` from `express`).
  - Refine the `Api` interface to remove the index signature `[key: string]: any` if possible, or define strictly typed methods.
- **Goal:** Provide clear, enforceable contracts for agents to work against, reducing the likelihood of type-related bugs and regression.
