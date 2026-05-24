// POST /api/engine/setup
//
// Validates the user's ElevenLabs API key and ensures a Speech Engine exists
// pointing to our public WebSocket URL. If a Rehearse-managed engine already
// exists in the user's account (matched by tag), it's reused; otherwise we
// create a new one.
//
// Request body: { elevenLabsApiKey: string }
// Response: { engineId: string, wsUrl: string }

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { ElevenLabsClient } from "@elevenlabs/elevenlabs-js";
import { getPublicWsUrl } from "@/lib/elevenlabs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const REHEARSE_TAG = "rehearse-app";
const ENGINE_NAME = "Rehearse (BYO-LLM)";

const Body = z.object({
  elevenLabsApiKey: z.string().min(10),
});

export async function POST(req: NextRequest) {
  const parsed = Body.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Missing ElevenLabs API key" },
      { status: 400 },
    );
  }

  const apiKey = parsed.data.elevenLabsApiKey.trim();
  const client = new ElevenLabsClient({ apiKey });

  // Sanity check the key.
  try {
    await client.user.get();
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { error: `ElevenLabs key was rejected: ${message}` },
      { status: 401 },
    );
  }

  const wsUrl = getPublicWsUrl();

  // Look for an existing Rehearse engine.
  let engineId: string | undefined;
  try {
    const list = await client.speechEngine.list();
    const existing = list.speechEngines?.find(
      (e) => e.tags?.includes(REHEARSE_TAG),
    );
    if (existing) {
      engineId = existing.speechEngineId;
      // Refresh its wsUrl so it stays pointed at our current public URL
      // (useful in dev where ngrok URLs change between runs).
      try {
        await client.speechEngine.update(engineId, {
          speechEngine: { wsUrl },
        });
      } catch {
        // Non-fatal — engine still works with whatever URL it has.
      }
    }
  } catch (err) {
    // List failed but we can still try to create a new one.
    console.warn("speechEngine.list failed:", err);
  }

  if (!engineId) {
    try {
      const created = await client.speechEngine.create({
        name: ENGINE_NAME,
        speechEngine: { wsUrl },
        tags: [REHEARSE_TAG],
        language: "en",
        overrides: { firstMessage: true },
      });
      engineId = created.engineId;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      return NextResponse.json(
        { error: `Failed to create Speech Engine: ${message}` },
        { status: 500 },
      );
    }
  }

  return NextResponse.json({ engineId, wsUrl });
}
