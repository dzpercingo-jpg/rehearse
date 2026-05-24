// Shared types for our client-side conversation state.

export interface TranscriptEntry {
  id: string;
  role: "user" | "agent";
  content: string;
  /** ms since epoch */
  timestamp: number;
  /** True until the final transcript chunk for this turn arrives. */
  partial?: boolean;
  /** Set when this entry was interrupted (the user spoke over the agent). */
  interrupted?: boolean;
}

export interface SessionSummary {
  scenarioId: string;
  personaId: string;
  startedAt: number;
  endedAt: number;
  transcript: TranscriptEntry[];
  durationMs: number;
}

const STORAGE_KEY = "rehearse.last-session";

export function saveLastSession(summary: SessionSummary) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(summary));
  } catch {
    // ignore quota errors
  }
}

export function loadLastSession(): SessionSummary | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as SessionSummary;
  } catch {
    return null;
  }
}
