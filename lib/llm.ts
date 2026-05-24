// LLM provider abstraction. The ElevenLabs Speech Engine SDK auto-extracts
// text deltas from OpenAI Chat Completions, OpenAI Responses, Anthropic, and
// Gemini stream formats. Mistral's API is OpenAI-compatible (same Chat
// Completions wire format), so we can drive Mistral directly with the OpenAI
// SDK by pointing baseURL at api.mistral.ai/v1 — and the resulting stream is
// extracted natively.
//
// Default provider: Mistral. Generous free tier (1B tokens/month at time of
// writing, see https://console.mistral.ai/). Swap in another provider by
// adding a branch below and changing `llmProvider` in the SessionConfig.

import OpenAI from "openai";
import type { SessionConfig } from "./session-store";
import type { TranscriptMessage } from "@elevenlabs/elevenlabs-js/wrapper/speech-engine/types";

export const MISTRAL_BASE_URL = "https://api.mistral.ai/v1";

/** Models we recommend for the voice loop. All work on the free tier. */
export const MISTRAL_VOICE_MODELS = {
  fast: "ministral-8b-latest", // lowest latency, smaller model
  balanced: "mistral-small-latest", // recommended default
  quality: "mistral-medium-latest", // sharper reasoning, slightly slower
} as const;

export function getMistralClient(apiKey: string): OpenAI {
  return new OpenAI({ apiKey, baseURL: MISTRAL_BASE_URL });
}

export async function streamResponse(
  config: SessionConfig,
  transcript: TranscriptMessage[],
  signal: AbortSignal,
): Promise<AsyncIterable<unknown>> {
  if (config.llmProvider === "mistral") {
    return streamMistral(config, transcript, signal);
  }
  throw new Error(`Unsupported LLM provider: ${config.llmProvider}`);
}

async function streamMistral(
  config: SessionConfig,
  transcript: TranscriptMessage[],
  signal: AbortSignal,
): Promise<AsyncIterable<unknown>> {
  if (!config.mistralApiKey) {
    throw new Error("Missing Mistral API key");
  }
  const client = getMistralClient(config.mistralApiKey);
  const messages: Array<{
    role: "system" | "user" | "assistant";
    content: string;
  }> = [
    { role: "system", content: config.systemPrompt },
    ...transcript.map((m) => ({
      role: (m.role === "agent" ? "assistant" : "user") as
        | "user"
        | "assistant",
      content: m.content,
    })),
  ];
  const stream = await client.chat.completions.create(
    {
      model: config.llmModel,
      messages,
      stream: true,
      temperature: 0.8,
    },
    { signal },
  );
  return stream;
}
