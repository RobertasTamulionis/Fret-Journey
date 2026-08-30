import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import ProgressionWorkspace from "@/components/ProgressionWorkspace/ProgressionWorkspace";
import { getProgressionBySlug } from "@/data/progressionCatalog";

type ProgressionDetailPageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({
  params,
}: ProgressionDetailPageProps): Promise<Metadata> {
  const { slug } = await params;
  const progression = getProgressionBySlug(slug);

  if (!progression) {
    return { title: "Progression not found · Fret Journey" };
  }

  return {
    description: progression.explanation,
    title: `${progression.title} · Progression Lab`,
  };
}

export default async function ProgressionDetailPage({
  params,
}: ProgressionDetailPageProps) {
  const { slug } = await params;
  const progression = getProgressionBySlug(slug);

  if (!progression) {
    notFound();
  }

  return (
    <Suspense
      fallback={
        <div aria-live="polite" className="progressionWorkspace__loading">
          Resolving progression context…
        </div>
      }
    >
      <ProgressionWorkspace key={progression.slug} progression={progression} />
    </Suspense>
  );
}
