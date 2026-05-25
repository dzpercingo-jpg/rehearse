import Link from "next/link";
import { SCENARIOS } from "@/lib/scenarios";
import { PageShell } from "@/components/PageShell";
import { ScenarioCard } from "@/components/ScenarioCard";
import { LandingHero } from "@/components/LandingHero";

export default function Home() {
  return (
    <PageShell>
      <LandingHero />

      <section
        id="scenarios"
        className="mx-auto w-full max-w-6xl px-6 pb-24 pt-12"
      >
        <div className="mb-8 flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-end">
          <div>
            <p className="text-xs uppercase tracking-widest text-rose-300/80">
              Pick a scenario
            </p>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight">
              What are you dreading this week?
            </h2>
            <p className="mt-1 max-w-xl text-sm text-zinc-400">
              The AI plays the other side. You practise. Interrupt it, take
              your time, fail safely. Get a critique at the end.
            </p>
          </div>
          <Link
            href="/setup"
            className="rounded-full border border-white/15 px-4 py-2 text-sm text-zinc-200 hover:bg-white/5 transition"
          >
            Connect your keys →
          </Link>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {SCENARIOS.map((scenario, index) => (
            <ScenarioCard
              key={scenario.id}
              scenario={scenario}
              index={index}
              href={`/session/${scenario.id}`}
            />
          ))}
        </div>

        <div className="mt-16 grid gap-4 sm:grid-cols-3">
          <FeatureCard
            title="Real-time voice"
            body="Latency low enough to interrupt — and be interrupted. The AI handles overlap like a real conversation."
          />
          <FeatureCard
            title="Mistral-powered, free"
            body="ministral-8b-latest by default — fast streaming, free tier. Swap to medium/large in lib/llm.ts."
          />
          <FeatureCard
            title="Honest critique"
            body="When you hang up, we score your performance against the scenario's rubric and call out one specific moment."
          />
        </div>
      </section>
    </PageShell>
  );
}

function FeatureCard({ title, body }: { title: string; body: string }) {
  return (
    <div className="glass rounded-2xl p-5">
      <h3 className="text-sm font-semibold tracking-tight text-white">
        {title}
      </h3>
      <p className="mt-2 text-sm leading-relaxed text-zinc-400">{body}</p>
    </div>
  );
}
