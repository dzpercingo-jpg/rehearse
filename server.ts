// Custom Node server for Rehearse.
//
// We can't run the Speech Engine WebSocket handler from a Next.js route
// because route handlers are short-lived. Instead we boot Next.js
// programmatically, then attach the Speech Engine to the SAME HTTP server
// on the `/ws` path. ElevenLabs's API connects to wss://<host>/ws and our
// handler bridges transcripts to whichever LLM the user picked.
//
// Run with: pnpm dev (uses tsx) or pnpm start (built next + tsx).
//
// In production, set:
//   - ELEVENLABS_API_KEY      — used to verify the WS upgrade signature
//   - PUBLIC_WS_URL or PUBLIC_BASE_URL — public URL the engine should dial
//   - PORT                    — defaults to 3000

import { createServer } from "node:http";
import next from "next";
import { ElevenLabsClient } from "@elevenlabs/elevenlabs-js";
import {
  bindPendingToConversation,
  endConversation,
  getActiveConfig,
  getStoreStats,
} from "./lib/session-store";
import { streamResponse } from "./lib/llm";

const port = parseInt(process.env.PORT || "3000", 10);
const dev = process.env.NODE_ENV !== "production";

const apiKey = process.env.ELEVENLABS_API_KEY;
const engineId = process.env.ELEVENLABS_ENGINE_ID;

const app = next({ dev });
const handle = app.getRequestHandler();

async function main() {
  await app.prepare();

  const httpServer = createServer((req, res) => {
    handle(req, res).catch((err) => {
      console.error("[next handler]", err);
      res.statusCode = 500;
      res.end("internal error");
    });
  });

  // Attach Speech Engine if env vars are present. In local dev without keys
  // the app still boots and shows the setup wizard — the WS endpoint is
  // just dormant until configured.
  if (apiKey && engineId) {
    try {
      const client = new ElevenLabsClient({ apiKey });
      const engine = await client.speechEngine.get(engineId);
      engine.attach(httpServer, "/ws", {
        debug: dev,
        onInit(conversationId) {
          const config = bindPendingToConversation(conversationId);
          const stats = getStoreStats();
          if (config) {
            console.log(
              `[ws] conversation ${conversationId} bound to ${config.scenario.id}/${config.persona.id} (pending=${stats.pending}, active=${stats.active})`,
            );
          } else {
            console.warn(
              `[ws] conversation ${conversationId} started without a pending config — using fallback persona`,
            );
          }
        },
        async onTranscript(transcript, signal, session) {
          const conversationId = session.conversationId;
          if (!conversationId) {
            console.warn("[ws] transcript before conversationId");
            return;
          }
          const config = getActiveConfig(conversationId);
          if (!config) {
            session.sendResponse(
              "Sorry, I lost track of our setup. Could you say that again?",
            );
            return;
          }
          try {
            const stream = await streamResponse(config, transcript, signal);
            await session.sendResponse(stream);
          } catch (err) {
            if ((err as Error)?.name === "AbortError") return;
            console.error("[llm]", err);
            session.sendResponse(
              "Hmm — I lost the thread for a moment. Could you say that one more time?",
            );
          }
        },
        onClose(session) {
          if (session.conversationId) endConversation(session.conversationId);
        },
        onDisconnect(session) {
          if (session.conversationId) endConversation(session.conversationId);
        },
        onError(error) {
          console.error("[speech-engine error]", error);
        },
      });
      console.log(
        `[speech-engine] attached engine ${engineId} on /ws (dev=${dev})`,
      );
    } catch (err) {
      console.error("[speech-engine] failed to attach:", err);
      console.error(
        "  Check ELEVENLABS_API_KEY and ELEVENLABS_ENGINE_ID. The app will continue without voice support.",
      );
    }
  } else {
    console.warn(
      "[speech-engine] not attached — set ELEVENLABS_API_KEY and ELEVENLABS_ENGINE_ID to enable voice.",
    );
    console.warn(
      "  You can also run the in-app setup wizard at /setup to create an engine and copy the IDs.",
    );
  }

  httpServer.listen(port, () => {
    console.log(`> Rehearse listening at http://localhost:${port}`);
  });
}

main().catch((err) => {
  console.error("[server] fatal", err);
  process.exit(1);
});
