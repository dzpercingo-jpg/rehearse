// Server-side helpers for working with ElevenLabs Speech Engine.
import { ElevenLabsClient } from "@elevenlabs/elevenlabs-js";

export function getElevenLabsClient(apiKey: string) {
  if (!apiKey) {
    throw new Error("Missing ElevenLabs API key");
  }
  return new ElevenLabsClient({ apiKey });
}

/** Resolve the public WebSocket URL ElevenLabs should connect to. */
export function getPublicWsUrl(): string {
  const explicit = process.env.PUBLIC_WS_URL;
  if (explicit) return explicit;
  const base = process.env.PUBLIC_BASE_URL;
  if (base) {
    return base.replace(/^http/, "ws").replace(/\/$/, "") + "/ws";
  }
  // Sensible local default — the dev script can override via PUBLIC_WS_URL
  // once ngrok is up.
  return "ws://localhost:3000/ws";
}
