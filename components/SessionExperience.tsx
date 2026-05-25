"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ConversationProvider } from "@elevenlabs/react";
import type { Scenario } from "@/lib/scenarios";
import { loadCredentials } from "@/lib/credentials";
import { ConversationStage } from "./ConversationStage";
import { PersonaPicker } from "./PersonaPicker";

type Stage = "configure" | "live";

export function SessionExperience({ scenario }: { scenario: Scenario }) {
  const router = useRouter();
  const [personaId, setPersonaId] = useState(
    scenario.personas.find((p) => p.difficulty === "normal")?.id ??
      scenario.personas[0].id,
  );
  const [customContext, setCustomContext] = useState("");
  const [stage, setStage] = useState<Stage>("configure");
  const [credsReady, setCredsReady] = useState<boolean | null>(null);

  useEffect(() => {
    const c = loadCredentials();
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-shot sync from localStorage on mount
    setCredsReady(
      !!(c && c.elevenLabsApiKey && c.mistralApiKey && c.engineId),
    );
  }, []);

  const persona = useMemo(
    () => scenario.personas.find((p) => p.id === personaId)!,
    [scenario, personaId],
  );

  if (credsReady === false) {
    return (
      <div className="mx-auto max-w-2xl px-6 py-20">
        <div className="glass-strong rounded-3xl p-8">
          <h1 className="text-2xl font-semibold">Connect your keys first</h1>
          <p className="mt-2 text-zinc-400">
            You need an ElevenLabs key and a Mistral key to start a session.
            Both have free tiers. It takes 60 seconds.
          </p>
          <div className="mt-6 flex gap-3">
            <button
              onClick={() => router.push("/setup")}
              className="rounded-full bg-gradient-to-br from-rose-400 to-amber-400 px-5 py-3 text-sm font-semibold text-black"
            >
              Go to setup →
            </button>
            <Link
              href="/"
              className="rounded-full border border-white/15 px-5 py-3 text-sm text-zinc-300 hover:bg-white/5"
            >
              Back home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <ConversationProvider>
      <div className="mx-auto w-full max-w-4xl px-6 py-10">
        <Link
          href="/"
          className="text-xs text-zinc-500 hover:text-white transition"
        >
          ← all scenarios
        </Link>

        <header className="mt-4 flex items-start gap-4">
          <div className="text-4xl leading-none">{scenario.emoji}</div>
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-balance">
              {scenario.title}
            </h1>
            <p className="mt-1 max-w-xl text-sm text-zinc-400">
              {scenario.longDescription}
            </p>
          </div>
        </header>

        <AnimatePresence mode="wait">
          {stage === "configure" && (
            <motion.div
              key="configure"
              initial={false}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25 }}
              className="mt-8 grid gap-6 sm:grid-cols-[2fr_3fr]"
            >
              <section className="glass rounded-2xl p-5">
                <p className="text-xs uppercase tracking-widest text-rose-300/80">
                  You play
                </p>
                <p className="mt-1 text-sm text-zinc-200">
                  {scenario.userRole}
                </p>
                <p className="mt-4 text-xs uppercase tracking-widest text-rose-300/80">
                  AI plays
                </p>
                <p className="mt-1 text-sm text-zinc-200">
                  {scenario.agentRole}
                </p>
                <div className="mt-6 border-t border-white/5 pt-5">
                  <p className="text-xs uppercase tracking-widest text-zinc-500">
                    Pro tips
                  </p>
                  <ul className="mt-3 space-y-2 text-sm text-zinc-300">
                    {scenario.tips.map((t, i) => (
                      <li key={i} className="flex gap-2">
                        <span className="text-rose-300">·</span>
                        <span>{t}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </section>

              <section className="glass rounded-2xl p-5">
                <p className="text-xs uppercase tracking-widest text-rose-300/80">
                  Pick the persona
                </p>
                <p className="mt-1 text-sm text-zinc-300">
                  How hard do you want the AI to push?
                </p>
                <div className="mt-4">
                  <PersonaPicker
                    personas={scenario.personas}
                    selected={personaId}
                    onSelect={setPersonaId}
                  />
                </div>

                {scenario.id === "custom" && (
                  <div className="mt-5">
                    <label className="block">
                      <span className="text-xs font-medium uppercase tracking-widest text-zinc-500">
                        Describe the conversation
                      </span>
                      <textarea
                        rows={4}
                        value={customContext}
                        onChange={(e) => setCustomContext(e.target.value)}
                        placeholder="The AI plays my brother. We're discussing our parents' care. He thinks we should keep them at home, I think we need to consider assisted living…"
                        className="mt-1.5 w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white placeholder:text-zinc-600 focus:border-rose-400/50 focus:outline-none focus:ring-2 focus:ring-rose-400/30"
                      />
                    </label>
                  </div>
                )}

                <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row">
                  <Link
                    href="/"
                    className="rounded-full border border-white/15 px-5 py-3 text-sm text-zinc-300 text-center hover:bg-white/5"
                  >
                    Cancel
                  </Link>
                  <button
                    onClick={() => setStage("live")}
                    disabled={
                      scenario.id === "custom" && customContext.trim().length < 10
                    }
                    className="flex-1 rounded-full bg-gradient-to-br from-rose-400 to-amber-400 px-5 py-3 text-sm font-semibold text-black hover:opacity-95 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    Start the conversation →
                  </button>
                </div>
              </section>
            </motion.div>
          )}

          {stage === "live" && (
            <motion.div
              key="live"
              initial={false}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="mt-6"
            >
              <ConversationStage
                scenario={scenario}
                persona={persona}
                customContext={
                  scenario.id === "custom" ? customContext : undefined
                }
                onExit={() => setStage("configure")}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </ConversationProvider>
  );
}
