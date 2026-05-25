// Client-side helpers for storing the user's API keys in localStorage.
//
// IMPORTANT: keys are only stored in the browser. They're sent to our own
// backend on each request (so the server can call ElevenLabs and Mistral on
// the user's behalf), but they're never persisted on the server.

export interface StoredCredentials {
  elevenLabsApiKey: string;
  mistralApiKey: string;
  engineId?: string;
  /** When the user last verified their keys (ms since epoch). */
  verifiedAt?: number;
}

const STORAGE_KEY = "rehearse.credentials";

export function loadCredentials(): StoredCredentials | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as StoredCredentials;
  } catch {
    return null;
  }
}

export function saveCredentials(creds: StoredCredentials) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(creds));
}

export function clearCredentials() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(STORAGE_KEY);
}

export function hasValidCredentials(creds: StoredCredentials | null): boolean {
  return !!(creds && creds.elevenLabsApiKey && creds.mistralApiKey && creds.engineId);
}
