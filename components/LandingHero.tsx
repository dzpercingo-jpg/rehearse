"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { loadCredentials, hasValidCredentials } from "@/lib/credentials";

export function LandingHero() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-shot sync from localStorage on mount
    setReady(hasValidCredentials(loadCredentials()));
  }, []);

  const ctaHref = ready ? "#scenarios" : "/setup";
  const ctaLabel = ready ? "Pick a scenario" : "Set up in 60 seconds";

  return (
    <section className="relative overflow-hidden">
      <div className="mx-auto flex w-full max-w-6xl flex-col items-center justify-center px-6 pb-12 pt-20 text-center sm:pt-28">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-zinc-300"
        >
          <span className="relative inline-flex h-2 w-2">
            <span className="absolute inset-0 animate-ping rounded-full bg-rose-400/80" />
            <span className="relative inline-block h-2 w-2 rounded-full bg-rose-400" />
          </span>
          Built on ElevenLabs Speech Engine · powered by Mistral
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.05 }}
          className="mt-6 max-w-3xl text-5xl font-semibold leading-[1.05] tracking-tight text-white text-balance sm:text-6xl"
        >
          Rehearse the conversation{" "}
          <span className="bg-gradient-to-br from-rose-300 to-amber-300 bg-clip-text text-transparent">
            before you have it.
          </span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.12 }}
          className="mt-6 max-w-2xl text-lg leading-relaxed text-zinc-300 text-balance"
        >
          Ask your boss for a raise. Push back on your doctor. End a
          relationship without flinching. Voice-AI plays the other side — so
          you can fumble safely, until you don&apos;t.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.18 }}
          className="mt-9 flex flex-col items-center gap-3 sm:flex-row"
        >
          <Link
            href={ctaHref}
            className="group relative inline-flex h-14 items-center justify-center overflow-hidden rounded-full px-8 text-base font-semibold text-black ring-glow transition-transform hover:scale-[1.02] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-400"
          >
            <span className="absolute inset-0 button-shimmer" />
            <span className="relative flex items-center gap-2">
              {ctaLabel}
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="transition-transform group-hover:translate-x-0.5"
              >
                <path d="M5 12h14" />
                <path d="m12 5 7 7-7 7" />
              </svg>
            </span>
          </Link>
          <a
            href="#scenarios"
            className="text-sm text-zinc-400 hover:text-white transition"
          >
            or browse 8 conversations →
          </a>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.32 }}
          className="mt-14 grid w-full max-w-3xl grid-cols-3 gap-3 text-left"
        >
          <Step n="1" title="Plug in two keys" body="ElevenLabs + Mistral. Both free tier. Stored only in your browser." />
          <Step n="2" title="Pick a scenario" body="Choose a persona difficulty: supportive, sharp, or ruthless." />
          <Step n="3" title="Practise. Out loud." body="Speak, interrupt, fail. Get a critique when you hang up." />
        </motion.div>
      </div>
    </section>
  );
}

function Step({ n, title, body }: { n: string; title: string; body: string }) {
  return (
    <div className="glass rounded-2xl p-4">
      <div className="flex items-center gap-2 text-xs text-zinc-400">
        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white/10 text-[10px] font-bold text-white">
          {n}
        </span>
        {title}
      </div>
      <p className="mt-2 text-xs leading-relaxed text-zinc-400">{body}</p>
    </div>
  );
}
