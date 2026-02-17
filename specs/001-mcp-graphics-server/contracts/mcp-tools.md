# MCP Tool Contracts: Graphics & Icons Server

**Server name**: `ryder-cup-graphics`
**Transport**: stdio
**Date**: 2026-02-16

## Tool 1: `generate_icon`

Generate a single image from a text description.

### Input Schema

```typescript
{
  prompt: string          // Required. Text description of the image.
  aspectRatio?: string    // Optional. Default: "1:1"
                          // Values: "1:1"|"2:3"|"3:2"|"3:4"|"4:3"
                          //         |"4:5"|"5:4"|"9:16"|"16:9"|"21:9"
  size?: string           // Optional. Default: "1K"
                          // Values: "1K"|"2K"|"4K"
  outputDir?: string      // Optional. Default: "{projectRoot}/public/generated"
}
```

### Response

**Success**:
```json
{
  "content": [{
    "type": "text",
    "text": "Image generated successfully."
  }],
  "structuredContent": {
    "filePath": "/abs/path/to/generated/icon-1708100000-abc12.png",
    "format": "png",
    "sizeBytes": 45230
  }
}
```

**Error** (invalid input):
```json
{
  "content": [{
    "type": "text",
    "text": "Error: prompt is required and must be non-empty."
  }],
  "isError": true
}
```

---

## Tool 2: `list_templates`

List all available graphic templates with descriptions.

### Input Schema

```typescript
{}  // No parameters
```

### Response

```json
{
  "content": [{
    "type": "text",
    "text": "Available templates:\n\n1. team-badge: Circular team badge...\n2. session-banner: ..."
  }],
  "structuredContent": {
    "templates": [
      {
        "name": "team-badge",
        "description": "Circular team badge with team name and colors",
        "requiredParams": ["teamName", "primaryColor"],
        "optionalParams": ["accentColor"],
        "defaultAspectRatio": "1:1",
        "defaultSize": "1K"
      }
    ]
  }
}
```

---

## Tool 3: `generate_from_template`

Generate an image using a predefined template.

### Input Schema

```typescript
{
  template: string        // Required. Template name (e.g., "team-badge")
  params: object          // Required. Key-value pairs for template placeholders
  aspectRatio?: string    // Optional. Overrides template default
  size?: string           // Optional. Overrides template default
  outputDir?: string      // Optional. Default: "{projectRoot}/public/generated"
}
```

### Response

**Success**: Same structure as `generate_icon`.

**Error** (unknown template):
```json
{
  "content": [{
    "type": "text",
    "text": "Error: Template 'unknown-template' not found. Use list_templates to see available templates."
  }],
  "isError": true
}
```

**Error** (missing required param):
```json
{
  "content": [{
    "type": "text",
    "text": "Error: Template 'team-badge' requires parameter 'teamName' but it was not provided."
  }],
  "isError": true
}
```

---

## Tool 4: `generate_icon_batch`

Generate the same image in multiple sizes.

### Input Schema

```typescript
{
  prompt: string          // Required. Text description of the image.
  sizes: string[]         // Required. Array of size strings.
                          // Values: "1K"|"2K"|"4K"
  aspectRatio?: string    // Optional. Default: "1:1"
  outputDir?: string      // Optional. Default: "{projectRoot}/public/generated"
}
```

### Response

**Success**:
```json
{
  "content": [{
    "type": "text",
    "text": "Batch complete: 3/3 images generated."
  }],
  "structuredContent": {
    "results": [
      {
        "size": "1K",
        "filePath": "/abs/path/to/generated/batch-1K-abc12.png",
        "format": "png",
        "sizeBytes": 45230
      },
      {
        "size": "2K",
        "filePath": "/abs/path/to/generated/batch-2K-abc12.png",
        "format": "png",
        "sizeBytes": 102400
      }
    ],
    "errors": []
  }
}
```

**Partial failure**:
```json
{
  "content": [{
    "type": "text",
    "text": "Batch complete: 2/3 images generated. 1 error."
  }],
  "structuredContent": {
    "results": [
      { "size": "1K", "filePath": "...", "format": "png", "sizeBytes": 45230 }
    ],
    "errors": [
      { "size": "4K", "error": "4K size requires Nano Banana Pro model" }
    ]
  }
}
```

---

## Error Handling Contract

All tools follow these error conventions:

| Condition | Behavior |
|-----------|----------|
| Missing required param | Return `isError: true` with param name |
| Invalid enum value | Return `isError: true` listing valid values |
| Gemini API error | Return `isError: true` with API error message |
| Gemini API timeout | Return `isError: true` after 60s: "Generation timed out" |
| Output dir not writable | Return `isError: true` with path and permission info |
| Prompt too long (>2000 chars) | Return `isError: true` with length limit |

No tool should ever throw an unhandled exception. All errors
MUST be caught and returned as MCP error responses.
