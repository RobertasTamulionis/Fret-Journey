"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import ChordDiagram from "@/components/ChordDiagram/ChordDiagram";
import ImprovisationWorkspace from "@/components/ProgressionWorkspace/ImprovisationWorkspace";
import { buildImprovisationGuidance } from "@/features/improvisation";
import { analyzeProgressionContext } from "@/features/musical-context";
import {
  type AuthoredChordSpec,
  type AuthoredProgression,
  type AuthoredProgressionStep,
  appendAuthoredChord,
  authoredProgressionSchemaVersion,
  maximumAuthoredProgressionSteps,
  moveAuthoredChord,
  readAuthoredProgressionStore,
  removeAuthoredChord,
  replaceAuthoredChord,
  resolveAuthoredChord,
  resolveAuthoredProgression,
  upsertAuthoredProgression,
  validateDraftForSave,
  writeAuthoredProgressionStore,
} from "@/features/progression-builder";
import {
  type ChordFormulaId,
  chordFormulaIds,
  getChordFormula,
  isTonicName,
  type ProgressionForm,
} from "@/features/progressions";
import { generateVoiceLeadingPathways } from "@/features/voice-leading";
import {
  buildResolvedChordVoicingRequest,
  generateChordVoicings,
} from "@/features/voicings";
import { getTuningLabel } from "@/helpers/fretboardHelpers";
import {
  formatNoteName,
  getScaleChords,
  tonicOptions,
} from "@/helpers/musicTheory";
import type { TonicName } from "@/helpers/typesHelpers";
import { setKey, setScale } from "@/lib/redux/slices/fretboardSlice";
import { useAppDispatch, useAppSelector } from "@/lib/redux/store";
import "./progressionBuilder.scss";

const newId = () => crypto.randomUUID();
const isLocalId = (value: string): boolean =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  );
const formulaLabels = chordFormulaIds.map((id) => ({
  id,
  label: getChordFormula(id).displayName,
}));

const getDiatonicFormula = (quality: string): ChordFormulaId => {
  if (quality.includes("diminished")) return "diminished";
  if (quality.includes("minor")) return "minor";
  return "major";
};

export default function ProgressionBuilder() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const searchParams = useSearchParams();
  const requestedId = searchParams.get("id");
  const mode = searchParams.get("mode");
  const {
    currentKey,
    currentScale,
    fretCount,
    registeredTuning,
    stringCount,
    tuning,
  } = useAppSelector((state) => state.fretboard);
  const [id, setId] = useState("");
  const [createdAt, setCreatedAt] = useState("");
  const [name, setName] = useState("");
  const [form, setForm] = useState<ProgressionForm>("loop");
  const [steps, setSteps] = useState<readonly AuthoredProgressionStep[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [root, setRoot] = useState<TonicName>(currentKey);
  const [formulaId, setFormulaId] = useState<ChordFormulaId>("major");
  const [bass, setBass] = useState<TonicName | "">("");
  const [saved, setSaved] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [status, setStatus] = useState("Not saved");
  const [missing, setMissing] = useState(false);
  const [voicingIndex, setVoicingIndex] = useState(0);
  const [savedContext, setSavedContext] = useState({
    scale: currentScale,
    tonic: currentKey,
  });
  const [contextReady, setContextReady] = useState(!requestedId);

  useEffect(() => {
    if (requestedId && !isLocalId(requestedId)) {
      setMissing(true);
      return;
    }
    const store = readAuthoredProgressionStore(window.localStorage);
    const found = requestedId
      ? store.progressions.find((progression) => progression.id === requestedId)
      : undefined;
    if (requestedId && !found) {
      setMissing(true);
      return;
    }
    const now = new Date().toISOString();
    setId(found?.id ?? newId());
    setCreatedAt(found?.createdAt ?? now);
    setName(found?.name ?? "");
    setForm(found?.form ?? "loop");
    setSteps(found?.steps ?? []);
    setSaved(Boolean(found));
    setDirty(false);
    setStatus(found ? "Saved locally" : "Not saved");
    if (found) {
      setSavedContext(found.context);
      setContextReady(false);
      dispatch(setKey(found.context.tonic));
      dispatch(setScale(found.context.scale));
    } else {
      setContextReady(true);
    }
  }, [dispatch, requestedId]);

  useEffect(() => {
    const matchesSavedContext =
      currentKey === savedContext.tonic && currentScale === savedContext.scale;
    if (!contextReady && matchesSavedContext) {
      setContextReady(true);
      return;
    }
    if (contextReady && !matchesSavedContext && id) {
      setDirty(true);
      setSaved(false);
      setStatus("Unsaved analysis context");
    }
  }, [contextReady, currentKey, currentScale, id, savedContext]);

  useEffect(() => {
    const preventLoss = (event: BeforeUnloadEvent) => {
      if (!dirty) return;
      event.preventDefault();
    };
    window.addEventListener("beforeunload", preventLoss);
    return () => window.removeEventListener("beforeunload", preventLoss);
  }, [dirty]);

  const draft = useMemo<AuthoredProgression>(
    () => ({
      context: { scale: currentScale, tonic: currentKey },
      createdAt: createdAt || new Date(0).toISOString(),
      form,
      id: id || "draft",
      name,
      steps,
      updatedAt: new Date(0).toISOString(),
      version: authoredProgressionSchemaVersion,
    }),
    [createdAt, currentKey, currentScale, form, id, name, steps],
  );
  const resolved = useMemo(() => resolveAuthoredProgression(draft), [draft]);
  const safeIndex = Math.min(selectedIndex, Math.max(0, steps.length - 1));
  const selected = resolved.steps[safeIndex];
  const contextAnalysis = useMemo(
    () => analyzeProgressionContext(resolved),
    [resolved],
  );
  const selectedContext = contextAnalysis.steps[safeIndex];
  const chordDraft = useMemo<AuthoredChordSpec>(
    () => ({ ...(bass ? { bass } : {}), formulaId, root }),
    [bass, formulaId, root],
  );
  const chordDraftError = useMemo(() => {
    try {
      resolveAuthoredChord(chordDraft, { currentKey, currentScale });
      return "";
    } catch (error) {
      return error instanceof Error ? error.message : "Invalid chord";
    }
  }, [chordDraft, currentKey, currentScale]);
  const voicings = useMemo(
    () =>
      selected
        ? generateChordVoicings(
            buildResolvedChordVoicingRequest(selected.chord, {
              registeredTuning,
              stringCount,
              tuning,
            }),
          )
        : [],
    [registeredTuning, selected, stringCount, tuning],
  );
  const voiceLeading = useMemo(
    () =>
      generateVoiceLeadingPathways({
        fretCount,
        registeredTuning,
        steps: resolved.steps,
        stringCount,
      }),
    [fretCount, registeredTuning, resolved.steps, stringCount],
  );
  const diatonicChoices = useMemo(
    () => getScaleChords(currentKey, currentScale, "triad"),
    [currentKey, currentScale],
  );

  const edit = (next: readonly AuthoredProgressionStep[]) => {
    setSteps(next);
    setDirty(true);
    setSaved(false);
    setStatus("Unsaved changes");
  };
  const add = (chord: AuthoredChordSpec = chordDraft) => {
    if (steps.length >= maximumAuthoredProgressionSteps) return;
    try {
      resolveAuthoredChord(chord, { currentKey, currentScale });
    } catch {
      return;
    }
    edit(appendAuthoredChord(steps, chord, newId()));
    setSelectedIndex(steps.length);
  };
  const save = () => {
    const issues = validateDraftForSave(draft);
    if (issues.length > 0) {
      setStatus(issues.join(" "));
      return;
    }
    const progression = {
      ...draft,
      name: name.trim() || "Untitled progression",
      updatedAt: new Date().toISOString(),
    };
    const store = upsertAuthoredProgression(
      readAuthoredProgressionStore(window.localStorage),
      progression,
    );
    const result = writeAuthoredProgressionStore(window.localStorage, store);
    if (!result.ok) {
      setStatus(result.error);
      return;
    }
    setName(progression.name);
    setSavedContext(progression.context);
    setSaved(true);
    setDirty(false);
    setStatus("Saved locally");
    router.replace(`/progressions/builder?id=${progression.id}`);
  };

  if (missing) {
    return (
      <section className="progressionBuilder progressionBuilder--empty">
        <h1>Progression not found</h1>
        <p>This local progression is unavailable or was deleted.</p>
        <Link href="/progressions/builder">Create a new progression</Link>
        <Link href="/progressions">Return to Progression Lab</Link>
      </section>
    );
  }

  if (mode === "improv" && saved && resolved.steps.length >= 2) {
    return (
      <ImprovisationWorkspace
        currentKey={currentKey}
        currentScale={currentScale}
        fretCount={fretCount}
        guidance={buildImprovisationGuidance(resolved, safeIndex)}
        onExit={() => router.replace(`/progressions/builder?id=${id}`)}
        onSelectStep={setSelectedIndex}
        progression={resolved}
        tuning={tuning}
      />
    );
  }

  return (
    <section className="progressionBuilder">
      <header className="progressionBuilder__header">
        <div>
          <span>Songwriting workspace</span>
          <h1>Progression Builder</h1>
          <p>
            Choose exact chords. Scale context explains them; it never rewrites
            them.
          </p>
        </div>
        <div className="progressionBuilder__save">
          <span aria-live="polite">{status}</span>
          <button onClick={save} type="button">
            Save locally
          </button>
          <button
            onClick={() => {
              if (!dirty || window.confirm("Discard unsaved changes?")) {
                router.push("/progressions");
              }
            }}
            type="button"
          >
            Done
          </button>
        </div>
      </header>

      <div className="progressionBuilder__settings">
        <label>
          Name
          <input
            maxLength={80}
            onChange={(event) => {
              setName(event.target.value);
              setDirty(true);
              setSaved(false);
              setStatus("Unsaved changes");
            }}
            placeholder="Untitled progression"
            value={name}
          />
        </label>
        <label>
          Form
          <select
            onChange={(event) => {
              setForm(event.target.value as ProgressionForm);
              setDirty(true);
              setSaved(false);
              setStatus("Unsaved changes");
            }}
            value={form}
          >
            <option value="loop">Loop</option>
            <option value="sequence">Sequence</option>
          </select>
        </label>
        <span>
          {currentKey} · {currentScale.replaceAll("-", " ")} analysis context
          <small>
            Changing key or scale changes the harmonic lens. Your chord names
            stay unchanged.
          </small>
        </span>
      </div>

      <div className="progressionBuilder__layout">
        <section
          className="progressionBuilder__editor"
          aria-labelledby="chord-editor-heading"
        >
          <h2 id="chord-editor-heading">Add an exact chord</h2>
          <div className="progressionBuilder__fields">
            <label>
              Root
              <select
                onChange={(event) => setRoot(event.target.value as TonicName)}
                value={root}
              >
                {tonicOptions.map((option) => (
                  <option key={option.name} value={option.name}>
                    {formatNoteName(option.name)}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Quality
              <select
                onChange={(event) =>
                  setFormulaId(event.target.value as ChordFormulaId)
                }
                value={formulaId}
              >
                {formulaLabels.map((formula) => (
                  <option key={formula.id} value={formula.id}>
                    {formula.label}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Bass
              <select
                onChange={(event) =>
                  setBass(event.target.value as TonicName | "")
                }
                value={bass}
              >
                <option value="">Root position</option>
                {tonicOptions
                  .filter((option) => isTonicName(option.name))
                  .map((option) => (
                    <option key={option.name} value={option.name}>
                      {formatNoteName(option.name)}
                    </option>
                  ))}
              </select>
            </label>
          </div>
          {chordDraftError && (
            <p className="progressionBuilder__error">{chordDraftError}</p>
          )}
          <div className="progressionBuilder__actions">
            <button
              disabled={Boolean(chordDraftError) || steps.length >= 8}
              onClick={() => add()}
              type="button"
            >
              Add chord
            </button>
            <button
              disabled={!selected || Boolean(chordDraftError)}
              onClick={() =>
                selected &&
                edit(replaceAuthoredChord(steps, safeIndex, chordDraft))
              }
              type="button"
            >
              Replace selected
            </button>
          </div>
          <h3>Diatonic starting points</h3>
          <div className="progressionBuilder__shortcuts">
            {diatonicChoices.map((chord) => {
              if (!isTonicName(chord.root.name)) return null;
              const choice: AuthoredChordSpec = {
                formulaId: getDiatonicFormula(chord.quality),
                root: chord.root.name,
              };
              return (
                <button
                  key={`${chord.degree}-${chord.root.name}`}
                  onClick={() => add(choice)}
                  type="button"
                >
                  {chord.degree} · {formatNoteName(chord.root.name)}
                </button>
              );
            })}
          </div>
        </section>

        <section
          className="progressionBuilder__sequence"
          aria-labelledby="sequence-heading"
        >
          <div className="progressionBuilder__sectionTitle">
            <h2 id="sequence-heading">Progression</h2>
            <span>{steps.length}/8 chords</span>
          </div>
          {steps.length === 0 ? (
            <p className="progressionBuilder__emptyText">
              Add two or more chords to save and improvise.
            </p>
          ) : (
            <ol>
              {resolved.steps.map((step, index) => (
                <li
                  className={index === safeIndex ? "is-active" : ""}
                  key={step.id}
                >
                  <button
                    onClick={() => {
                      setSelectedIndex(index);
                      setVoicingIndex(0);
                    }}
                    type="button"
                  >
                    <strong>{step.chord.name}</strong>
                    <span>
                      {step.chord.romanNumeral} · {step.chord.harmonicScope}
                    </span>
                  </button>
                  <div>
                    <button
                      aria-label={`Move ${step.chord.name} left`}
                      disabled={index === 0}
                      onClick={() => edit(moveAuthoredChord(steps, index, -1))}
                      type="button"
                    >
                      ←
                    </button>
                    <button
                      aria-label={`Move ${step.chord.name} right`}
                      disabled={index === steps.length - 1}
                      onClick={() => edit(moveAuthoredChord(steps, index, 1))}
                      type="button"
                    >
                      →
                    </button>
                    <button
                      aria-label={`Remove ${step.chord.name}`}
                      onClick={() => edit(removeAuthoredChord(steps, index))}
                      type="button"
                    >
                      ×
                    </button>
                  </div>
                </li>
              ))}
            </ol>
          )}
        </section>

        <aside className="progressionBuilder__analysis">
          <h2>Harmonic feedback</h2>
          {selected && selectedContext ? (
            <>
              <strong>{selected.chord.name}</strong>
              <ul className="progressionBuilder__toneList">
                {selected.chord.tones.map((tone, index) => {
                  const toneContext = selectedContext.chordToneContexts[index];
                  return (
                    <li key={`${tone.name}-${tone.role}`}>
                      <span>
                        {formatNoteName(tone.name)} · {tone.role}
                      </span>
                      <small>
                        {toneContext.scale.inScale
                          ? `Scale ${toneContext.scale.tone?.degreeLabel}`
                          : "Outside scale"}
                      </small>
                    </li>
                  );
                })}
              </ul>
              <p>
                {selected.chord.harmonicScope === "diatonic"
                  ? "All chord tones belong to the selected scale."
                  : "This valid chord adds tones outside the selected scale."}
              </p>
              {selectedContext.previousTransition && (
                <p>
                  From {selectedContext.previousTransition.fromChord.name}: keep{" "}
                  {selectedContext.previousTransition.commonTones
                    .map(({ toneInToChord }) =>
                      formatNoteName(toneInToChord.name),
                    )
                    .join(", ") || "no common tones"}
                  ;{" "}
                  {selectedContext.previousTransition.leavingTones
                    .map(({ name: note }) => formatNoteName(note))
                    .join(", ") || "nothing"}{" "}
                  leaves;{" "}
                  {selectedContext.previousTransition.enteringTones
                    .map(({ name: note }) => formatNoteName(note))
                    .join(", ") || "nothing"}{" "}
                  enters.
                </p>
              )}
              {selectedContext.nextTransition && (
                <p>
                  To {selectedContext.nextTransition.toChord.name}:{" "}
                  {selectedContext.nextTransition.commonTones.length} common
                  tone
                  {selectedContext.nextTransition.commonTones.length === 1
                    ? ""
                    : "s"}
                  .
                </p>
              )}
              <p>{voicings.length} generated compact grips available.</p>
              {voicings.length > 0 && (
                <>
                  <ChordDiagram
                    size="compact"
                    tuningLabel={getTuningLabel(stringCount, registeredTuning)}
                    voicing={
                      voicings[Math.min(voicingIndex, voicings.length - 1)]
                    }
                  />
                  <div className="progressionBuilder__voicingNav">
                    <button
                      disabled={voicingIndex === 0}
                      onClick={() =>
                        setVoicingIndex((index) => Math.max(0, index - 1))
                      }
                      type="button"
                    >
                      Previous grip
                    </button>
                    <button
                      disabled={voicingIndex >= voicings.length - 1}
                      onClick={() =>
                        setVoicingIndex((index) =>
                          Math.min(voicings.length - 1, index + 1),
                        )
                      }
                      type="button"
                    >
                      Next grip
                    </button>
                  </div>
                </>
              )}
              <p>
                {voiceLeading.available
                  ? "Smooth, ascending, and descending melodic pathways available."
                  : "Exact-register voice leading is unavailable because this tuning has no registered octave pitches."}
              </p>
            </>
          ) : (
            <p>Select a chord to inspect its tones and guitar options.</p>
          )}
          <button
            disabled={!saved || steps.length < 2 || dirty}
            onClick={() =>
              router.push(`/progressions/builder?id=${id}&mode=improv`)
            }
            type="button"
          >
            Open Improvisation Mode
          </button>
          {!saved && (
            <small>
              Save the progression before opening Improvisation Mode.
            </small>
          )}
        </aside>
      </div>
    </section>
  );
}
