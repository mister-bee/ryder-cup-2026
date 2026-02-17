---

description: "Task list for MCP Graphics & Icons Server"
---

# Tasks: MCP Graphics & Icons Server

**Input**: Design documents from `/specs/001-mcp-graphics-server/`
**Prerequisites**: plan.md (required), spec.md (required), research.md, data-model.md, contracts/

**Tests**: Not explicitly requested in spec. Manual testing via MCP Inspector.

**Organization**: Tasks grouped by user story (US1: generate_icon, US2: templates, US3: batch).

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2, US3)
- All paths relative to repository root

## Path Conventions

- MCP server source: `mcp-server/src/`
- MCP server build output: `mcp-server/build/`
- Generated images output: `public/generated/`
- MCP config: `.mcp.json` (project root)

---

## Phase 1: Setup

**Purpose**: Initialize the MCP server project structure and dependencies

- [x] T001 Create `mcp-server/` directory with `package.json` — set `"name": "ryder-cup-graphics-mcp"`, `"type": "module"`, `"bin"` pointing to `./build/index.js`, scripts for `build` (tsc) and `dev` (tsc --watch), dependencies: `@modelcontextprotocol/sdk`, `@google/genai`, `zod`; devDependencies: `@types/node`, `typescript`
- [x] T002 Create `mcp-server/tsconfig.json` — target ES2022, module Node16, moduleResolution Node16, outDir `./build`, rootDir `./src`, strict true, esModuleInterop true
- [x] T003 [P] Create `public/generated/.gitkeep` and add `public/generated/*.png` to `.gitignore`
- [x] T004 [P] Create `.mcp.json` at project root — server name `ryder-cup-graphics`, type stdio, command `node`, args `["./mcp-server/build/index.js"]`, env `{ "GEMINI_API_KEY": "${GEMINI_API_KEY}" }`
- [x] T005 Run `npm install` in `mcp-server/` to install all dependencies

**Checkpoint**: Project structure exists, dependencies installed, TypeScript compiles empty project.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core modules that ALL tools depend on — Gemini client, utilities, and MCP server entry point

- [x] T006 Implement `mcp-server/src/utils.ts` — export functions: `generateFilename(prefix: string): string` (timestamp + random ID), `saveImage(buffer: Buffer, outputDir: string, prefix: string): Promise<{filePath: string, sizeBytes: number}>` (write PNG to disk, return absolute path and size), `resolveOutputDir(outputDir?: string): string` (default to `{projectRoot}/public/generated/`, validate directory exists and is writable), `validatePrompt(prompt: string): void` (non-empty, <= 2000 chars, throw on invalid), `validateAspectRatio(ratio: string): void` (validate against 10 allowed values), `validateSize(size: string): void` (validate against `"1K"`, `"2K"`, `"4K"`)
- [x] T007 Implement `mcp-server/src/gemini.ts` — export function `generateImage(prompt: string, options: {aspectRatio?: string, size?: string}): Promise<Buffer>` that: reads `GEMINI_API_KEY` from `process.env`, creates `GoogleGenAI` client from `@google/genai`, calls `ai.models.generateContent()` with model `gemini-2.5-flash-image`, config `responseModalities: ['TEXT', 'IMAGE']` and `imageConfig` from options, extracts base64 PNG from `part.inlineData.data`, returns as Buffer. Include 60-second timeout. Throw descriptive errors for missing API key, API failures, and timeouts.
- [x] T008 Implement `mcp-server/src/index.ts` — create `McpServer` with name `ryder-cup-graphics` and version `1.0.0`, import and call tool registration function from `tools.ts` (to be created in Phase 3), create `StdioServerTransport`, connect server to transport. Use `console.error()` for all logging (never `console.log`). Add top-level error handler for uncaught exceptions.

**Checkpoint**: Foundation ready. `gemini.ts` can generate images, `utils.ts` can save them, `index.ts` starts the MCP server. No tools registered yet.

---

## Phase 3: User Story 1 — Generate a Team Logo or Icon (Priority: P1)

**Goal**: A user can describe an image in natural language and receive a generated PNG file saved to disk.

**Independent Test**: Call `generate_icon` via MCP Inspector with a text prompt; verify a PNG file appears in `public/generated/` and the response includes the file path.

### Implementation for User Story 1

- [x] T009 [US1] Create `mcp-server/src/tools.ts` with a `registerTools(server: McpServer)` export function. Register the `generate_icon` tool with Zod input schema: `prompt` (z.string(), required), `aspectRatio` (z.string().optional(), default `"1:1"`), `size` (z.string().optional(), default `"1K"`), `outputDir` (z.string().optional()). Handler must: validate inputs using `utils.ts` validators, call `gemini.generateImage()`, save result via `utils.saveImage()`, return MCP response with `content` text and `structuredContent` containing `filePath`, `format`, `sizeBytes` per contracts/mcp-tools.md.
- [x] T010 [US1] Add error handling to `generate_icon` in `mcp-server/src/tools.ts` — wrap handler in try/catch, return `isError: true` responses for: missing/empty prompt, invalid aspectRatio, invalid size, Gemini API errors, timeout errors, filesystem write errors. Match error response format from contracts/mcp-tools.md. No unhandled exceptions.
- [x] T011 [US1] Build the server (`npm run build` in `mcp-server/`) and verify via MCP Inspector (`npx @modelcontextprotocol/inspector node mcp-server/build/index.js`) that `generate_icon` tool appears, accepts a prompt, and returns a PNG file path.

**Checkpoint**: US1 complete. `generate_icon` works end-to-end. This is the MVP.

---

## Phase 4: User Story 2 — Generate Styled Graphics with Templates (Priority: P2)

**Goal**: A user can select from predefined Ryder Cup templates, provide custom parameters, and get a branded graphic.

**Independent Test**: Call `list_templates` to see available templates; call `generate_from_template` with `team-badge` template and parameters `{teamName: "Mergen", primaryColor: "navy blue"}`; verify output image is generated.

### Implementation for User Story 2

- [x] T012 [P] [US2] Create `mcp-server/src/templates.ts` — define `Template` type with fields: `name`, `description`, `promptTemplate`, `requiredParams`, `defaults`, `defaultAspectRatio`, `defaultSize` per data-model.md. Export `TEMPLATES` array with 5 templates: `team-badge` (1:1, params: teamName, primaryColor, accentColor optional), `session-banner` (16:9, params: sessionName, teamAName, teamBName, backgroundColor optional), `score-icon` (1:1, params: score, teamColor), `leaderboard-header` (16:9, params: eventName, teamAName, teamBName), `player-avatar` (1:1, params: playerName, teamColor). Export `getTemplate(name: string): Template | undefined` and `buildPrompt(template: Template, params: Record<string, string>): string` (substitute `{param}` placeholders, apply defaults, validate required params present).
- [x] T013 [US2] Register `list_templates` tool in `mcp-server/src/tools.ts` — no input parameters. Handler returns `content` text listing all template names with descriptions, and `structuredContent` with full template metadata (name, description, requiredParams, optionalParams, defaults) per contracts/mcp-tools.md.
- [x] T014 [US2] Register `generate_from_template` tool in `mcp-server/src/tools.ts` — Zod input schema: `template` (z.string(), required), `params` (z.record(z.string()), required), `aspectRatio` (z.string().optional()), `size` (z.string().optional()), `outputDir` (z.string().optional()). Handler must: look up template by name (error if not found), validate required params present (error with specific missing param name), build prompt via `buildPrompt()`, use template defaults for aspectRatio/size unless overridden, call `gemini.generateImage()`, save and return result. Match error formats from contracts/mcp-tools.md.
- [x] T015 [US2] Rebuild server and verify via MCP Inspector: `list_templates` returns 5 templates, `generate_from_template` with `team-badge` and valid params produces a PNG, invalid template name returns error, missing required param returns error naming the param.

**Checkpoint**: US2 complete. Templates work. All 5 Ryder Cup templates available.

---

## Phase 5: User Story 3 — Batch Generate Multiple Icon Sizes (Priority: P3)

**Goal**: A user can generate the same icon in multiple sizes with a single request.

**Independent Test**: Call `generate_icon_batch` with a prompt and sizes `["1K", "2K"]`; verify 2 PNG files are generated with the correct size labels in filenames.

### Implementation for User Story 3

- [x] T016 [US3] Register `generate_icon_batch` tool in `mcp-server/src/tools.ts` — Zod input schema: `prompt` (z.string(), required), `sizes` (z.array(z.string()).min(1), required), `aspectRatio` (z.string().optional(), default `"1:1"`), `outputDir` (z.string().optional()). Handler must: validate prompt and each size individually, call `gemini.generateImage()` sequentially for each valid size, collect results and errors separately, save each image with size label in filename prefix (e.g., `batch-1K-...`), return `structuredContent` with `results` array and `errors` array per contracts/mcp-tools.md. Continue processing remaining sizes if one fails (partial failure support).
- [x] T017 [US3] Rebuild server and verify via MCP Inspector: batch with 2 valid sizes produces 2 files, batch with 1 invalid size produces partial results with error for the invalid size, empty sizes array returns validation error.

**Checkpoint**: US3 complete. All 4 tools operational.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Final verification and cleanup

- [x] T018 [P] Add `#!/usr/bin/env node` shebang to top of `mcp-server/src/index.ts` and ensure `chmod 755` is part of the build script in `mcp-server/package.json`
- [x] T019 [P] Verify `.env` contains `GEMINI_API_KEY` and `.mcp.json` uses `${GEMINI_API_KEY}` expansion — confirm the server reads the key correctly when launched via Claude Code
- [x] T020 Run full quickstart.md validation checklist: build succeeds, `/mcp` shows server connected, `generate_icon` works, `list_templates` returns 5 templates, `generate_from_template` works, error cases return clear messages
- [x] T021 Review all error paths across all 4 tools — verify no unhandled exceptions can crash the server (Gemini API down, invalid JSON, filesystem permissions, missing env var)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately
- **Foundational (Phase 2)**: Depends on Phase 1 completion (T005 npm install) — BLOCKS all user stories
- **US1 (Phase 3)**: Depends on Phase 2 (gemini.ts, utils.ts, index.ts)
- **US2 (Phase 4)**: Depends on Phase 2 only — can run in parallel with US1 (different files)
  - T012 (templates.ts) has no dependency on US1 tools
  - T013/T014 add tools to tools.ts alongside generate_icon
- **US3 (Phase 5)**: Depends on Phase 2 only — can run in parallel with US1/US2
  - T016 adds to tools.ts alongside existing tools
- **Polish (Phase 6)**: Depends on all user stories being complete

### Within Each Phase

- Phase 1: T001 → T002 → T005 (sequential: package.json before tsconfig before install). T003, T004 parallel with T001/T002.
- Phase 2: T006, T007 can run in parallel (different files). T008 depends on both.
- Phase 3: T009 → T010 → T011 (sequential: tool first, then error handling, then verify)
- Phase 4: T012 parallel with T013. T014 depends on T012. T015 depends on all.
- Phase 5: T016 → T017 (sequential)
- Phase 6: T018, T019 parallel. T020 → T021 sequential after.

### Parallel Opportunities

```
Phase 1:  T001 ──→ T002 ──→ T005
          T003 ─┘  T004 ─┘

Phase 2:  T006 ──┐
          T007 ──┼──→ T008
                 │
Phase 3:  T009 ──→ T010 ──→ T011

Phase 4:  T012 ──┐
          T013 ──┼──→ T014 ──→ T015

Phase 5:  T016 ──→ T017

Phase 6:  T018 ──┐
          T019 ──┼──→ T020 ──→ T021
```

Note: Phases 3, 4, and 5 can all start once Phase 2 completes.
T012 (templates.ts) is in a separate file from T009 (tools.ts)
but T013/T014 add to tools.ts, so they should run after T009.

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (T001–T005)
2. Complete Phase 2: Foundational (T006–T008)
3. Complete Phase 3: User Story 1 (T009–T011)
4. **STOP and VALIDATE**: `generate_icon` works via MCP Inspector
5. Connect to Claude Code via `.mcp.json` and test interactively

### Incremental Delivery

1. Setup + Foundational → MCP server starts, no tools yet
2. Add US1 → `generate_icon` works (MVP!)
3. Add US2 → Templates available, branded graphics
4. Add US3 → Batch generation for multi-size icons
5. Polish → Production-ready error handling, verified quickstart

---

## Notes

- All source files are in `mcp-server/src/` (5 files total)
- Never use `console.log()` in MCP server code — stdout is JSON-RPC
- Gemini API key must have billing enabled for image generation
- Generated images go to `public/generated/` by default
- Each tool must catch all errors and return MCP error responses
