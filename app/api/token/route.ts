// POST /api/token
//
// Mints a WebRTC token for the conversation and pushes the session config
// onto our in-memory queue. The next ElevenLabs WebSocket connection will
// pop this config and use it to drive the LLM.
//
// Request body:
//   {
//     scenarioId: string,
//     personaId: string,
//     customContext?: string,
//     elevenLabsApiKey: string,
//     mistralApiKey: string,
//     llmModel?: string,
//     engineId: string,
//   }

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { ElevenLabsClient } from "@elevenlabs/elevenlabs-js";
import { buildSystemPrompt, getPersona, getScenario } from "@/lib/scenarios";
import { pushPendingConfig } from "@/lib/session-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const Body = z.object({
  scenarioId: z.string(),
  personaId: z.string(),
  customContext: z.string().optional(),
  elevenLabsApiKey: z.string().min(10),
  mistralApiKey: z.string().min(10),
  llmModel: z.string().default("mistral-small-latest"),
  engineId: z.string().min(4),
});

export async function POST(req: NextRequest) {
  const parsed = Body.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request", details: parsed.error.flatten() },
      { status: 400 },
    );
  }
  const body = parsed.data;

  const scenario = getScenario(body.scenarioId);
  if (!scenario) {
    return NextResponse.json({ error: "Unknown scenario" }, { status: 404 });
  }
  const persona = getPersona(body.scenarioId, body.personaId);
  if (!persona) {
    return NextResponse.json({ error: "Unknown persona" }, { status: 404 });
  }

  const systemPrompt = buildSystemPrompt(scenario, persona, body.customContext);

  // Push the config first so the WS handler can grab it as soon as the
  // ElevenLabs connection arrives.
  pushPendingConfig({
    scenario,
    persona,
    systemPrompt,
    customContext: body.customContext,
    firstMessage: scenario.firstMessage,
    llmProvider: "mistral",
    llmModel: body.llmModel,
    mistralApiKey: body.mistralApiKey,
    elevenLabsApiKey: body.elevenLabsApiKey,
    voiceId: persona.voiceId,
    createdAt: Date.now(),
  });

  const client = new ElevenLabsClient({ apiKey: body.elevenLabsApiKey });
  try {
    const token = await client.conversationalAi.conversations.getWebrtcToken({
      agentId: body.engineId,
    });
    return NextResponse.json({
      token: token.token,
      firstMessage: scenario.firstMessage,
      personaLabel: persona.label,
      scenarioTitle: scenario.title,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { error: `Failed to mint conversation token: ${message}` },
      { status: 500 },
    );
  }
}
