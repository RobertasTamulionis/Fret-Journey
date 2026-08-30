import type { Metadata } from "next";
import ProgressionLibrary from "@/components/ProgressionLibrary/ProgressionLibrary";

export const metadata: Metadata = {
  title: "Progression Lab · Fret Journey",
  description:
    "Browse sourced, transposable chord progressions and inspect their harmony on guitar.",
};

export default function ProgressionsPage() {
  return <ProgressionLibrary />;
}
