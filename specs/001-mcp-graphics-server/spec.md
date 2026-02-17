# Feature Specification: MCP Graphics & Icons Server

**Feature Branch**: `001-mcp-graphics-server`
**Created**: 2026-02-16
**Status**: Draft
**Input**: User description: "add an mcp server that create graphics and icons"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Generate a Team Logo or Icon (Priority: P1)

A developer or designer working on the Ryder Cup 2026 app uses an
AI coding assistant (e.g., Claude Code) to request a graphic asset.
They describe what they need in natural language (e.g., "create a
64x64 icon of a golf flag in blue and gold") and the MCP server
generates the image file and returns it ready for use in the app.

**Why this priority**: This is the core capability of the server.
Without the ability to generate a single graphic from a text prompt,
no other features have value.

**Independent Test**: Can be fully tested by sending a tool call to
the MCP server with a text description and verifying an image file
is returned in a supported format.

**Acceptance Scenarios**:

1. **Given** the MCP server is running, **When** a client sends a
   `generate_icon` tool call with a text description and size,
   **Then** the server returns an image file in PNG format matching
   the requested dimensions.
2. **Given** the MCP server is running, **When** a client sends a
   `generate_icon` request with an invalid size (e.g., negative
   dimensions), **Then** the server returns a clear error message
   without crashing.
3. **Given** the MCP server is running, **When** a client sends a
   `generate_icon` request without specifying a size, **Then** the
   server uses a sensible default size (e.g., 256x256).

---

### User Story 2 - Generate Styled Graphics with Templates (Priority: P2)

A user requests a graphic that follows a predefined style or
template — for example, a session header banner, a scoreboard
badge, or a team crest. The server provides a set of named
templates (e.g., "scoreboard-badge", "session-banner") and the
user selects one, providing custom parameters like team name,
colors, and text. The server produces a finished graphic.

**Why this priority**: Templates add significant value by enabling
consistent branding across the app, but they depend on the core
generation capability from US1.

**Independent Test**: Can be tested by calling a `generate_from_template`
tool with a template name and parameters, then verifying the output
matches the template's expected layout and dimensions.

**Acceptance Scenarios**:

1. **Given** the MCP server has templates available, **When** a
   client calls `list_templates`, **Then** the server returns a
   list of available template names with descriptions.
2. **Given** a valid template name, **When** a client calls
   `generate_from_template` with the name and required parameters,
   **Then** the server returns a graphic that incorporates the
   provided parameters.
3. **Given** an invalid template name, **When** a client calls
   `generate_from_template`, **Then** the server returns an error
   indicating the template was not found.

---

### User Story 3 - Batch Generate Multiple Icon Sizes (Priority: P3)

A user needs the same icon in multiple sizes for different contexts
(e.g., favicon 16x16, nav icon 32x32, splash icon 512x512). They
provide a single description and a list of target sizes, and the
server generates all variants in one request.

**Why this priority**: Batch generation is a convenience feature
that saves time but is not essential. Users can achieve the same
result by calling US1 multiple times.

**Independent Test**: Can be tested by sending a batch request with
3 different sizes and verifying 3 correctly-sized images are returned.

**Acceptance Scenarios**:

1. **Given** the MCP server is running, **When** a client calls
   `generate_icon_batch` with a description and list of sizes,
   **Then** the server returns one image file per requested size.
2. **Given** a batch request with one invalid size in the list,
   **When** the server processes the request, **Then** it generates
   the valid sizes and returns an error for the invalid one.

---

### Edge Cases

- What happens when the generation service is unavailable or times
  out? The server MUST return a descriptive error and not hang.
- What happens when the prompt contains inappropriate or nonsensical
  content? The server MUST still return a result or a clear refusal
  message.
- What happens when the output file path is not writable? The server
  MUST return the image data directly rather than failing silently.
- What happens when the requested image dimensions exceed a maximum
  limit (e.g., 4096x4096)? The server MUST reject with a clear
  size constraint message.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST expose an MCP-compliant server that
  registers tools for graphic generation.
- **FR-002**: System MUST provide a `generate_icon` tool that
  accepts a text description and optional size parameters and
  returns a generated image.
- **FR-003**: System MUST support PNG as the default output format.
- **FR-004**: System MUST provide a `list_templates` tool that
  returns available graphic templates with descriptions.
- **FR-005**: System MUST provide a `generate_from_template` tool
  that accepts a template name and custom parameters.
- **FR-006**: System MUST provide a `generate_icon_batch` tool
  that accepts a description and multiple sizes, returning one
  image per size.
- **FR-007**: System MUST validate all input parameters and return
  clear, actionable error messages for invalid inputs.
- **FR-008**: System MUST save generated images to a configurable
  output directory, defaulting to the project's `public/` folder.
- **FR-009**: System MUST return file paths of generated images
  in tool responses so the calling agent can reference them.
- **FR-010**: System MUST be configurable via a standard MCP
  server configuration block (e.g., in Claude Desktop config or
  `.mcp.json`).
- **FR-011**: System MUST use Google Gemini's Nano Banana image
  generation capability as the backend, authenticated via a
  Gemini API key provided through environment configuration.

### Key Entities

- **Graphic Request**: Represents a single generation request;
  includes description text, target dimensions, output format,
  and optional template reference.
- **Template**: A named, reusable graphic layout with defined
  parameter slots (e.g., text, colors, dimensions) and a
  preview description.
- **Generated Asset**: The output image file; includes file path,
  format, dimensions, and the originating request reference.

### Assumptions

- The MCP server runs as a local stdio-based process, started by
  the AI coding assistant (not as a remote HTTP service).
- Image generation is powered by Google Gemini's Nano Banana
  model, which requires a valid Gemini API key. The existing
  `nano-banana-mcp` npm package may be used as a foundation or
  reference implementation.
- Generated images are saved to disk and referenced by file path
  (not streamed as base64 in tool responses, unless the file
  exceeds practical size — in which case base64 may be used as
  a fallback).
- The server is used during development time, not in production
  runtime. Performance requirements are relaxed accordingly.
- A Gemini API key is available and configured via environment
  variable. The key is never committed to source control.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A user can generate a graphic from a text description
  in under 30 seconds end-to-end (prompt to file on disk).
- **SC-002**: Generated icons are pixel-accurate to the requested
  dimensions (exact width and height match).
- **SC-003**: The MCP server starts and registers all tools within
  5 seconds of being launched.
- **SC-004**: 100% of invalid inputs produce a clear error message
  (no unhandled exceptions or silent failures).
- **SC-005**: At least 3 templates are available for common Ryder
  Cup graphic needs (e.g., team badge, session banner, score icon).
- **SC-006**: Batch generation of 5 sizes completes within 2 minutes.
