import {
  type AuthoredProgression,
  type AuthoredProgressionStore,
  authoredProgressionSchemaVersion,
} from "./types";
import { isAuthoredProgression } from "./validation";

export const authoredProgressionStorageKey =
  "fret-journey-authored-progressions-v1";

export type ProgressionStorage = Pick<Storage, "getItem" | "setItem">;
export type PersistenceResult =
  | { readonly ok: true }
  | { readonly error: string; readonly ok: false };

export const emptyAuthoredProgressionStore = (): AuthoredProgressionStore => ({
  progressions: [],
  version: authoredProgressionSchemaVersion,
});

export const parseAuthoredProgressionStore = (
  serialized: string | null,
): AuthoredProgressionStore => {
  if (!serialized) return emptyAuthoredProgressionStore();
  try {
    const value: unknown = JSON.parse(serialized);
    if (!value || typeof value !== "object")
      return emptyAuthoredProgressionStore();
    const candidate = value as { progressions?: unknown; version?: unknown };
    if (
      candidate.version !== authoredProgressionSchemaVersion ||
      !Array.isArray(candidate.progressions)
    ) {
      return emptyAuthoredProgressionStore();
    }
    const ids = new Set<string>();
    const progressions = candidate.progressions.filter((progression) => {
      if (!isAuthoredProgression(progression) || ids.has(progression.id)) {
        return false;
      }
      ids.add(progression.id);
      return true;
    });
    return { progressions, version: authoredProgressionSchemaVersion };
  } catch {
    return emptyAuthoredProgressionStore();
  }
};

export const readAuthoredProgressionStore = (
  storage: ProgressionStorage,
): AuthoredProgressionStore => {
  try {
    return parseAuthoredProgressionStore(
      storage.getItem(authoredProgressionStorageKey),
    );
  } catch {
    return emptyAuthoredProgressionStore();
  }
};

export const writeAuthoredProgressionStore = (
  storage: ProgressionStorage,
  store: AuthoredProgressionStore,
): PersistenceResult => {
  try {
    storage.setItem(authoredProgressionStorageKey, JSON.stringify(store));
    return { ok: true };
  } catch {
    return {
      error: "This browser could not save the progression locally.",
      ok: false,
    };
  }
};

export const upsertAuthoredProgression = (
  store: AuthoredProgressionStore,
  progression: AuthoredProgression,
): AuthoredProgressionStore => ({
  progressions: [
    progression,
    ...store.progressions.filter(({ id }) => id !== progression.id),
  ],
  version: authoredProgressionSchemaVersion,
});

export const deleteAuthoredProgression = (
  store: AuthoredProgressionStore,
  id: string,
): AuthoredProgressionStore => ({
  progressions: store.progressions.filter(
    (progression) => progression.id !== id,
  ),
  version: authoredProgressionSchemaVersion,
});
