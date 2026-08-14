import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import {
  getAvailableScaleShapeSystems,
  getDefaultTuning,
  getScaleShapeSystem,
  standardTuning,
} from "@/helpers/fretboardHelpers";
import type {
  FretboardDisplayMode,
  GuitarStringCount,
  PitchClass,
  ScaleChordSize,
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
  chordSize: ScaleChordSize;
  selectedChordDegree: ScaleDegree;
}

const reconcileShapeSystem = (state: FretboardState) => {
  const availableShapeSystems = getAvailableScaleShapeSystems(
    state.currentScale,
    state.tuning,
    state.currentKey,
    state.fretCount,
  );

  if (!availableShapeSystems.includes(state.shapeSystem)) {
    state.shapeSystem = availableShapeSystems[0];
    state.activeShape = 0;
    state.showShapes = false;
  }
};

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
  chordSize: "triad",
  selectedChordDegree: 1,
};

const fretboardSlice = createSlice({
  name: "fretBoard",
  initialState,
  reducers: {
    setKey: (state, action: PayloadAction<TonicName>) => {
      state.currentKey = action.payload;
      reconcileShapeSystem(state);
    },
    setScale: (state, action: PayloadAction<ScaleName>) => {
      state.currentScale = action.payload;
      state.activeShape = 0;
      state.selectedChordDegree = 1;
      reconcileShapeSystem(state);
    },
    setStringCount: (state, action: PayloadAction<GuitarStringCount>) => {
      state.stringCount = action.payload;
      state.tuning = getDefaultTuning(action.payload);
      reconcileShapeSystem(state);
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
        reconcileShapeSystem(state);
      }
    },
    setFretNoteCount: (state, action: PayloadAction<number>) => {
      state.fretCount = action.payload;
      reconcileShapeSystem(state);
    },
    toggleShapeSystem: (state, action: PayloadAction<ScaleShapeSystem>) => {
      const availableShapeSystems = getAvailableScaleShapeSystems(
        state.currentScale,
        state.tuning,
        state.currentKey,
        state.fretCount,
      );

      if (!availableShapeSystems.includes(action.payload)) {
        return;
      }

      const isOpenSystem =
        state.showShapes && state.shapeSystem === action.payload;

      if (isOpenSystem) {
        state.showShapes = false;
        return;
      }

      if (state.shapeSystem !== action.payload) {
        state.shapeSystem = action.payload;
        state.activeShape = 0;
      }

      state.showShapes = true;
    },
    setActiveShape: (state, action: PayloadAction<number>) => {
      const shapeCount = getScaleShapeSystem(
        state.shapeSystem,
        state.currentScale,
      ).shapes.length;

      if (
        Number.isInteger(action.payload) &&
        action.payload >= 0 &&
        action.payload < shapeCount
      ) {
        state.activeShape = action.payload;
      }
    },
    setDisplayMode: (state, action: PayloadAction<FretboardDisplayMode>) => {
      state.displayMode = action.payload;
    },
    setChordSize: (state, action: PayloadAction<ScaleChordSize>) => {
      state.chordSize = action.payload;
      state.displayMode = "chord-tones";
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
  toggleShapeSystem,
  setActiveShape,
  setDisplayMode,
  setChordSize,
  setSelectedChordDegree,
} = fretboardSlice.actions;
export default fretboardSlice.reducer;
