import * as fs from "fs";
import * as path from "path";
import * as crypto from "crypto";

const VALID_ASPECT_RATIOS = [
  "1:1", "2:3", "3:2", "3:4", "4:3",
  "4:5", "5:4", "9:16", "16:9", "21:9",
] as const;

const VALID_SIZES = ["1K", "2K", "4K"] as const;

const MAX_PROMPT_LENGTH = 2000;

export function generateFilename(prefix: string): string {
  const timestamp = Date.now();
  const randomId = crypto.randomBytes(4).toString("hex");
  return `${prefix}-${timestamp}-${randomId}.png`;
}

export async function saveImage(
  buffer: Buffer,
  outputDir: string,
  prefix: string,
): Promise<{ filePath: string; sizeBytes: number }> {
  const dir = resolveOutputDir(outputDir);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  const filename = generateFilename(prefix);
  const filePath = path.resolve(dir, filename);
  fs.writeFileSync(filePath, buffer);
  const sizeBytes = fs.statSync(filePath).size;
  return { filePath, sizeBytes };
}

export function resolveOutputDir(outputDir?: string): string {
  if (outputDir) {
    if (!fs.existsSync(outputDir)) {
      throw new Error(
        `Output directory does not exist: ${outputDir}`,
      );
    }
    return path.resolve(outputDir);
  }
  // Default: project root's public/generated/
  // Walk up from mcp-server/build/ to find project root
  let dir = process.cwd();
  const publicGen = path.join(dir, "public", "generated");
  if (fs.existsSync(path.join(dir, "public"))) {
    if (!fs.existsSync(publicGen)) {
      fs.mkdirSync(publicGen, { recursive: true });
    }
    return publicGen;
  }
  // Fallback: try parent directory (when cwd is mcp-server/)
  const parent = path.dirname(dir);
  const parentPublicGen = path.join(parent, "public", "generated");
  if (fs.existsSync(path.join(parent, "public"))) {
    if (!fs.existsSync(parentPublicGen)) {
      fs.mkdirSync(parentPublicGen, { recursive: true });
    }
    return parentPublicGen;
  }
  // Last resort: cwd
  return dir;
}

export function validatePrompt(prompt: string): void {
  if (!prompt || prompt.trim().length === 0) {
    throw new Error("prompt is required and must be non-empty.");
  }
  if (prompt.length > MAX_PROMPT_LENGTH) {
    throw new Error(
      `prompt must be ${MAX_PROMPT_LENGTH} characters or fewer (got ${prompt.length}).`,
    );
  }
}

export function validateAspectRatio(ratio: string): void {
  if (!VALID_ASPECT_RATIOS.includes(ratio as typeof VALID_ASPECT_RATIOS[number])) {
    throw new Error(
      `Invalid aspectRatio "${ratio}". Valid values: ${VALID_ASPECT_RATIOS.join(", ")}`,
    );
  }
}

export function validateSize(size: string): void {
  if (!VALID_SIZES.includes(size as typeof VALID_SIZES[number])) {
    throw new Error(
      `Invalid size "${size}". Valid values: ${VALID_SIZES.join(", ")}`,
    );
  }
}
