# Research: MCP Graphics & Icons Server

**Feature Branch**: `001-mcp-graphics-server`
**Date**: 2026-02-16

## Decision 1: Build Custom vs. Use Existing `nano-banana-mcp`

**Decision**: Build a custom MCP server that calls the Gemini API
directly via `@google/genai`.

**Rationale**:
- The existing `nano-banana-mcp` package (v1.0.3) lacks three
  features required by the spec: custom output paths (FR-008),
  template-based generation (FR-004/005), and batch generation
  (FR-006).
- Its output directory is hardcoded to `generated_imgs/` or
  `~/nano-banana-images/` with no override.
- Wrapping `nano-banana-mcp` and adding features on top would
  create unnecessary indirection.
- The Gemini API itself is straightforward to call — only ~20
  lines of TypeScript to generate an image.

**Alternatives considered**:
- Fork `nano-banana-mcp`: Rejected — the codebase is compiled
  and the fork maintenance burden outweighs building fresh.
- Use `nano-banana-mcp` as-is plus a separate template server:
  Rejected — two MCP servers for one feature violates Simplicity.

## Decision 2: Gemini Model Selection

**Decision**: Use `gemini-2.5-flash-image` as the default model.

**Rationale**:
- Fast and affordable ($0.039/image).
- Supports 1K resolution (1024x1024), sufficient for icons and
  web graphics.
- Supports all needed aspect ratios (1:1, 16:9, 3:4, etc.).

**Alternatives considered**:
- `gemini-3-pro-image-preview`: Better quality but 3.4x more
  expensive ($0.134/image) and overkill for app icons/badges.
  Could be offered as an optional parameter for pro-quality needs.

## Decision 3: Node.js SDK

**Decision**: Use `@google/genai` (the newer Google Generative AI
SDK for Node.js).

**Rationale**:
- Officially recommended by Google, actively maintained.
- Simpler API surface: `ai.models.generateContent()`.
- Used by reference implementations and Gemini quickstart repos.

**Alternatives considered**:
- `@google/generative-ai` (older SDK): Still works but being
  superseded. No reason to use the older API.
- Raw REST API: Viable but adds boilerplate for auth/error
  handling that the SDK already provides.

## Decision 4: MCP Server Location

**Decision**: Place the MCP server in a `mcp-server/` subdirectory
within the existing project.

**Rationale**:
- The server is tightly coupled to this project (templates are
  Ryder Cup-specific).
- Team members get it automatically with the repo.
- `.mcp.json` at project root can reference `./mcp-server/build/`.
- Keeps the project self-contained per the Simplicity principle.

**Alternatives considered**:
- Separate npm package: Rejected — no reuse case outside this
  project; adds publish/version overhead.

## Decision 5: Image Output Format

**Decision**: PNG only (matching Gemini's native output format).

**Rationale**:
- Gemini returns `image/png` base64 data natively.
- PNG supports transparency, which is essential for icons.
- No conversion step needed — write base64 buffer directly.

**Alternatives considered**:
- WebP: Smaller file sizes but less universal browser support
  for older clients. Not worth the conversion overhead.
- SVG: Not supported by Gemini image generation.

## Decision 6: Template Implementation

**Decision**: Templates are structured prompt definitions stored
as JSON objects in the server code, containing a base prompt
template, required parameters, and default values for aspect
ratio and size.

**Rationale**:
- Simple to implement — a template is just a prompt string with
  `{placeholder}` substitutions.
- No file-based template system needed; templates are few and
  specific to Ryder Cup branding.
- Easy to add new templates without changing server architecture.

**Alternatives considered**:
- File-based templates (YAML/JSON on disk): Overhead for ~5
  templates. Can migrate later if template count grows.
- Reference image-based templates: Requires storing reference
  images and more complex API calls. Deferred to future iteration.

## Key Technical Facts

### Gemini Image Generation API
- **Model**: `gemini-2.5-flash-image`
- **SDK**: `@google/genai` (npm)
- **Config**: `responseModalities: ['TEXT', 'IMAGE']` required
- **Size options**: `1K` (1024px), `2K` (2048px), `4K` (4096px)
- **Aspect ratios**: 1:1, 2:3, 3:2, 3:4, 4:3, 4:5, 5:4,
  9:16, 16:9, 21:9
- **Output**: base64 PNG in `part.inlineData.data`
- **Pricing**: $0.039/image (paid tier required)
- **Rate limits**: ~500 RPM (paid tier 1)

### MCP Server SDK
- **Package**: `@modelcontextprotocol/sdk`
- **Transport**: `StdioServerTransport` (stdio)
- **Schema**: Zod for input validation
- **Logging**: `console.error()` only (stdout is JSON-RPC)
- **Node.js**: >=18.0.0
- **Module**: ESM (`"type": "module"`)
