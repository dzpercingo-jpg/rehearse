// POST /api/critique
//
// Takes a finished transcript and asks an LLM to score the user against the
// scenario's rubric. Returns a structured JSON critique.

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getMistralClient } from "@/lib/llm";
import { getScenario } from "@/lib/scenarios";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const Body = z.object({
  scenarioId: z.string(),
  personaId: z.string(),
  mistralApiKey: z.string().min(10),
  llmModel: z.string().default("mistral-small-latest"),
  transcript: z.array(
    z.object({
      role: z.enum(["user", "agent"]),
      content: z.string(),
    }),
  ),
});

export interface RubricScore {
  id: string;
  label: string;
  /** 0-100. */
  score: number;
  /** One sentence on what the user did well or poorly here. */
  feedback: string;
}

export interface CritiqueResponse {
  overallScore: number;
  headline: string;
  strengths: string[];
  improvements: string[];
  rubric: RubricScore[];
  /** A single quoted moment to highlight (best or worst). */
  highlight?: { quote: string; comment: string };
}

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

  if (body.transcript.length === 0) {
    return NextResponse.json(
      { error: "Transcript is empty — nothing to critique." },
      { status: 400 },
    );
  }

  const client = getMistralClient(body.mistralApiKey);

  const rubricSpec = scenario.rubric
    .map((r) => `- ${r.id}: ${r.label}`)
    .join("\n");

  const transcriptText = body.transcript
    .map((m) => `${m.role.toUpperCase()}: ${m.content}`)
    .join("\n");

  const systemPrompt = `You are a brutally honest but supportive communication coach. You just observed a rehearsal of a difficult conversation: "${scenario.title}". The user was practising the role: ${scenario.userRole}. The other side was: ${scenario.agentRole}.

Score the USER's performance against the rubric below. Be specific. Quote them when possible. Do NOT critique the AI's behaviour — only the user's.

Rubric items (use these exact IDs):
${rubricSpec}

Return JSON only, matching this schema:
{
  "overallScore": number 0-100,
  "headline": string (one punchy line, max 90 chars),
  "strengths": string[] (1-3 concise bullets),
  "improvements": string[] (1-3 concise bullets),
  "rubric": [{ "id": string, "label": string, "score": number 0-100, "feedback": string }],
  "highlight": { "quote": string, "comment": string }
}`;

  try {
    const completion = await client.chat.completions.create({
      model: body.llmModel,
      response_format: { type: "json_object" },
      temperature: 0.4,
      messages: [
        { role: "system", content: systemPrompt },
        {
          role: "user",
          content: `Here is the full transcript:\n\n${transcriptText}\n\nReturn the critique JSON now.`,
        },
      ],
    });

    const raw = completion.choices[0]?.message?.content;
    if (!raw) {
      return NextResponse.json(
        { error: "Critique model returned no content" },
        { status: 500 },
      );
    }
    const critique = JSON.parse(raw) as CritiqueResponse;
    // Backfill labels if the model dropped them.
    critique.rubric = scenario.rubric.map((r) => {
      const match = critique.rubric.find((m) => m.id === r.id);
      return {
        id: r.id,
        label: r.label,
        score: match?.score ?? 0,
        feedback: match?.feedback ?? "—",
      };
    });
    return NextResponse.json(critique);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { error: `Critique generation failed: ${message}` },
      { status: 500 },
    );
  }
}
