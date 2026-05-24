import { PageShell } from "@/components/PageShell";
import { SetupWizard } from "@/components/SetupWizard";

export default function SetupPage() {
  return (
    <PageShell>
      <div className="mx-auto w-full max-w-2xl px-6 py-16">
        <div className="mb-10">
          <p className="text-xs uppercase tracking-widest text-rose-300/80">
            Setup · two keys, then you&apos;re in
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-balance">
            Connect ElevenLabs and Mistral.
          </h1>
          <p className="mt-2 max-w-lg text-sm text-zinc-400">
            Two free keys. They never leave your browser, except to call our
            backend so it can talk to ElevenLabs and Mistral on your behalf.
            We don&apos;t log them.
          </p>
        </div>
        <SetupWizard />
      </div>
    </PageShell>
  );
}
