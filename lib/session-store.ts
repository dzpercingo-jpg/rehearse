// In-memory store of pending and active session configs.
//
// Lifecycle:
//   1. Browser calls /api/token -> server pushes config to `pending` queue
//      and mints a WebRTC token.
//   2. Browser uses token to open the WebRTC call to ElevenLabs.
//   3. ElevenLabs opens a WebSocket back to our server.
//   4. On `init` event we receive conversation_id; we dequeue the oldest
//      pending config and associate it with the conversation_id.
//   5. Subsequent `onTranscript` callbacks look up the config by
//      conversation_id and use the right system prompt + LLM keys.
//
// This queue approach has a small race condition under concurrent users
// (configs might mismatch if two users call /api/token within milliseconds
// of each other). For the hackathon single-user demo this is fine; the
// production version of this app would create a per-session Speech Engine
// resource so the conversation_id ↔ config mapping is established by
// ElevenLabs itself.

import type { Scenario, Persona } from "./scenarios";

export interface SessionConfig {
  scenario: Scenario;
  persona: Persona;
  systemPrompt: string;
  customContext?: string;
  firstMessage?: string;
  llmProvider: "mistral";
  llmModel: string;
  /** API keys provided by the user. */
  mistralApiKey: string;
  elevenLabsApiKey: string;
  /** Voice override (ElevenLabs voice ID). */
  voiceId?: string;
  /** When this entry was created (ms since epoch). */
  createdAt: number;
}

interface Store {
  pending: SessionConfig[];
  active: Map<string, SessionConfig>;
}

const globalKey = "__rehearse_session_store__";

function getStore(): Store {
  const g = globalThis as unknown as Record<string, unknown>;
  if (!g[globalKey]) {
    g[globalKey] = { pending: [], active: new Map<string, SessionConfig>() } as Store;
  }
  return g[globalKey] as Store;
}

const TTL_MS = 1000 * 60 * 30;

function evictExpired(store: Store) {
  const now = Date.now();
  store.pending = store.pending.filter((c) => now - c.createdAt < TTL_MS);
  for (const [key, value] of store.active.entries()) {
    if (now - value.createdAt > TTL_MS) {
      store.active.delete(key);
    }
  }
}

/** Push a session config into the pending queue. */
export function pushPendingConfig(config: SessionConfig) {
  const store = getStore();
  evictExpired(store);
  store.pending.push(config);
}

/** Pop the oldest pending config and bind it to a conversation_id. */
export function bindPendingToConversation(conversationId: string): SessionConfig | undefined {
  const store = getStore();
  evictExpired(store);
  const config = store.pending.shift();
  if (config) {
    store.active.set(conversationId, config);
  }
  return config;
}

/** Look up the config for an active conversation. */
export function getActiveConfig(conversationId: string): SessionConfig | undefined {
  return getStore().active.get(conversationId);
}

/** Drop an active config when the conversation ends. */
export function endConversation(conversationId: string) {
  getStore().active.delete(conversationId);
}

/** Diagnostic: count pending and active configs. */
export function getStoreStats() {
  const store = getStore();
  return { pending: store.pending.length, active: store.active.size };
}
