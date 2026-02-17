# Quickstart: MCP Graphics & Icons Server

## Prerequisites

- Node.js >= 18
- npm
- A Gemini API key with billing enabled (set in `.env` as
  `GEMINI_API_KEY`)

## Setup

1. Install MCP server dependencies:

```bash
cd mcp-server
npm install
```

2. Build the server:

```bash
npm run build
```

3. Verify the `.mcp.json` at project root contains:

```json
{
  "mcpServers": {
    "ryder-cup-graphics": {
      "type": "stdio",
      "command": "node",
      "args": ["./mcp-server/build/index.js"],
      "env": {
        "GEMINI_API_KEY": "${GEMINI_API_KEY}"
      }
    }
  }
}
```

4. Restart Claude Code (or run `/mcp` to verify the server loads).

## Usage

### Generate an icon

Ask Claude:
> "Generate a 1K golf flag icon with blue and gold colors for the
> Ryder Cup app"

Claude will call `generate_icon` and save the PNG to
`public/generated/`.

### Use a template

Ask Claude:
> "Create a team badge for Team Mergen with navy blue primary color"

Claude will call `generate_from_template` with template
`team-badge` and your parameters.

### List available templates

Ask Claude:
> "What graphic templates are available?"

Claude will call `list_templates` and show descriptions.

### Batch generate

Ask Claude:
> "Generate a golf ball icon in 1K and 2K sizes"

Claude will call `generate_icon_batch` and produce both files.

## Verification Checklist

- [ ] `npm run build` succeeds in `mcp-server/`
- [ ] `/mcp` in Claude Code shows `ryder-cup-graphics` as connected
- [ ] `generate_icon` with a simple prompt returns a PNG file
- [ ] `list_templates` returns at least 3 templates
- [ ] `generate_from_template` with `team-badge` produces an image
- [ ] Error case: empty prompt returns a clear error message

## Troubleshooting

| Symptom | Fix |
|---------|-----|
| Server not found | Check `.mcp.json` paths are correct |
| "API key not configured" | Set `GEMINI_API_KEY` in `.env` |
| "Billing required" | Enable billing on your Google AI project |
| Generation timeout | Check internet connection; retry |
| Build errors | Run `npm install` in `mcp-server/` first |
