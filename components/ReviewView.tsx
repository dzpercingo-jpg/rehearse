"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { loadCredentials } from "@/lib/credentials";
import { loadLastSession, type SessionSummary } from "@/lib/transcript";
import { getScenario, getPersona } from "@/lib/scenarios";
import { cn } from "@/lib/utils";

interface RubricScore {
  id: string;
  label: string;
  score: number;
  feedback: string;
}

interface Critique {
  overallScore: number;
  headline: string;
  strengths: string[];
  improvements: string[];
  rubric: RubricScore[];
  highlight?: { quote: string; comment: string };
}

export function ReviewView() {
  const [summary, setSummary] = useState<SessionSummary | null>(null);
  const [critique, setCritique] = useState<Critique | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const last = loadLastSession();
    /* eslint-disable react-hooks/set-state-in-effect -- one-shot hydration from localStorage on mount */
    if (!last) {
      setError("No session found.");
      setLoading(false);
      return;
    }
    setSummary(last);
    const creds = loadCredentials();
    if (!creds?.mistralApiKey) {
      setError("Missing Mistral key.");
      setLoading(false);
      return;
    }
    /* eslint-enable react-hooks/set-state-in-effect */
    void fetch("/api/critique", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        scenarioId: last.scenarioId,
        personaId: last.personaId,
        mistralApiKey: creds.mistralApiKey,
        llmModel: "mistral-small-latest",
        transcript: last.transcript.map((t) => ({
          role: t.role,
          content: t.content,
        })),
      }),
    })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data?.error || "Critique failed");
        return data as Critique;
      })
      .then((data) => setCritique(data))
      .catch((e) => setError(e instanceof Error ? e.message : String(e)))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-20">
        <div className="glass-strong rounded-3xl p-10 text-center">
          <div className="inline-block h-10 w-10 animate-spin rounded-full border-2 border-white/10 border-t-rose-400" />
          <p className="mt-5 text-sm text-zinc-300">
            Listening back to what you just said…
          </p>
          <p className="mt-1 text-xs text-zinc-500">
            We&apos;re scoring you against the scenario&apos;s rubric.
          </p>
        </div>
      </div>
    );
  }

  if (error || !summary) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-20">
        <div className="glass-strong rounded-3xl p-10 text-center">
          <p className="text-zinc-300">{error || "Something went wrong."}</p>
          <Link
            href="/"
            className="mt-6 inline-block rounded-full bg-gradient-to-br from-rose-400 to-amber-400 px-5 py-3 text-sm font-semibold text-black"
          >
            Back to scenarios
          </Link>
        </div>
      </div>
    );
  }

  const scenario = getScenario(summary.scenarioId);
  const persona = getPersona(summary.scenarioId, summary.personaId);

  return (
    <div className="mx-auto max-w-4xl px-6 py-12">
      <Link
        href="/"
        className="text-xs text-zinc-500 hover:text-white transition"
      >
        ← all scenarios
      </Link>

      <motion.div
        initial={false}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="mt-4 flex items-start gap-4"
      >
        <div className="text-4xl leading-none">{scenario?.emoji}</div>
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-balance">
            {scenario?.title} · debrief
          </h1>
          <p className="mt-1 text-sm text-zinc-400">
            Vs. {persona?.label}. {formatDuration(summary.durationMs)} ·{" "}
            {summary.transcript.length} turns.
          </p>
        </div>
      </motion.div>

      {critique && (
        <>
          <ScoreHero critique={critique} />

          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            <Card title="What worked" tone="positive">
              <ul className="space-y-2">
                {critique.strengths.map((s, i) => (
                  <li key={i} className="flex gap-2 text-sm text-zinc-200">
                    <span className="text-emerald-300">✓</span>
                    <span>{s}</span>
                  </li>
                ))}
              </ul>
            </Card>
            <Card title="What to try next time" tone="warning">
              <ul className="space-y-2">
                {critique.improvements.map((s, i) => (
                  <li key={i} className="flex gap-2 text-sm text-zinc-200">
                    <span className="text-amber-300">→</span>
                    <span>{s}</span>
                  </li>
                ))}
              </ul>
            </Card>
          </div>

          {critique.highlight && (
            <Card title="One moment" tone="neutral" className="mt-4">
              <blockquote className="border-l-2 border-rose-300/60 pl-4 text-sm italic text-zinc-200">
                “{critique.highlight.quote}”
              </blockquote>
              <p className="mt-2 text-sm text-zinc-400">
                {critique.highlight.comment}
              </p>
            </Card>
          )}

          <div className="mt-6 glass rounded-2xl p-5">
            <h3 className="text-sm font-semibold text-white">Rubric</h3>
            <div className="mt-4 space-y-3">
              {critique.rubric.map((r) => (
                <RubricRow key={r.id} item={r} />
              ))}
            </div>
          </div>
        </>
      )}

      <details className="mt-8 glass rounded-2xl p-5">
        <summary className="cursor-pointer text-sm font-medium text-zinc-300 hover:text-white">
          Show full transcript
        </summary>
        <div className="mt-4 space-y-3">
          {summary.transcript.map((t) => (
            <div
              key={t.id}
              className={cn(
                "rounded-xl p-3 text-sm",
                t.role === "user"
                  ? "bg-rose-400/5 border border-rose-400/20"
                  : "bg-white/5 border border-white/10",
              )}
            >
              <p className="text-[10px] uppercase tracking-widest text-zinc-500">
                {t.role}
              </p>
              <p className="mt-1 text-zinc-200">{t.content}</p>
            </div>
          ))}
        </div>
      </details>

      <div className="mt-10 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <Link
          href="/"
          className="rounded-full border border-white/15 px-5 py-3 text-sm text-zinc-300 text-center hover:bg-white/5"
        >
          Back to scenarios
        </Link>
        <Link
          href={`/session/${summary.scenarioId}`}
          className="rounded-full bg-gradient-to-br from-rose-400 to-amber-400 px-6 py-3 text-sm font-semibold text-black text-center hover:opacity-95"
        >
          Run it again →
        </Link>
      </div>
    </div>
  );
}

function ScoreHero({ critique }: { critique: Critique }) {
  return (
    <motion.div
      initial={false}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.1 }}
      className="mt-8 glass-strong rounded-3xl p-8 flex flex-col items-center text-center sm:flex-row sm:items-center sm:text-left sm:gap-8"
    >
      <ScoreRing score={critique.overallScore} />
      <div className="mt-4 sm:mt-0 sm:flex-1">
        <p className="text-xs uppercase tracking-widest text-rose-300/80">
          Overall
        </p>
        <h2 className="mt-1 text-2xl font-semibold tracking-tight text-balance">
          {critique.headline}
        </h2>
      </div>
    </motion.div>
  );
}

function ScoreRing({ score }: { score: number }) {
  const clamped = Math.max(0, Math.min(100, score));
  const dash = (clamped / 100) * 282.74;
  const color =
    clamped >= 75 ? "#34d399" : clamped >= 50 ? "#fbbf24" : "#fb7185";
  return (
    <div className="relative h-32 w-32">
      <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
        <circle
          cx="50"
          cy="50"
          r="45"
          stroke="rgba(255,255,255,0.08)"
          strokeWidth="8"
          fill="none"
        />
        <motion.circle
          cx="50"
          cy="50"
          r="45"
          stroke={color}
          strokeWidth="8"
          strokeLinecap="round"
          fill="none"
          strokeDasharray="282.74"
          initial={{ strokeDashoffset: 282.74 }}
          animate={{ strokeDashoffset: 282.74 - dash }}
          transition={{ duration: 1.2, ease: "easeOut" }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl font-semibold text-white tabular-nums">
            {clamped}
          </div>
          <div className="text-[10px] uppercase tracking-widest text-zinc-500">
            / 100
          </div>
        </div>
      </div>
    </div>
  );
}

function RubricRow({ item }: { item: RubricScore }) {
  return (
    <div>
      <div className="flex items-center justify-between text-sm">
        <span className="text-zinc-200">{item.label}</span>
        <span className="tabular-nums font-mono text-xs text-zinc-400">
          {item.score}
        </span>
      </div>
      <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-white/5">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${Math.max(0, Math.min(100, item.score))}%` }}
          transition={{ duration: 0.9, ease: "easeOut" }}
          className={cn(
            "h-full rounded-full",
            item.score >= 75
              ? "bg-emerald-400"
              : item.score >= 50
                ? "bg-amber-400"
                : "bg-rose-400",
          )}
        />
      </div>
      <p className="mt-2 text-xs text-zinc-400">{item.feedback}</p>
    </div>
  );
}

function Card({
  title,
  tone,
  className,
  children,
}: {
  title: string;
  tone: "positive" | "warning" | "neutral";
  className?: string;
  children: React.ReactNode;
}) {
  const toneClass = {
    positive: "border-emerald-400/20",
    warning: "border-amber-400/20",
    neutral: "border-white/10",
  }[tone];
  return (
    <div className={cn("glass rounded-2xl p-5 border", toneClass, className)}>
      <p className="text-xs uppercase tracking-widest text-zinc-500">
        {title}
      </p>
      <div className="mt-3">{children}</div>
    </div>
  );
}

function formatDuration(ms: number) {
  const s = Math.round(ms / 1000);
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  const rem = s % 60;
  return `${m}m ${rem.toString().padStart(2, "0")}s`;
}
