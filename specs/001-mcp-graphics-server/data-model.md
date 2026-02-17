# Data Model: MCP Graphics & Icons Server

**Feature Branch**: `001-mcp-graphics-server`
**Date**: 2026-02-16

## Entities

### Template

A predefined prompt blueprint for consistent Ryder Cup branding.

| Field | Type | Description |
|-------|------|-------------|
| `name` | string | Unique identifier (e.g., `"team-badge"`) |
| `description` | string | Human-readable explanation |
| `promptTemplate` | string | Base prompt with `{param}` placeholders |
| `requiredParams` | string[] | Parameter names that must be provided |
| `defaults` | object | Default values for optional params |
| `defaultAspectRatio` | string | Recommended aspect ratio (e.g., `"1:1"`) |
| `defaultSize` | string | Recommended size (e.g., `"1K"`) |

**Example**:
```json
{
  "name": "team-badge",
  "description": "Circular team badge with team name and colors",
  "promptTemplate": "A professional circular sports badge for team '{teamName}' with primary color {primaryColor} and accent color {accentColor}. Clean modern design, suitable for a sports app icon. White background, no text artifacts.",
  "requiredParams": ["teamName", "primaryColor"],
  "defaults": { "accentColor": "gold" },
  "defaultAspectRatio": "1:1",
  "defaultSize": "1K"
}
```

### Graphic Request (runtime, not persisted)

Represents a single generation request passed to a tool.

| Field | Type | Description |
|-------|------|-------------|
| `prompt` | string | Text description of desired image |
| `width` | number? | Desired width in pixels (optional) |
| `height` | number? | Desired height in pixels (optional) |
| `aspectRatio` | string? | One of the supported ratios |
| `size` | string? | `"1K"`, `"2K"`, or `"4K"` |
| `outputDir` | string? | Override output directory |

### Generated Asset (returned in tool response)

| Field | Type | Description |
|-------|------|-------------|
| `filePath` | string | Absolute path to the saved PNG file |
| `width` | number | Actual image width |
| `height` | number | Actual image height |
| `format` | string | Always `"png"` |
| `sizeBytes` | number | File size in bytes |

## Relationships

```
Template --[used by]--> generate_from_template tool
  └── requiredParams validated against user-provided params

Graphic Request --[produces]--> Generated Asset
  └── 1:1 for generate_icon
  └── 1:N for generate_icon_batch (one asset per size)
```

## Validation Rules

- `prompt` MUST be non-empty and <= 2000 characters.
- `width` and `height` MUST be positive integers between 16
  and 4096 if specified.
- `aspectRatio` MUST be one of the 10 supported values.
- `size` MUST be one of `"1K"`, `"2K"`, `"4K"`.
- `outputDir` MUST be an existing writable directory if provided.
- Template `requiredParams` MUST all be present in the user's
  parameter object.

## Initial Templates (MVP)

1. **`team-badge`**: Circular team badge with team name and
   colors. Parameters: `teamName`, `primaryColor`,
   `accentColor` (optional).

2. **`session-banner`**: Wide banner for session headers (16:9).
   Parameters: `sessionName`, `teamAName`, `teamBName`,
   `backgroundColor` (optional).

3. **`score-icon`**: Small score indicator icon. Parameters:
   `score`, `teamColor`.

4. **`leaderboard-header`**: Wide header graphic for the
   leaderboard page. Parameters: `eventName`, `teamAName`,
   `teamBName`.

5. **`player-avatar`**: Placeholder avatar for player profiles.
   Parameters: `playerName`, `teamColor`.
