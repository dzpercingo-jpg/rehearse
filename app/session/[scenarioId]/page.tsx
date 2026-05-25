import { notFound } from "next/navigation";
import { getScenario } from "@/lib/scenarios";
import { PageShell } from "@/components/PageShell";
import { SessionExperience } from "@/components/SessionExperience";

interface Props {
  params: Promise<{ scenarioId: string }>;
}

export default async function SessionPage({ params }: Props) {
  const { scenarioId } = await params;
  const scenario = getScenario(scenarioId);
  if (!scenario) notFound();

  return (
    <PageShell>
      <SessionExperience scenario={scenario} />
    </PageShell>
  );
}
