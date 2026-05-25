import Link from "next/link";
import type { ReactNode } from "react";

export function PageShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1">{children}</main>
      <SiteFooter />
    </div>
  );
}

function SiteHeader() {
  return (
    <header className="sticky top-0 z-30 border-b border-white/5 backdrop-blur-md bg-black/30">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-4">
        <Link href="/" className="flex items-center gap-2 group">
          <span className="inline-flex h-7 w-7 items-center justify-center rounded-md bg-gradient-to-br from-rose-400 to-amber-400 text-black font-black text-sm shadow-lg shadow-rose-500/20">
            R
          </span>
          <span className="font-semibold tracking-tight text-base">
            Rehearse
          </span>
          <span className="ml-2 hidden sm:inline-block rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-zinc-400">
            ElevenLabs Speech Engine
          </span>
        </Link>
        <nav className="flex items-center gap-2 text-sm">
          <Link
            href="/setup"
            className="rounded-full border border-white/10 px-3 py-1.5 text-zinc-300 hover:text-white hover:border-white/20 transition"
          >
            Setup
          </Link>
          <a
            href="https://github.com/dzpercingo-jpg/rehearse"
            target="_blank"
            rel="noreferrer"
            className="rounded-full border border-white/10 px-3 py-1.5 text-zinc-300 hover:text-white hover:border-white/20 transition"
          >
            GitHub
          </a>
        </nav>
      </div>
    </header>
  );
}

function SiteFooter() {
  return (
    <footer className="border-t border-white/5 py-6">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-6 text-xs text-zinc-500">
        <p>
          Built for{" "}
          <a
            href="https://hacks.elevenlabs.io"
            target="_blank"
            rel="noreferrer"
            className="text-zinc-300 hover:text-white underline-offset-4 hover:underline"
          >
            ElevenHacks #10 · Speech Engine
          </a>
          .
        </p>
        <p className="hidden sm:block">
          BYO-LLM. Your API keys stay in your browser.
        </p>
      </div>
    </footer>
  );
}
