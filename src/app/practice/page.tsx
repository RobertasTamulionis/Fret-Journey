import type { Metadata } from "next";
import PracticeLab from "@/components/PracticeLab/PracticeLab";

export const metadata: Metadata = {
  title: "Practice Lab · Fret Journey",
  description:
    "Use focused daily guitar routines for scales, alternate picking, string skipping, rhythm, legato, sweep picking, bends, and vibrato.",
};

type PracticePageProps = {
  searchParams: Promise<{
    exercise?: string | string[];
    journey?: string | string[];
  }>;
};

export default async function PracticePage({
  searchParams,
}: PracticePageProps) {
  const { exercise, journey } = await searchParams;

  return (
    <PracticeLab
      exerciseId={typeof exercise === "string" ? exercise : undefined}
      journeyId={typeof journey === "string" ? journey : undefined}
    />
  );
}
