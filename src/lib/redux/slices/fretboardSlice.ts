import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import {
  getAvailableScaleShapeSystems,
  getDefaultTuning,
  standardTuning,
} from "@/helpers/fretboardHelpers";
import type {
  FretboardDisplayMode,
  GuitarStringCount,
  PitchClass,
  ScaleDegree,
  ScaleName,
  ScaleShapeSystem,
  TonicName,
} from "@/helpers/typesHelpers";

interface FretboardState {
  stringCount: GuitarStringCount;
  fretCount: number;
  currentKey: TonicName;
  currentScale: ScaleName;
  tuning: PitchClass[];
  showShapes: boolean;
  shapeSystem: ScaleShapeSystem;
  activeShape: number;
  displayMode: FretboardDisplayMode;
  selectedChordDegree: ScaleDegree;
}

const initialState: FretboardState = {
  stringCount: 6,
  fretCount: 24,
  currentKey: "A",
  currentScale: "major",
  tuning: standardTuning,
  showShapes: false,
  shapeSystem: "3nps",
  activeShape: 0,
  displayMode: "notes",
  selectedChordDegree: 1,
};

const fretboardSlice = createSlice({
  name: "fretBoard",
  initialState,
  reducers: {
    setKey: (state, action: PayloadAction<TonicName>) => {
      state.currentKey = action.payload;
    },
    setScale: (state, action: PayloadAction<ScaleName>) => {
      state.currentScale = action.payload;
      state.activeShape = 0;
      state.selectedChordDegree = 1;
      const availableShapeSystems = getAvailableScaleShapeSystems(
        action.payload,
      );

      if (!availableShapeSystems.includes(state.shapeSystem)) {
        state.shapeSystem = availableShapeSystems[0];
      }
    },
    setStringCount: (state, action: PayloadAction<GuitarStringCount>) => {
      state.stringCount = action.payload;
      state.tuning = getDefaultTuning(action.payload);
    },
    setTuningNote: (
      state,
      action: PayloadAction<{
        pitchClass: PitchClass;
        tuningNoteIndex: number;
      }>,
    ) => {
      const { pitchClass, tuningNoteIndex } = action.payload;

      if (tuningNoteIndex >= 0 && tuningNoteIndex < state.tuning.length) {
        state.tuning[tuningNoteIndex] = pitchClass;
      }
    },
    setFretNoteCount: (state, action: PayloadAction<number>) => {
      state.fretCount = action.payload;
    },
    setShowShapes: (state, action: PayloadAction<boolean>) => {
      state.showShapes = action.payload;
    },
    setShapeSystem: (state, action: PayloadAction<ScaleShapeSystem>) => {
      state.shapeSystem = action.payload;
      state.activeShape = 0;
    },
    setActiveShape: (state, action: PayloadAction<number>) => {
      state.activeShape = action.payload;
    },
    setDisplayMode: (state, action: PayloadAction<FretboardDisplayMode>) => {
      state.displayMode = action.payload;
    },
    setSelectedChordDegree: (state, action: PayloadAction<ScaleDegree>) => {
      state.selectedChordDegree = action.payload;
      state.displayMode = "chord-tones";
    },
    // TO DO - MAYBE Optional: replace entire tuning at once, keeping it typed
    // setTuning: (state, action: PayloadAction<PitchClass[]>) => {
    //   state.tuning = action.payload;
    // },
  },
});

export const {
  setKey,
  setScale,
  setStringCount,
  setTuningNote,
  setFretNoteCount,
  setShowShapes,
  setShapeSystem,
  setActiveShape,
  setDisplayMode,
  setSelectedChordDegree,
} = fretboardSlice.actions;
export default fretboardSlice.reducer;
