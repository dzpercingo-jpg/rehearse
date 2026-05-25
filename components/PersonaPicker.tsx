"use client";

import { cn } from "@/lib/utils";
import type { Persona } from "@/lib/scenarios";

const DIFFICULTY_LABEL: Record<Persona["difficulty"], string> = {
  easy: "Soft mode",
  normal: "Default",
  hardcore: "Hardcore",
};

const DIFFICULTY_DOT: Record<Persona["difficulty"], string> = {
  easy: "bg-emerald-400",
  normal: "bg-amber-400",
  hardcore: "bg-rose-400",
};

export function PersonaPicker({
  personas,
  selected,
  onSelect,
}: {
  personas: Persona[];
  selected: string;
  onSelect: (id: string) => void;
}) {
  return (
    <div className="space-y-2">
      {personas.map((p) => {
        const active = p.id === selected;
        return (
          <button
            key={p.id}
            onClick={() => onSelect(p.id)}
            className={cn(
              "w-full rounded-xl border px-4 py-3 text-left transition",
              active
                ? "border-rose-400/60 bg-rose-400/5 ring-1 ring-rose-400/40"
                : "border-white/10 bg-white/5 hover:border-white/20",
            )}
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-white">{p.label}</span>
              <span className="flex items-center gap-1.5 text-[10px] uppercase tracking-widest text-zinc-400">
                <span
                  className={cn(
                    "inline-block h-1.5 w-1.5 rounded-full",
                    DIFFICULTY_DOT[p.difficulty],
                  )}
                />
                {DIFFICULTY_LABEL[p.difficulty]}
              </span>
            </div>
            <p className="mt-1 text-xs text-zinc-400">{p.description}</p>
          </button>
        );
      })}
    </div>
  );
}
