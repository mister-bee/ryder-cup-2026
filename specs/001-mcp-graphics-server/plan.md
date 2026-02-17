# Implementation Plan: MCP Graphics & Icons Server

**Branch**: `001-mcp-graphics-server` | **Date**: 2026-02-16 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-mcp-graphics-server/spec.md`

## Summary

Build a custom MCP server that generates graphics and icons for
the Ryder Cup 2026 app using Google Gemini's Nano Banana image
generation API (`gemini-2.5-flash-image`). The server exposes four
tools — `generate_icon`, `list_templates`, `generate_from_template`,
and `generate_icon_batch` — via stdio transport. It includes 5
Ryder Cup-specific prompt templates for consistent branding. Images
are saved to `public/generated/` as PNG files.

## Technical Context

**Language/Version**: TypeScript 5.x, Node.js >= 18
**Primary Dependencies**: `@modelcontextprotocol/sdk`, `@google/genai`, `zod`
**Storage**: Local filesystem (PNG files in `public/generated/`)
**Testing**: Manual testing via MCP Inspector (`npx @modelcontextprotocol/inspector`)
**Target Platform**: macOS/Linux dev machine (stdio MCP server)
**Project Type**: Single project with MCP server subdirectory
**Performance Goals**: < 30s per image generation (Gemini API bound)
**Constraints**: Requires Gemini API key with billing; ~$0.04/image
**Scale/Scope**: Developer tool, 1 user at a time, ~5 templates

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Real-Time First | N/A | MCP server is a dev tool, not user-facing data display |
| II. Firebase-Native | PASS | MCP server does not interact with Firebase; it generates static assets for the app |
| III. Simplicity | PASS | Custom server is the simplest path (see research.md Decision 1). 3 deps total. No wrapper layers. |
| IV. Mobile-Responsive UI | N/A | MCP server has no UI |
| V. Environment Safety | PASS | Gemini API key loaded from env var `GEMINI_API_KEY`, never in source. `.mcp.json` uses `${GEMINI_API_KEY}` expansion. |

**Post-Phase 1 Re-check**:
- Simplicity: 5 source files total in `mcp-server/src/`. No
  abstractions beyond tool handlers and template definitions.
- Environment Safety: `.mcp.json` committed with `${VAR}`
  references only. `.env` in `.gitignore`.

## Project Structure

### Documentation (this feature)

```text
specs/001-mcp-graphics-server/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── mcp-tools.md
└── checklists/
    └── requirements.md
```

### Source Code (repository root)

```text
mcp-server/
├── package.json
├── tsconfig.json
└── src/
    ├── index.ts          # Entry point: McpServer setup + transport
    ├── tools.ts          # Tool registration (all 4 tools)
    ├── gemini.ts         # Gemini API client wrapper
    ├── templates.ts      # Template definitions (5 templates)
    └── utils.ts          # File saving, path resolution, validation

public/
└── generated/            # Output directory for generated images
    └── .gitkeep

.mcp.json                 # MCP server configuration (project root)
```

**Structure Decision**: MCP server lives in `mcp-server/`
subdirectory. This keeps it self-contained while sharing the
project root for `.mcp.json` configuration. The server writes
output to `public/generated/` which is accessible to the Next.js
app. This is the simplest layout — no monorepo tooling needed.

## Complexity Tracking

> No constitution violations to justify. All principles pass or
> are not applicable.
