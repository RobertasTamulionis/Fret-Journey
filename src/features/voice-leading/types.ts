import type {
  ResolvedChordTone,
  ResolvedProgressionStep,
} from "@/features/progressions";
import type {
  GuitarStringCount,
  PitchClass,
  RegisteredTuningState,
} from "@/helpers/typesHelpers";

export type VoiceLeadingPolicy = "smooth" | "ascending" | "descending";

export type VoiceLeadingRequest = {
  readonly fretCount: number;
  readonly registeredTuning: RegisteredTuningState;
  readonly steps: readonly ResolvedProgressionStep[];
  readonly stringCount: GuitarStringCount;
};

export type VoiceLeadingCandidate = {
  readonly chordTone: ResolvedChordTone;
  readonly fret: number;
  readonly midi: number;
  readonly pitchClass: PitchClass;
  readonly stringIndex: number;
};

export type VoiceLeadingTarget = VoiceLeadingCandidate & {
  readonly chordName: string;
  readonly explanation: string;
  readonly intervalLabel: string;
  readonly movementSemitones: number | null;
  readonly stepId: string;
  readonly stepIndex: number;
};

export type VoiceLeadingPathway =
  | {
      readonly available: true;
      readonly policy: VoiceLeadingPolicy;
      readonly targets: readonly VoiceLeadingTarget[];
    }
  | {
      readonly available: false;
      readonly policy: VoiceLeadingPolicy;
      readonly reason: "direction-unavailable" | "no-playable-candidates";
    };

export type VoiceLeadingPathwaysResult =
  | {
      readonly available: true;
      readonly candidateCount: number;
      readonly pathways: Readonly<
        Record<VoiceLeadingPolicy, VoiceLeadingPathway>
      >;
    }
  | {
      readonly available: false;
      readonly reason: "unregistered-tuning" | "invalid-request";
    };
