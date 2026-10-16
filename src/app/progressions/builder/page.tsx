import type { Metadata } from "next";
import ProgressionBuilder from "@/components/ProgressionBuilder/ProgressionBuilder";

export const metadata: Metadata = {
  title: "Progression Builder · Fret Journey",
  description: "Author an exact chord progression and explore it on guitar.",
};

export default function ProgressionBuilderPage() {
  return <ProgressionBuilder />;
}
