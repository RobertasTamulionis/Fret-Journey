import { configureStore } from "@reduxjs/toolkit";
import {
  type TypedUseSelectorHook,
  useDispatch,
  useSelector,
} from "react-redux";
import fretboardReducer from "@/lib/redux/slices/fretboardSlice";
import progressionLabReducer from "@/lib/redux/slices/progressionLabSlice";

export const store = configureStore({
  reducer: {
    fretboard: fretboardReducer,
    progressionLab: progressionLabReducer,
  },
});

// Types
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

// Typed hooks
export const useAppDispatch: () => AppDispatch = useDispatch;
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
