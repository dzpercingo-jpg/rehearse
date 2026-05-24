"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import type { Scenario } from "@/lib/scenarios";
import { cn } from "@/lib/utils";

export function ScenarioCard({
  scenario,
  index,
  href,
}: {
  scenario: Scenario;
  index: number;
  href: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.04 * index, duration: 0.4, ease: "easeOut" }}
      whileHover={{ y: -3 }}
      className="group"
    >
      <Link
        href={href}
        className="block h-full focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-400 rounded-2xl"
      >
        <div
          className={cn(
            "relative h-full overflow-hidden rounded-2xl border border-white/10 p-5 transition-all",
            "bg-gradient-to-br",
            scenario.gradient,
            "group-hover:border-white/25 group-hover:shadow-2xl group-hover:shadow-black/40",
          )}
        >
          <div className="absolute inset-0 bg-black/55 transition-opacity group-hover:bg-black/45" />
          <div className="relative z-10 flex h-full flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-2xl leading-none">{scenario.emoji}</span>
              <span className="text-[10px] uppercase tracking-widest text-zinc-400">
                {scenario.personas.length} modes
              </span>
            </div>
            <h3 className="text-lg font-semibold leading-tight tracking-tight text-white text-balance">
              {scenario.title}
            </h3>
            <p className="text-sm leading-relaxed text-zinc-300 text-balance">
              {scenario.blurb}
            </p>
            <div className="mt-auto flex items-center gap-2 pt-3 text-xs text-zinc-400">
              <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5">
                AI plays: {scenario.agentRole}
              </span>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
