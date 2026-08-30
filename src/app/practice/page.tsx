import type { Metadata } from "next";
import PracticeLab from "@/components/PracticeLab/PracticeLab";

export const metadata: Metadata = {
  title: "Practice Lab · Fret Journey",
  description:
    "Use focused daily guitar routines for scales, alternate picking, string skipping, rhythm, legato, sweep picking, bends, and vibrato.",
};

export default function PracticePage() {
  return <PracticeLab />;
}
