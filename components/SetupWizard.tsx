"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  loadCredentials,
  saveCredentials,
  type StoredCredentials,
} from "@/lib/credentials";

type Step = "elevenlabs" | "mistral" | "ready";

export function SetupWizard() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("elevenlabs");
  const [elevenLabsApiKey, setElevenLabsApiKey] = useState("");
  const [mistralApiKey, setMistralApiKey] = useState("");
  const [engineId, setEngineId] = useState<string | undefined>(undefined);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const stored = loadCredentials();
    if (!stored) return;
    /* eslint-disable react-hooks/set-state-in-effect -- one-shot sync from localStorage on mount */
    setElevenLabsApiKey(stored.elevenLabsApiKey || "");
    setMistralApiKey(stored.mistralApiKey || "");
    setEngineId(stored.engineId);
    if (stored.elevenLabsApiKey && stored.engineId && stored.mistralApiKey) {
      setStep("ready");
    } else if (stored.elevenLabsApiKey && stored.engineId) {
      setStep("mistral");
    }
    /* eslint-enable react-hooks/set-state-in-effect */
  }, []);

  function persist(next: Partial<StoredCredentials>) {
    const merged: StoredCredentials = {
      elevenLabsApiKey,
      mistralApiKey,
      engineId,
      ...next,
    };
    saveCredentials(merged);
  }

  async function verifyElevenLabs() {
    setError(null);
    setBusy(true);
    try {
      const res = await fetch("/api/engine/setup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ elevenLabsApiKey: elevenLabsApiKey.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || "Could not verify your key");
      }
      setEngineId(data.engineId);
      persist({
        elevenLabsApiKey: elevenLabsApiKey.trim(),
        engineId: data.engineId,
        verifiedAt: Date.now(),
      });
      setStep("mistral");
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }

  function saveMistral() {
    setError(null);
    if (mistralApiKey.trim().length < 10) {
      setError("That doesn't look like a valid Mistral key.");
      return;
    }
    persist({ mistralApiKey: mistralApiKey.trim() });
    setStep("ready");
  }

  return (
    <div className="glass-strong rounded-3xl p-6 sm:p-8">
      <Stepper step={step} />

      <div className="mt-8">
        <AnimatePresence mode="wait">
          {step === "elevenlabs" && (
            <motion.div
              key="el"
              initial={false}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25 }}
              className="space-y-4"
            >
              <h2 className="text-xl font-semibold">
                1. Paste your ElevenLabs API key
              </h2>
              <p className="text-sm text-zinc-400">
                We need this to mint conversation tokens and create the Speech
                Engine that powers your voice agent.{" "}
                <a
                  className="text-rose-300 underline-offset-4 hover:underline"
                  href="https://elevenlabs.io/app/settings/api-keys"
                  target="_blank"
                  rel="noreferrer"
                >
                  Get a key →
                </a>
              </p>
              <label className="block">
                <span className="text-xs font-medium uppercase tracking-widest text-zinc-500">
                  ElevenLabs API key
                </span>
                <input
                  type="password"
                  autoComplete="off"
                  className="mt-1.5 w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm font-mono text-white placeholder:text-zinc-600 focus:border-rose-400/50 focus:outline-none focus:ring-2 focus:ring-rose-400/30 transition"
                  placeholder="sk_..."
                  value={elevenLabsApiKey}
                  onChange={(e) => setElevenLabsApiKey(e.target.value)}
                />
              </label>
              {error && <ErrorBanner message={error} />}
              <button
                onClick={verifyElevenLabs}
                disabled={busy || elevenLabsApiKey.trim().length < 10}
                className="w-full rounded-full bg-gradient-to-br from-rose-400 to-amber-400 px-5 py-3 text-sm font-semibold text-black transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {busy ? "Setting up the Speech Engine…" : "Verify & continue →"}
              </button>
              <details className="text-xs text-zinc-500">
                <summary className="cursor-pointer hover:text-zinc-300">
                  How to get your ElevenLabs key (30s)
                </summary>
                <ol className="mt-3 list-decimal space-y-1.5 pl-5 text-zinc-400">
                  <li>
                    Go to{" "}
                    <a
                      className="text-rose-300 hover:underline"
                      href="https://elevenlabs.io/app/settings/api-keys"
                      target="_blank"
                      rel="noreferrer"
                    >
                      elevenlabs.io/app/settings/api-keys
                    </a>
                  </li>
                  <li>Click <em>Create API key</em> · name it &quot;Rehearse&quot;</li>
                  <li>Copy the key (starts with <code className="rounded bg-black/40 px-1 py-0.5">sk_…</code>)</li>
                  <li>Paste it above.</li>
                </ol>
              </details>
            </motion.div>
          )}

          {step === "mistral" && (
            <motion.div
              key="mistral"
              initial={false}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25 }}
              className="space-y-4"
            >
              <h2 className="text-xl font-semibold">
                2. Add your Mistral key
              </h2>
              <p className="text-sm text-zinc-400">
                Your LLM — the brain of the agent. We use{" "}
                <code className="rounded bg-black/40 px-1 py-0.5 text-xs">
                  mistral-small-latest
                </code>{" "}
                by default. Mistral&apos;s free tier covers 1B tokens/month,
                so the whole conversation loop costs nothing.{" "}
                <a
                  className="text-rose-300 underline-offset-4 hover:underline"
                  href="https://console.mistral.ai/api-keys/"
                  target="_blank"
                  rel="noreferrer"
                >
                  Get a free key →
                </a>
              </p>
              <label className="block">
                <span className="text-xs font-medium uppercase tracking-widest text-zinc-500">
                  Mistral API key
                </span>
                <input
                  type="password"
                  autoComplete="off"
                  className="mt-1.5 w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm font-mono text-white placeholder:text-zinc-600 focus:border-rose-400/50 focus:outline-none focus:ring-2 focus:ring-rose-400/30 transition"
                  placeholder="Your Mistral key"
                  value={mistralApiKey}
                  onChange={(e) => setMistralApiKey(e.target.value)}
                />
              </label>
              {error && <ErrorBanner message={error} />}
              <div className="flex flex-col-reverse gap-2 sm:flex-row">
                <button
                  onClick={() => setStep("elevenlabs")}
                  className="rounded-full border border-white/15 px-5 py-3 text-sm text-zinc-300 hover:bg-white/5 transition"
                >
                  Back
                </button>
                <button
                  onClick={saveMistral}
                  disabled={mistralApiKey.trim().length < 10}
                  className="flex-1 rounded-full bg-gradient-to-br from-rose-400 to-amber-400 px-5 py-3 text-sm font-semibold text-black transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Save & continue →
                </button>
              </div>
              <details className="text-xs text-zinc-500">
                <summary className="cursor-pointer hover:text-zinc-300">
                  How to get your Mistral key (45s)
                </summary>
                <ol className="mt-3 list-decimal space-y-1.5 pl-5 text-zinc-400">
                  <li>
                    Sign up at{" "}
                    <a
                      className="text-rose-300 hover:underline"
                      href="https://console.mistral.ai/"
                      target="_blank"
                      rel="noreferrer"
                    >
                      console.mistral.ai
                    </a>{" "}
                    (the free Experiment tier is fine).
                  </li>
                  <li>
                    Go to{" "}
                    <a
                      className="text-rose-300 hover:underline"
                      href="https://console.mistral.ai/api-keys/"
                      target="_blank"
                      rel="noreferrer"
                    >
                      API Keys
                    </a>{" "}
                    → <em>Create new key</em>.
                  </li>
                  <li>Copy the key and paste it above.</li>
                </ol>
              </details>
            </motion.div>
          )}

          {step === "ready" && (
            <motion.div
              key="ready"
              initial={false}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25 }}
              className="space-y-5"
            >
              <div className="rounded-2xl border border-emerald-400/30 bg-emerald-400/5 p-5">
                <div className="flex items-center gap-2 text-emerald-300">
                  <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-emerald-400/20">
                    ✓
                  </span>
                  <span className="text-sm font-semibold">
                    You&apos;re set up.
                  </span>
                </div>
                <p className="mt-2 text-sm text-zinc-300">
                  Speech Engine ID:{" "}
                  <code className="rounded bg-black/40 px-1.5 py-0.5 font-mono text-xs">
                    {engineId}
                  </code>
                </p>
              </div>
              <button
                onClick={() => router.push("/")}
                className="w-full rounded-full bg-gradient-to-br from-rose-400 to-amber-400 px-5 py-3 text-sm font-semibold text-black transition hover:opacity-95"
              >
                Pick a scenario →
              </button>
              <button
                onClick={() => {
                  setStep("elevenlabs");
                  setEngineId(undefined);
                  persist({ engineId: undefined });
                }}
                className="w-full rounded-full border border-white/15 px-5 py-3 text-sm text-zinc-400 hover:bg-white/5 transition"
              >
                Re-link my keys
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function Stepper({ step }: { step: Step }) {
  const steps: { id: Step; label: string }[] = [
    { id: "elevenlabs", label: "ElevenLabs" },
    { id: "mistral", label: "Mistral" },
    { id: "ready", label: "Ready" },
  ];
  const activeIndex = steps.findIndex((s) => s.id === step);
  return (
    <div className="flex items-center gap-3">
      {steps.map((s, i) => {
        const active = i <= activeIndex;
        return (
          <div key={s.id} className="flex items-center gap-3">
            <div
              className={[
                "flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold transition",
                active
                  ? "bg-gradient-to-br from-rose-400 to-amber-400 text-black"
                  : "border border-white/10 bg-white/5 text-zinc-500",
              ].join(" ")}
            >
              {i + 1}
            </div>
            <span
              className={
                active
                  ? "text-sm font-medium text-white"
                  : "text-sm text-zinc-500"
              }
            >
              {s.label}
            </span>
            {i < steps.length - 1 && (
              <div
                className={
                  "h-px w-6 " + (i < activeIndex ? "bg-white/40" : "bg-white/10")
                }
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

function ErrorBanner({ message }: { message: string }) {
  return (
    <div className="rounded-xl border border-rose-400/30 bg-rose-400/5 p-3 text-sm text-rose-200">
      {message}
    </div>
  );
}
