import { GoogleGenAI } from "@google/genai";

const GENERATION_TIMEOUT_MS = 60_000;
const DEFAULT_MODEL = "gemini-2.5-flash-image";

let aiClient: GoogleGenAI | null = null;

function getClient(): GoogleGenAI {
  if (aiClient) return aiClient;
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error(
      "GEMINI_API_KEY environment variable is not set. " +
      "Get a key from https://aistudio.google.com/apikey",
    );
  }
  aiClient = new GoogleGenAI({ apiKey });
  return aiClient;
}

export async function generateImage(
  prompt: string,
  options: { aspectRatio?: string; size?: string } = {},
): Promise<Buffer> {
  const ai = getClient();
  const aspectRatio = options.aspectRatio ?? "1:1";
  const imageSize = options.size ?? "1K";

  const controller = new AbortController();
  const timeout = setTimeout(
    () => controller.abort(),
    GENERATION_TIMEOUT_MS,
  );

  try {
    const response = await ai.models.generateContent({
      model: DEFAULT_MODEL,
      contents: prompt,
      config: {
        responseModalities: ["TEXT", "IMAGE"],
        imageConfig: {
          aspectRatio: aspectRatio as
            | "1:1" | "2:3" | "3:2" | "3:4" | "4:3"
            | "4:5" | "5:4" | "9:16" | "16:9" | "21:9",
          imageSize: imageSize as "1K" | "2K" | "4K",
        },
      },
      // @ts-expect-error AbortSignal support may vary by SDK version
      signal: controller.signal,
    });

    const parts = response.candidates?.[0]?.content?.parts ?? [];
    for (const part of parts) {
      if (part.inlineData?.data) {
        return Buffer.from(part.inlineData.data, "base64");
      }
    }

    throw new Error(
      "Gemini returned no image data. The model may have " +
      "refused the prompt or returned text only.",
    );
  } catch (err: unknown) {
    if (err instanceof Error && err.name === "AbortError") {
      throw new Error(
        `Image generation timed out after ${GENERATION_TIMEOUT_MS / 1000}s.`,
      );
    }
    throw err;
  } finally {
    clearTimeout(timeout);
  }
}
