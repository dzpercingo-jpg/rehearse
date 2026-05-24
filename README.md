<div align="center">

# Rehearse

**Practice the conversation before you have it.**

Voice-AI roleplay for the toughest conversations — asking for a raise, ending a relationship, advocating to a doctor, pitching investors. The AI plays the *other side*. You practise. Get a critique when you hang up.

Built for [ElevenHacks #10 · Speech Engine](https://hacks.elevenlabs.io). Powered by Mistral (free tier).

[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy?repo=https://github.com/dzpercingo-jpg/rehearse)
[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fdzpercingo-jpg%2Frehearse&env=ELEVENLABS_API_KEY,ELEVENLABS_ENGINE_ID,PUBLIC_WS_URL&envDescription=Server-side%20creds%20for%20the%20Speech%20Engine%20WS%20handler.%20PUBLIC_WS_URL%20is%20the%20wss%3A%2F%2F%20URL%20of%20your%20backend.&project-name=rehearse&repository-name=rehearse)

</div>

---

## What it does

You pick a conversation you&apos;re dreading — ask for a 15% raise, end a relationship, push back on a dismissive doctor — and the app drops you into a live voice call with an AI playing the other side. You can:

- **Speak naturally.** The AI listens, transcribes, responds in real time via [ElevenLabs Speech Engine](https://elevenlabs.io/docs/speech-engine).
- **Interrupt.** Cut the AI off mid-sentence; it stops and listens, like a real conversation.
- **Choose the difficulty.** Each scenario has 3 personas: supportive, sharp, or hardcore.
- **Get an honest critique.** When you hang up, your LLM scores the transcript against a scenario-specific rubric and quotes one moment to remember.

Eight built-in scenarios (raise, breakup, landlord, investor pitch, job interview, telling parents bad news, medical advocacy, custom). The persona is just a system prompt — fork the file to add your own.

## Architecture

```
┌───────────────────────┐         ┌──────────────────────┐
│  Browser (Next.js)    │         │ Node server          │
│  - Setup wizard       │         │ - Next.js handler    │
│  - Scenario picker    │ HTTPS   │ - Speech Engine WS   │
│  - Live transcript    │◄───────►│   at /ws (BYO-LLM)   │
│  - Post-call critique │  WebRTC │ - LLM router         │
└───────────┬───────────┘         └──────────┬───────────┘
            │                                │
            │   wss://… (audio + transcripts)│
            ▼                                ▼
       ┌─────────────────────────────────────────┐
       │      ElevenLabs Speech Engine           │
       │   (STT + TTS + turn-taking + barge-in)  │
       └─────────────────────────────────────────┘
```

- **Frontend**: Next.js 16 (App Router), TypeScript, Tailwind v4, Framer Motion, [@elevenlabs/react](https://www.npmjs.com/package/@elevenlabs/react).
- **Backend**: Same Node process. We boot Next.js programmatically (`server.ts`) and attach `SpeechEngineResource.attach(httpServer, "/ws", ...)` to the same HTTP server. The Speech Engine handles JWT verification, audio, STT/TTS, and turn-taking. We just provide the LLM stream.
- **LLM**: Mistral by default (`mistral-small-latest`), via Mistral&apos;s OpenAI-compatible Chat Completions API. Swap to `mistral-medium-latest`, `mistral-large-latest`, or `ministral-8b-latest` (lowest latency) by editing [`lib/llm.ts`](./lib/llm.ts). The Speech Engine SDK reads OpenAI-format stream chunks natively, so Mistral plugs in with zero translation.
- **Storage**: None. Keys live in the browser&apos;s localStorage. Sessions persist only in memory on the server (no DB).

## Quick start

```bash
pnpm install
pnpm dev          # http://localhost:3000 — runs Next.js + Speech Engine WS
```

You&apos;ll need two free API keys:

1. **ElevenLabs.** [elevenlabs.io/app/settings/api-keys](https://elevenlabs.io/app/settings/api-keys). The in-app setup wizard creates a Speech Engine for you on first run.
2. **Mistral.** [console.mistral.ai/api-keys](https://console.mistral.ai/api-keys). The free Experiment tier covers ~1B tokens/month, which is plenty.

Visit `/setup` once and paste both keys. They&apos;re stored only in your browser.

### Connecting from the public internet (Speech Engine needs a public wss:// URL)

The Speech Engine dials *into* your server over WebSocket, so localhost won&apos;t work for the audio path. In development we recommend [ngrok](https://ngrok.com/):

```bash
# Terminal 1
pnpm dev

# Terminal 2
ngrok http 3000
# copy the https URL it gives you, then:
export PUBLIC_WS_URL="wss://your-ngrok-id.ngrok.app/ws"
# restart pnpm dev so the value is picked up
```

The setup wizard will register that URL with ElevenLabs when you save your key.

## Environment variables

| Variable | Where | What |
| --- | --- | --- |
| `PUBLIC_WS_URL` | server | Public `wss://` URL the Speech Engine should dial. Defaults to `ws://localhost:3000/ws`. |
| `PUBLIC_BASE_URL` | server | Optional fallback. We&apos;ll derive `PUBLIC_WS_URL` from it. |
| `ELEVENLABS_API_KEY` | server | Used by `server.ts` so the Speech Engine WS upgrade can verify JWTs. |
| `ELEVENLABS_ENGINE_ID` | server | The engine the server attaches to. Created by the setup wizard or via API. |

## Deploy

**Frontend + backend together (recommended)** — one Node process serves both. Render and Fly are happy with this.

- [Render Blueprint](./render.yaml) — click the badge above. Render forks the repo, builds it, and runs `pnpm start`.
- [Procfile](./Procfile) — `web: pnpm start`. Works on Railway, Fly, Heroku-style platforms.

**Vercel (frontend only)** — the WebSocket handler doesn&apos;t run on Vercel&apos;s serverless platform. Host the Next.js front on Vercel, then run `server.ts` separately on Render/Fly and point `PUBLIC_WS_URL` at it.

## Repository layout

```
app/
  page.tsx                        landing + scenario picker
  setup/page.tsx                  API key wizard
  session/[scenarioId]/page.tsx   live conversation view
  review/page.tsx                 post-call critique
  api/
    engine/setup/route.ts         validate ElevenLabs key, ensure engine exists
    token/route.ts                mint WebRTC token + push session config
    critique/route.ts             score the transcript against the rubric
components/                       UI building blocks
lib/
  scenarios.ts                    8 scenarios + personas + rubric
  session-store.ts                in-memory map of conversation_id → config
  llm.ts                          OpenAI router (swap LLM here)
  elevenlabs.ts                   public WS URL resolver
  credentials.ts                  localStorage helpers (client)
  transcript.ts                   typed transcript helpers (client)
server.ts                         Next.js + Speech Engine WS attach point
```

## License

MIT.
