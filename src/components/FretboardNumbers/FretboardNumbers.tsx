'use client';
import React, { ReactElement } from "react";
import { useAppSelector } from "@/lib/redux/store";

export default function FretboardNumbers(): ReactElement {
  const fretCount = useAppSelector(state => state.fretboard.fretCount);

  const renderFretboardNumbers = (): ReactElement => {
    const fretboardNumbers: ReactElement[] = [];
    for (let i = 1; i <= fretCount; i++) {
      fretboardNumbers.push(
        <div className="fretboard__number" key={i}>
          {i}
        </div>
      );
    }
    return <div className="fretboard__numbers">{fretboardNumbers}</div>;
  };

  return renderFretboardNumbers();
}