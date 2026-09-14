import { chordVoicingMaximumFret } from "./generateChordVoicings";
import type { PlayableVoicing } from "./types";

export const voicingNeckRegions = [
  { id: "open", label: "Open", order: 0 },
  { id: "frets-1-4", label: "Frets 1–4", order: 1 },
  { id: "frets-5-8", label: "Frets 5–8", order: 2 },
  { id: "frets-9-12", label: "Frets 9–12", order: 3 },
] as const;

export type VoicingNeckRegion = (typeof voicingNeckRegions)[number];
export type VoicingNeckRegionId = VoicingNeckRegion["id"];

export type VoicingLocation = {
  hasOpenString: boolean;
  label: string;
  lastFret: number;
  lowestFrettedFret: number | null;
  region: VoicingNeckRegion;
  signature: PlayableVoicing["signature"];
  voicing: PlayableVoicing;
};

export type VoicingLocationGroup = {
  id: VoicingNeckRegionId;
  label: VoicingNeckRegion["label"];
  locations: VoicingLocation[];
};

const getRegion = (
  hasOpenString: boolean,
  lowestFrettedFret: number | null,
): VoicingNeckRegion => {
  if (hasOpenString) {
    return voicingNeckRegions[0];
  }

  if (lowestFrettedFret === null || lowestFrettedFret < 1) {
    throw new Error("A generated voicing must contain a sounding string");
  }

  if (lowestFrettedFret <= 4) {
    return voicingNeckRegions[1];
  }

  if (lowestFrettedFret <= 8) {
    return voicingNeckRegions[2];
  }

  return voicingNeckRegions[3];
};

const getLocationLabel = (
  hasOpenString: boolean,
  lowestFrettedFret: number | null,
  lastFret: number,
): string => {
  if (lowestFrettedFret === null) {
    return "Open";
  }

  const fretRange =
    lowestFrettedFret === lastFret
      ? `fret ${lowestFrettedFret}`
      : `frets ${lowestFrettedFret}–${lastFret}`;

  if (hasOpenString) {
    return `Open · ${fretRange}`;
  }

  return fretRange[0].toUpperCase() + fretRange.slice(1);
};

export const getVoicingLocation = (
  voicing: PlayableVoicing,
): VoicingLocation => {
  const soundingFrets = voicing.strings.flatMap((string) =>
    string.kind === "muted" ? [] : [string.fret],
  );

  if (soundingFrets.length === 0) {
    throw new Error(
      `Generated voicing ${voicing.signature} has no sounding strings`,
    );
  }

  const lastFret = Math.max(...soundingFrets);

  if (lastFret > chordVoicingMaximumFret) {
    throw new RangeError(
      `Generated voicing ${voicing.signature} exceeds fret ${chordVoicingMaximumFret}`,
    );
  }

  const hasOpenString = soundingFrets.includes(0);
  const frettedFrets = soundingFrets.filter((fret) => fret > 0);
  const lowestFrettedFret =
    frettedFrets.length === 0 ? null : Math.min(...frettedFrets);

  return {
    hasOpenString,
    label: getLocationLabel(hasOpenString, lowestFrettedFret, lastFret),
    lastFret,
    lowestFrettedFret,
    region: getRegion(hasOpenString, lowestFrettedFret),
    signature: voicing.signature,
    voicing,
  };
};

const compareLocations = (
  first: VoicingLocation,
  second: VoicingLocation,
): number =>
  first.region.order - second.region.order ||
  (first.lowestFrettedFret ?? 0) - (second.lowestFrettedFret ?? 0) ||
  first.lastFret - second.lastFret ||
  first.voicing.rank - second.voicing.rank ||
  first.signature.localeCompare(second.signature);

export const groupVoicingsByNeckRegion = (
  voicings: readonly PlayableVoicing[],
): VoicingLocationGroup[] => {
  const locations = voicings.map(getVoicingLocation).sort(compareLocations);

  return voicingNeckRegions.map((region) => ({
    id: region.id,
    label: region.label,
    locations: locations.filter(
      ({ region: locationRegion }) => locationRegion.id === region.id,
    ),
  }));
};
