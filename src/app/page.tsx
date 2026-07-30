"use client";
import { useState } from "react";
import Fretboard from "@/components/Fretboard/Fretboard";

export default function Home() {
  const [nrArr, setNrArr] = useState<number[]>([1, 2, 3, 4, 5, 2, 5, 6, 7]);
  return (
    <section>
      <Fretboard />
    </section>
  );
}
