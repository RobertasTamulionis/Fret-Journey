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
export type ProgressionSort = "recommended" | "shortest" | "alphabetical";
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
  selectedVoicingSignature: string | null;
  sort: ProgressionSort;
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
  selectedVoicingSignature: null,
  sort: "recommended",
  style: "all",
  visualizationMode: "selected-voicing",
};

const progressionLabSlice = createSlice({
  name: "progressionLab",
  initialState,
  reducers: {
    resetProgressionDetail: (state) => {
      state.activeStepIndex = 0;
      state.selectedVoicingSignature = null;
      state.visualizationMode = "selected-voicing";
    },
    resetProgressionFilters: (state) => {
      state.category = initialState.category;
      state.chordCount = initialState.chordCount;
      state.compatibility = initialState.compatibility;
      state.device = initialState.device;
      state.difficulty = initialState.difficulty;
      state.harmonicScope = initialState.harmonicScope;
      state.mood = initialState.mood;
      state.search = initialState.search;
      state.sort = initialState.sort;
      state.style = initialState.style;
    },
    setProgressionActiveStep: (state, action: PayloadAction<number>) => {
      if (Number.isInteger(action.payload) && action.payload >= 0) {
        state.activeStepIndex = action.payload;
        state.selectedVoicingSignature = null;
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
    setProgressionSort: (state, action: PayloadAction<ProgressionSort>) => {
      state.sort = action.payload;
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
      action: PayloadAction<string | null>,
    ) => {
      state.selectedVoicingSignature = action.payload;
    },
  },
});

export const {
  resetProgressionDetail,
  resetProgressionFilters,
  setProgressionActiveStep,
  setProgressionCategory,
  setProgressionChordCount,
  setProgressionCompatibility,
  setProgressionDevice,
  setProgressionDifficulty,
  setProgressionHarmonicScope,
  setProgressionMood,
  setProgressionSearch,
  setProgressionSort,
  setProgressionStyle,
  setProgressionVisualizationMode,
  setSelectedVoicingSignature,
} = progressionLabSlice.actions;

export default progressionLabSlice.reducer;
