"use client";

import { usePathname } from "next/navigation";
import AvailableKeys from "@/components/AvailableKeys/AvailableKeys";
import AvailableScales from "@/components/AvailableScales/AvailableScales";
import StringCountSelector from "@/components/StringCountSelector/StringCountSelector";
import Tuning from "@/components/Tuning/Tuning";
import { getTuningLabel } from "@/helpers/fretboardHelpers";
import { useAppSelector } from "@/lib/redux/store";
import "./musicalContextBar.scss";

const supportsMusicalContext = (pathname: string): boolean =>
  pathname === "/" || pathname === "/practice";

export default function MusicalContextBar() {
  const pathname = usePathname();
  const { registeredTuning, stringCount } = useAppSelector(
    (state) => state.fretboard,
  );

  if (!supportsMusicalContext(pathname)) {
    return null;
  }

  return (
    <section aria-label="Musical context" className="musicalContextBar">
      <div className="musicalContextBar__key">
        <AvailableKeys />
      </div>
      <div className="musicalContextBar__secondary">
        <AvailableScales />
        <section
          aria-labelledby="guitar-context-heading"
          className="musicalContextBar__guitar"
        >
          <header>
            <h2 id="guitar-context-heading">Guitar &amp; Tuning</h2>
            <span>{getTuningLabel(stringCount, registeredTuning)}</span>
          </header>
          <div className="musicalContextBar__guitarControls">
            <StringCountSelector showHeading={false} />
            <fieldset className="musicalContextBar__tuning">
              <legend>String tuning</legend>
              <Tuning />
            </fieldset>
          </div>
        </section>
      </div>
    </section>
  );
}
