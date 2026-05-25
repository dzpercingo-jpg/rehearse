"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useConversation, type ConversationStatus } from "@elevenlabs/react";
import type { Persona, Scenario } from "@/lib/scenarios";
import { loadCredentials } from "@/lib/credentials";
import { saveLastSession, type TranscriptEntry } from "@/lib/transcript";
import { cn } from "@/lib/utils";

interface Props {
  scenario: Scenario;
  persona: Persona;
  customContext?: string;
  onExit: () => void;
}

export function ConversationStage({
  scenario,
  persona,
  customContext,
  onExit,
}: Props) {
  const router = useRouter();
  const [transcript, setTranscript] = useState<TranscriptEntry[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [starting, setStarting] = useState(false);
  const [autoStarted, setAutoStarted] = useState(false);
  const [interruptionCount, setInterruptionCount] = useState(0);
  const startedAtRef = useRef<number>(0);
  const transcriptRef = useRef<TranscriptEntry[]>([]);

  useEffect(() => {
    transcriptRef.current = transcript;
  }, [transcript]);

  const conv = useConversation({
    onConnect: () => {
      startedAtRef.current = Date.now();
    },
    onDisconnect: () => {},
    onMessage: ({ message, role }) => {
      const entry: TranscriptEntry = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        role: role === "user" ? "user" : "agent",
        content: message,
        timestamp: Date.now(),
      };
      setTranscript((prev) => [...prev, entry]);
    },
    onInterruption: () => {
      setInterruptionCount((n) => n + 1);
      setTranscript((prev) => {
        // Mark the most recent agent entry as interrupted for the visual cue.
        const next = [...prev];
        for (let i = next.length - 1; i >= 0; i--) {
          if (next[i].role === "agent") {
            next[i] = { ...next[i], interrupted: true };
            break;
          }
        }
        return next;
      });
    },
    onError: (message) => {
      setError(message);
    },
  });

  const start = useCallback(async () => {
    if (starting || conv.status === "connected" || conv.status === "connecting")
      return;
    setStarting(true);
    setError(null);
    try {
      const creds = loadCredentials();
      if (!creds?.elevenLabsApiKey || !creds.mistralApiKey || !creds.engineId) {
        throw new Error("Missing credentials. Re-run /setup.");
      }
      const res = await fetch("/api/token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scenarioId: scenario.id,
          personaId: persona.id,
          customContext,
          elevenLabsApiKey: creds.elevenLabsApiKey,
          mistralApiKey: creds.mistralApiKey,
          llmModel: "ministral-8b-latest",
          engineId: creds.engineId,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || "Could not mint conversation token");
      }
      conv.startSession({
        conversationToken: data.token,
        connectionType: "webrtc",
        overrides: scenario.firstMessage
          ? { agent: { firstMessage: scenario.firstMessage } }
          : undefined,
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setStarting(false);
    }
  }, [conv, customContext, persona.id, scenario.firstMessage, scenario.id, starting]);

  // Auto-start when the user lands on this view.
  useEffect(() => {
    if (autoStarted) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-shot guard to call start() once
    setAutoStarted(true);
    void start();
  }, [autoStarted, start]);

  const isAgentSpeaking = conv.mode === "speaking";
  const isUserSpeaking = conv.mode === "listening" && conv.status === "connected";
  const connected = conv.status === "connected";

  async function endSession() {
    const finalTranscript = [...transcriptRef.current];
    try {
      conv.endSession();
    } catch {}
    const startedAt = startedAtRef.current || Date.now();
    const endedAt = Date.now();
    saveLastSession({
      scenarioId: scenario.id,
      personaId: persona.id,
      startedAt,
      endedAt,
      durationMs: endedAt - startedAt,
      transcript: finalTranscript,
    });
    router.push("/review");
  }

  const minSpeakingTurns = transcript.filter((t) => t.role === "user").length;
  const canEnd = minSpeakingTurns >= 1;

  return (
    <div className="grid gap-6 lg:grid-cols-[3fr_2fr]">
      <section className="glass-strong rounded-3xl p-8 flex flex-col items-center justify-center min-h-[460px] text-center">
        <StatusBadge status={conv.status} />

        <div className="relative my-6">
          <motion.div
            animate={{
              scale: isAgentSpeaking ? [1, 1.06, 1] : 1,
            }}
            transition={{
              duration: 1.4,
              repeat: isAgentSpeaking ? Infinity : 0,
              ease: "easeInOut",
            }}
            className={cn(
              "relative flex h-44 w-44 items-center justify-center rounded-full text-6xl",
              "bg-gradient-to-br",
              scenario.gradient,
              isAgentSpeaking && "ring-glow",
              isUserSpeaking && "ring-glow-warm",
            )}
          >
            <div className="absolute inset-2 rounded-full bg-black/55" />
            <span className="relative z-10">{scenario.emoji}</span>
            {isAgentSpeaking && (
              <span className="absolute inset-0 rounded-full text-rose-400 pulse-ring pointer-events-none" />
            )}
          </motion.div>
        </div>

        <p className="text-xs uppercase tracking-widest text-zinc-500">
          {persona.label}
        </p>
        <p className="mt-1 text-sm text-zinc-300">{scenario.agentRole}</p>

        <div className="mt-6 flex items-center gap-3 text-xs text-zinc-400">
          <ModeChip
            active={isAgentSpeaking}
            color="rose"
            label="Agent speaking"
          />
          <ModeChip
            active={isUserSpeaking}
            color="amber"
            label="Listening to you"
          />
          {interruptionCount > 0 && (
            <span className="rounded-full border border-rose-400/30 bg-rose-400/10 px-2 py-1 text-rose-200">
              {interruptionCount} interruption{interruptionCount > 1 ? "s" : ""}
            </span>
          )}
        </div>

        {error && (
          <div className="mt-5 rounded-xl border border-rose-400/30 bg-rose-400/5 p-3 text-sm text-rose-200">
            {error}
            <div className="mt-2 flex gap-2">
              <button
                onClick={start}
                className="rounded-full bg-rose-400 px-3 py-1 text-xs font-semibold text-black"
              >
                Try again
              </button>
            </div>
          </div>
        )}

        <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row">
          <button
            onClick={() => {
              try {
                conv.endSession();
              } catch {}
              onExit();
            }}
            className="rounded-full border border-white/15 px-5 py-3 text-sm text-zinc-300 hover:bg-white/5"
          >
            Reset
          </button>
          <button
            onClick={() => conv.setMuted(!conv.isMuted)}
            disabled={!connected}
            className="rounded-full border border-white/15 px-5 py-3 text-sm text-zinc-300 hover:bg-white/5 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {conv.isMuted ? "Unmute" : "Mute"}
          </button>
          <button
            onClick={endSession}
            disabled={!canEnd}
            className="rounded-full bg-gradient-to-br from-rose-400 to-amber-400 px-6 py-3 text-sm font-semibold text-black disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-95"
          >
            End & get critique
          </button>
        </div>
      </section>

      <aside className="glass rounded-3xl p-5 flex flex-col max-h-[640px]">
        <div className="flex items-center justify-between border-b border-white/5 pb-3">
          <h3 className="text-sm font-semibold text-white">Live transcript</h3>
          <span className="text-[10px] uppercase tracking-widest text-zinc-500">
            {transcript.length} turns
          </span>
        </div>
        <div className="mt-3 flex-1 space-y-3 overflow-y-auto pr-1">
          <AnimatePresence initial={false}>
            {transcript.map((entry) => (
              <TranscriptBubble key={entry.id} entry={entry} />
            ))}
          </AnimatePresence>
          {transcript.length === 0 && (
            <div className="rounded-xl border border-dashed border-white/10 p-4 text-center text-xs text-zinc-500">
              Start speaking. Your words and the agent&apos;s will stream in
              here.
            </div>
          )}
        </div>
      </aside>
    </div>
  );
}

function StatusBadge({ status }: { status: ConversationStatus }) {
  const map: Record<ConversationStatus, { label: string; color: string }> = {
    disconnected: { label: "Not connected", color: "bg-zinc-500" },
    connecting: { label: "Connecting…", color: "bg-amber-400" },
    connected: { label: "Live", color: "bg-emerald-400" },
    error: { label: "Connection error", color: "bg-rose-400" },
  };
  const s = map[status];
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-zinc-300">
      <span className={cn("h-1.5 w-1.5 rounded-full", s.color)} />
      {s.label}
    </span>
  );
}

function ModeChip({
  active,
  color,
  label,
}: {
  active: boolean;
  color: "rose" | "amber";
  label: string;
}) {
  return (
    <span
      className={cn(
        "rounded-full border px-2 py-1 transition",
        active
          ? color === "rose"
            ? "border-rose-400/40 bg-rose-400/10 text-rose-100"
            : "border-amber-400/40 bg-amber-400/10 text-amber-100"
          : "border-white/10 bg-white/5 text-zinc-500",
      )}
    >
      {label}
    </span>
  );
}

function TranscriptBubble({ entry }: { entry: TranscriptEntry }) {
  const isUser = entry.role === "user";
  return (
    <motion.div
      initial={false}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.18 }}
      className={cn("flex w-full", isUser ? "justify-end" : "justify-start")}
    >
      <div
        className={cn(
          "max-w-[88%] rounded-2xl px-3.5 py-2 text-sm leading-relaxed",
          isUser
            ? "bg-gradient-to-br from-rose-400/20 to-amber-400/20 border border-rose-400/30 text-zinc-100"
            : "bg-white/5 border border-white/10 text-zinc-200",
          entry.interrupted && "ring-1 ring-rose-300/60",
        )}
      >
        <div className="text-[10px] uppercase tracking-widest text-zinc-500 mb-0.5">
          {isUser ? "you" : "agent"}{entry.interrupted ? " · interrupted" : ""}
        </div>
        {entry.content}
      </div>
    </motion.div>
  );
}
