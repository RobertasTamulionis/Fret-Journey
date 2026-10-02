import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

export type ProgressionCompatibilityFilter =
  | "all"
  | "compatible"
  | "incompatible";
export type ProgressionChordCountFilter = "all" | "2-3" | "4" | "5-8";
export type ProgressionHarmonicScopeFilter =
  | "all"
  | "diatonic"
  | "borrowed-chromatic";
export type ProgressionDifficultyFilter =
  | "all"
  | "beginner"
  | "intermediate"
  | "advanced";
export type ProgressionVisualizationMode =
  | "selected-voicing"
  | "all-chord-tones";

export type ProgressionLabState = {
  activeStepIndex: number;
  category: string;
  chordCount: ProgressionChordCountFilter;
  compatibility: ProgressionCompatibilityFilter;
  device: string;
  difficulty: ProgressionDifficultyFilter;
  harmonicScope: ProgressionHarmonicScopeFilter;
  mood: string;
  search: string;
  selectedVoicingSignaturesByStepId: Record<string, string>;
  style: string;
  visualizationMode: ProgressionVisualizationMode;
};

const initialState: ProgressionLabState = {
  activeStepIndex: 0,
  category: "all",
  chordCount: "all",
  compatibility: "all",
  device: "all",
  difficulty: "all",
  harmonicScope: "all",
  mood: "all",
  search: "",
  selectedVoicingSignaturesByStepId: {},
  style: "all",
  visualizationMode: "selected-voicing",
};

const progressionLabSlice = createSlice({
  name: "progressionLab",
  initialState,
  reducers: {
    resetProgressionDetail: (state) => {
      state.activeStepIndex = 0;
      state.selectedVoicingSignaturesByStepId = {};
      state.visualizationMode = "selected-voicing";
    },
    setProgressionActiveStep: (state, action: PayloadAction<number>) => {
      if (Number.isInteger(action.payload) && action.payload >= 0) {
        state.activeStepIndex = action.payload;
      }
    },
    setProgressionCategory: (state, action: PayloadAction<string>) => {
      state.category = action.payload;
    },
    setProgressionChordCount: (
      state,
      action: PayloadAction<ProgressionChordCountFilter>,
    ) => {
      state.chordCount = action.payload;
    },
    setProgressionCompatibility: (
      state,
      action: PayloadAction<ProgressionCompatibilityFilter>,
    ) => {
      state.compatibility = action.payload;
    },
    setProgressionDevice: (state, action: PayloadAction<string>) => {
      state.device = action.payload;
    },
    setProgressionDifficulty: (
      state,
      action: PayloadAction<ProgressionDifficultyFilter>,
    ) => {
      state.difficulty = action.payload;
    },
    setProgressionHarmonicScope: (
      state,
      action: PayloadAction<ProgressionHarmonicScopeFilter>,
    ) => {
      state.harmonicScope = action.payload;
    },
    setProgressionMood: (state, action: PayloadAction<string>) => {
      state.mood = action.payload;
    },
    setProgressionSearch: (state, action: PayloadAction<string>) => {
      state.search = action.payload;
    },
    setProgressionStyle: (state, action: PayloadAction<string>) => {
      state.style = action.payload;
    },
    setProgressionVisualizationMode: (
      state,
      action: PayloadAction<ProgressionVisualizationMode>,
    ) => {
      state.visualizationMode = action.payload;
    },
    setSelectedVoicingSignature: (
      state,
      action: PayloadAction<{
        signature: string | null;
        stepId: string;
      }>,
    ) => {
      const { signature, stepId } = action.payload;

      if (stepId.length === 0) {
        return;
      }

      if (signature === null) {
        delete state.selectedVoicingSignaturesByStepId[stepId];
        return;
      }

      state.selectedVoicingSignaturesByStepId[stepId] = signature;
    },
  },
});

export const {
  resetProgressionDetail,
  setProgressionActiveStep,
  setProgressionCategory,
  setProgressionChordCount,
  setProgressionCompatibility,
  setProgressionDevice,
  setProgressionDifficulty,
  setProgressionHarmonicScope,
  setProgressionMood,
  setProgressionSearch,
  setProgressionStyle,
  setProgressionVisualizationMode,
  setSelectedVoicingSignature,
} = progressionLabSlice.actions;

export default progressionLabSlice.reducer;
