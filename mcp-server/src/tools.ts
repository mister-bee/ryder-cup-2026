import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { generateImage } from "./gemini.js";
import {
  validatePrompt,
  validateAspectRatio,
  validateSize,
  resolveOutputDir,
  saveImage,
} from "./utils.js";
import { TEMPLATES, getTemplate, buildPrompt } from "./templates.js";

export function registerTools(server: McpServer): void {
  // ── US1: generate_icon ──────────────────────────────────
  server.tool(
    "generate_icon",
    "Generate a single image from a text description. Returns a PNG file path.",
    {
      prompt: z.string().describe("Text description of the image to generate"),
      aspectRatio: z
        .string()
        .optional()
        .describe('Aspect ratio (default "1:1"). Options: 1:1, 2:3, 3:2, 3:4, 4:3, 4:5, 5:4, 9:16, 16:9, 21:9'),
      size: z
        .string()
        .optional()
        .describe('Image size (default "1K"). Options: 1K, 2K, 4K'),
      outputDir: z
        .string()
        .optional()
        .describe("Custom output directory (defaults to public/generated/)"),
    },
    async ({ prompt, aspectRatio, size, outputDir }) => {
      try {
        validatePrompt(prompt);
        const ratio = aspectRatio ?? "1:1";
        const sz = size ?? "1K";
        if (aspectRatio) validateAspectRatio(ratio);
        if (size) validateSize(sz);

        const outDir = resolveOutputDir(outputDir);
        const buffer = await generateImage(prompt, {
          aspectRatio: ratio,
          size: sz,
        });
        const result = await saveImage(buffer, outDir, "icon");

        return {
          content: [
            {
              type: "text" as const,
              text: `Image generated successfully.\nFile: ${result.filePath}\nSize: ${result.sizeBytes} bytes`,
            },
          ],
        };
      } catch (err: unknown) {
        const message =
          err instanceof Error ? err.message : "Unknown error during image generation.";
        return {
          content: [{ type: "text" as const, text: `Error: ${message}` }],
          isError: true,
        };
      }
    },
  );

  // ── US2: list_templates ─────────────────────────────────
  server.tool(
    "list_templates",
    "List all available graphic templates with descriptions and required parameters.",
    {},
    async () => {
      const lines = TEMPLATES.map(
        (t, i) =>
          `${i + 1}. **${t.name}**: ${t.description}\n` +
          `   Required: ${t.requiredParams.join(", ")}\n` +
          `   Optional: ${Object.keys(t.defaults).join(", ") || "none"}\n` +
          `   Default: ${t.defaultAspectRatio}, ${t.defaultSize}`,
      );
      return {
        content: [
          {
            type: "text" as const,
            text: `Available templates:\n\n${lines.join("\n\n")}`,
          },
        ],
      };
    },
  );

  // ── US2: generate_from_template ─────────────────────────
  server.tool(
    "generate_from_template",
    "Generate an image using a predefined template with custom parameters.",
    {
      template: z.string().describe("Template name (use list_templates to see options)"),
      params: z
        .record(z.string())
        .describe("Key-value pairs for template placeholders"),
      aspectRatio: z
        .string()
        .optional()
        .describe("Override template default aspect ratio"),
      size: z
        .string()
        .optional()
        .describe("Override template default size"),
      outputDir: z
        .string()
        .optional()
        .describe("Custom output directory (defaults to public/generated/)"),
    },
    async ({ template: templateName, params, aspectRatio, size, outputDir }) => {
      try {
        const tmpl = getTemplate(templateName);
        if (!tmpl) {
          return {
            content: [
              {
                type: "text" as const,
                text: `Error: Template '${templateName}' not found. Use list_templates to see available templates.`,
              },
            ],
            isError: true,
          };
        }

        const prompt = buildPrompt(tmpl, params);
        validatePrompt(prompt);

        const ratio = aspectRatio ?? tmpl.defaultAspectRatio;
        const sz = size ?? tmpl.defaultSize;
        if (aspectRatio) validateAspectRatio(ratio);
        if (size) validateSize(sz);

        const outDir = resolveOutputDir(outputDir);
        const buffer = await generateImage(prompt, {
          aspectRatio: ratio,
          size: sz,
        });
        const result = await saveImage(buffer, outDir, templateName);

        return {
          content: [
            {
              type: "text" as const,
              text: `Image generated from template '${templateName}'.\nFile: ${result.filePath}\nSize: ${result.sizeBytes} bytes`,
            },
          ],
        };
      } catch (err: unknown) {
        const message =
          err instanceof Error ? err.message : "Unknown error during template generation.";
        return {
          content: [{ type: "text" as const, text: `Error: ${message}` }],
          isError: true,
        };
      }
    },
  );

  // ── US3: generate_icon_batch ────────────────────────────
  server.tool(
    "generate_icon_batch",
    "Generate the same image in multiple sizes. Returns one PNG file per size.",
    {
      prompt: z.string().describe("Text description of the image to generate"),
      sizes: z
        .array(z.string())
        .min(1)
        .describe('Array of sizes to generate. Options per entry: "1K", "2K", "4K"'),
      aspectRatio: z
        .string()
        .optional()
        .describe('Aspect ratio for all images (default "1:1")'),
      outputDir: z
        .string()
        .optional()
        .describe("Custom output directory (defaults to public/generated/)"),
    },
    async ({ prompt, sizes, aspectRatio, outputDir }) => {
      try {
        validatePrompt(prompt);
        const ratio = aspectRatio ?? "1:1";
        if (aspectRatio) validateAspectRatio(ratio);
        const outDir = resolveOutputDir(outputDir);

        const results: Array<{
          size: string;
          filePath: string;
          format: string;
          sizeBytes: number;
        }> = [];
        const errors: Array<{ size: string; error: string }> = [];

        for (const sz of sizes) {
          try {
            validateSize(sz);
            const buffer = await generateImage(prompt, {
              aspectRatio: ratio,
              size: sz,
            });
            const saved = await saveImage(buffer, outDir, `batch-${sz}`);
            results.push({
              size: sz,
              filePath: saved.filePath,
              format: "png",
              sizeBytes: saved.sizeBytes,
            });
          } catch (err: unknown) {
            const msg =
              err instanceof Error ? err.message : `Failed to generate ${sz}`;
            errors.push({ size: sz, error: msg });
          }
        }

        const total = sizes.length;
        const succeeded = results.length;
        const errCount = errors.length;
        let summary = `Batch complete: ${succeeded}/${total} images generated.`;
        if (errCount > 0) {
          summary += ` ${errCount} error(s).`;
        }

        const details = results
          .map((r) => `  ${r.size}: ${r.filePath} (${r.sizeBytes} bytes)`)
          .join("\n");
        const errDetails = errors
          .map((e) => `  ${e.size}: ${e.error}`)
          .join("\n");

        let text = summary;
        if (details) text += `\n\nGenerated:\n${details}`;
        if (errDetails) text += `\n\nErrors:\n${errDetails}`;

        return {
          content: [{ type: "text" as const, text }],
          isError: results.length === 0,
        };
      } catch (err: unknown) {
        const message =
          err instanceof Error ? err.message : "Unknown error during batch generation.";
        return {
          content: [{ type: "text" as const, text: `Error: ${message}` }],
          isError: true,
        };
      }
    },
  );
}
