import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ArrowRight, Check, Loader2, Save, Sparkles } from "lucide-react";
import type { FilmProject, NavSection } from "../types/frameforge";
import { useDebouncedAutoSave } from "../hooks/useDebouncedAutoSave";
import {
  AUTO_SAVE_DELAY_MS,
  getStoryDraftSignature,
  type StoryDraftFields,
} from "../utils/autoSave";
import { computeScreenplayStats } from "../utils/projectHelpers";

interface StoryArchitectViewProps {
  project: FilmProject;
  onUpdateProject: (updater: (prev: FilmProject) => FilmProject) => void;
  onNavigate: (nav: NavSection) => void;
}

const GENRES = [
  "Sci-Fi Thriller",
  "Neo-Noir Crime",
  "Psychological Drama",
  "Mystery",
  "Indie Coming-of-Age",
  "Horror",
  "Action / Suspense",
];

function buildDraftFromProject(project: FilmProject): StoryDraftFields {
  return {
    storyInput: {
      idea: project.storyInput.idea,
      genre: project.storyInput.genre || GENRES[0],
      duration: project.storyInput.duration || "6 minutes",
      tone: project.storyInput.tone || "Cinematic & Tense",
    },
    title: project.title,
    synopsis: project.synopsis,
    mainConflict: project.mainConflict,
    screenplay: project.screenplay,
  };
}

function serializeStoryDraft(draft: StoryDraftFields): string {
  return getStoryDraftSignature({
    ...draft,
    title: draft.title.trim() ? draft.title : "Untitled Film Project",
  });
}

export default function StoryArchitectView({
  project,
  onUpdateProject,
  onNavigate,
}: StoryArchitectViewProps) {
  const [idea, setIdea] = useState(project.storyInput.idea);
  const [genre, setGenre] = useState(project.storyInput.genre || GENRES[0]);
  const [duration, setDuration] = useState(project.storyInput.duration || "6 minutes");
  const [tone, setTone] = useState(project.storyInput.tone || "Cinematic & Tense");

  const [title, setTitle] = useState(project.title);
  const [synopsis, setSynopsis] = useState(project.synopsis);
  const [mainConflict, setMainConflict] = useState(project.mainConflict);
  const [script, setScript] = useState(project.screenplay);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedFeedback, setSavedFeedback] = useState(false);

  const prevProjectIdRef = useRef(project.id);
  const feedbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const currentDraft = useMemo<StoryDraftFields>(
    () => ({
      storyInput: { idea, genre, duration, tone },
      title,
      synopsis,
      mainConflict,
      screenplay: script,
    }),
    [idea, genre, duration, tone, title, synopsis, mainConflict, script]
  );

  const scriptStats = useMemo(() => computeScreenplayStats(script), [script]);

  const triggerSavedFeedback = useCallback(() => {
    if (feedbackTimerRef.current !== null) {
      clearTimeout(feedbackTimerRef.current);
    }
    setSavedFeedback(true);
    feedbackTimerRef.current = setTimeout(() => {
      setSavedFeedback(false);
    }, 2000);
  }, []);

  const handleAutoSaveDraft = useCallback(
    (draft: StoryDraftFields) => {
      const safeTitle = draft.title.trim() ? draft.title : "Untitled Film Project";
      onUpdateProject((prev) => ({
        ...prev,
        storyInput: draft.storyInput,
        title: safeTitle,
        synopsis: draft.synopsis,
        mainConflict: draft.mainConflict,
        screenplay: draft.screenplay,
      }));
      triggerSavedFeedback();
    },
    [onUpdateProject, triggerSavedFeedback]
  );

  const { saveNow, cancel, markCommitted, isCommitted } = useDebouncedAutoSave({
    value: currentDraft,
    resetKey: project.id,
    serialize: serializeStoryDraft,
    onSave: handleAutoSaveDraft,
    delayMs: AUTO_SAVE_DELAY_MS,
    enabled: !loading,
  });

  useEffect(() => {
    return () => {
      if (feedbackTimerRef.current !== null) {
        clearTimeout(feedbackTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const incomingDraft = buildDraftFromProject(project);
    const switchedProject = prevProjectIdRef.current !== project.id;

    if (switchedProject || !isCommitted(incomingDraft)) {
      cancel();
      prevProjectIdRef.current = project.id;
      markCommitted(incomingDraft);
      setIdea(incomingDraft.storyInput.idea);
      setGenre(incomingDraft.storyInput.genre);
      setDuration(incomingDraft.storyInput.duration);
      setTone(incomingDraft.storyInput.tone);
      setTitle(incomingDraft.title);
      setSynopsis(incomingDraft.synopsis);
      setMainConflict(incomingDraft.mainConflict);
      setScript(incomingDraft.screenplay);
    }
  }, [project, cancel, isCommitted, markCommitted]);

  async function handleGenerate(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!idea.trim()) {
      setError("Please enter a story idea before generating.");
      return;
    }

    cancel();
    setLoading(true);
    try {
      const res = await fetch("/api/story", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idea, genre, duration, tone }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to generate story and screenplay.");
      }

      const generatedDraft: StoryDraftFields = {
        storyInput: { idea, genre, duration, tone },
        title: data.title,
        synopsis: data.synopsis,
        mainConflict: data.mainConflict,
        screenplay: data.screenplay,
      };
      markCommitted(generatedDraft);

      setTitle(data.title);
      setSynopsis(data.synopsis);
      setMainConflict(data.mainConflict);
      setScript(data.screenplay);

      onUpdateProject((prev) => ({
        ...prev,
        isDemo: false,
        storyInput: { idea, genre, duration, tone },
        title: data.title,
        synopsis: data.synopsis,
        mainConflict: data.mainConflict,
        characterNames: data.characterNames ?? [],
        numberedSceneSummaries: data.numberedSceneSummaries ?? [],
        screenplay: data.screenplay,
      }));
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to call Story Architect API."
      );
    } finally {
      setLoading(false);
    }
  }

  function handleSaveEdits() {
    const didSave = saveNow();
    if (!didSave) {
      triggerSavedFeedback();
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Story Architect</h1>
          <p className="mt-1 text-sm text-zinc-400">
            Turn a story concept into a title, synopsis, conflict arc, scene list, and
            editable screenplay.
          </p>
        </div>

        {script.trim().length > 0 && (
          <button
            type="button"
            onClick={() => onNavigate("characters")}
            className="inline-flex items-center gap-2 self-start rounded-lg border border-blue-500/40 bg-blue-600/15 px-4 py-2 text-xs font-semibold text-blue-300 hover:bg-blue-600/25 transition-colors whitespace-nowrap shrink-0"
          >
            Next: Character Intelligence
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {error && (
        <div
          role="alert"
          className="rounded-lg border border-rose-500/40 bg-rose-500/10 px-4 py-3 text-sm text-rose-200"
        >
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-12 items-start">
        {/* Story Brief Form */}
        <form
          onSubmit={handleGenerate}
          noValidate
          className="xl:col-span-5 space-y-4 rounded-xl border border-white/10 bg-[#10121b] p-6"
        >
          <h2 className="text-base font-semibold text-white">1. Story Concept Brief</h2>

          <div>
            <label
              htmlFor="story-idea-input"
              className="block text-xs font-medium text-zinc-300 mb-1.5"
            >
              Story Idea
            </label>
            <textarea
              id="story-idea-input"
              rows={5}
              value={idea}
              onChange={(e) => setIdea(e.target.value)}
              placeholder="e.g., A deaf sound designer restoring vintage reel-to-reel tapes discovers a hidden confession recorded inside an abandoned cinema..."
              className="w-full rounded-lg border border-white/10 bg-[#08090f] px-3.5 py-2.5 text-sm text-white placeholder-zinc-500 focus:border-violet-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="story-genre-select"
                className="block text-xs font-medium text-zinc-300 mb-1.5"
              >
                Genre
              </label>
              <select
                id="story-genre-select"
                value={genre}
                onChange={(e) => setGenre(e.target.value)}
                className="w-full rounded-lg border border-white/10 bg-[#08090f] px-3 py-2.5 text-sm text-white focus:border-violet-500 focus:outline-none"
              >
                {GENRES.map((g) => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="story-duration-input"
                className="block text-xs font-medium text-zinc-300 mb-1.5"
              >
                Preferred Duration
              </label>
              <input
                id="story-duration-input"
                type="text"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                placeholder="e.g., 6 minutes"
                className="w-full rounded-lg border border-white/10 bg-[#08090f] px-3.5 py-2.5 text-sm text-white focus:border-violet-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="story-tone-input"
              className="block text-xs font-medium text-zinc-300 mb-1.5"
            >
              Tone
            </label>
            <input
              id="story-tone-input"
              type="text"
              value={tone}
              onChange={(e) => setTone(e.target.value)}
              placeholder="e.g., Atmospheric, intimate, tense"
              className="w-full rounded-lg border border-white/10 bg-[#08090f] px-3.5 py-2.5 text-sm text-white focus:border-violet-500 focus:outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-violet-600 to-blue-600 px-4 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50 whitespace-nowrap"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Generating Story & Screenplay...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                Generate with Gemini
              </>
            )}
          </button>

          {(project.characterNames.length > 0 ||
            project.numberedSceneSummaries.length > 0) && (
            <div className="space-y-4 border-t border-white/10 pt-5">
              {project.characterNames.length > 0 && (
                <div>
                  <h3 className="text-xs font-semibold text-zinc-400">
                    Character List
                  </h3>
                  <p className="mt-1.5 text-xs text-zinc-200 leading-relaxed">
                    {project.characterNames.join(" · ")}
                  </p>
                </div>
              )}

              {project.numberedSceneSummaries.length > 0 && (
                <div>
                  <h3 className="text-xs font-semibold text-zinc-400">
                    Numbered Scenes
                  </h3>
                  <ul className="mt-2 divide-y divide-white/10 border-t border-white/10">
                    {project.numberedSceneSummaries.map((item, idx) => (
                      <li
                        key={idx}
                        className="py-2 text-xs text-zinc-300 leading-relaxed"
                      >
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </form>

        {/* Editable Screenplay & Package */}
        <section className="xl:col-span-7 space-y-4 rounded-xl border border-white/10 bg-[#10121b] p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-base font-semibold text-white">
              2. Editable Screenplay & Story Package
            </h2>
            <button
              type="button"
              onClick={handleSaveEdits}
              className="inline-flex items-center gap-2 rounded-lg border border-emerald-500/40 bg-emerald-500/15 px-4 py-2 text-xs font-semibold text-emerald-300 hover:bg-emerald-500/25 transition-colors whitespace-nowrap"
            >
              {savedFeedback ? (
                <>
                  <Check className="h-3.5 w-3.5" />
                  Saved to Project
                </>
              ) : (
                <>
                  <Save className="h-3.5 w-3.5" />
                  Save Changes
                </>
              )}
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label
                htmlFor="film-title-input"
                className="block text-xs font-medium text-zinc-400 mb-1"
              >
                Film Title
              </label>
              <input
                id="film-title-input"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full rounded-lg border border-white/10 bg-[#08090f] px-3.5 py-2 text-sm font-semibold text-white focus:border-blue-500 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="film-synopsis-input"
                  className="block text-xs font-medium text-zinc-400 mb-1"
                >
                  Synopsis
                </label>
                <textarea
                  id="film-synopsis-input"
                  rows={3}
                  value={synopsis}
                  onChange={(e) => setSynopsis(e.target.value)}
                  className="w-full rounded-lg border border-white/10 bg-[#08090f] px-3 py-2 text-xs text-zinc-200 leading-relaxed focus:border-blue-500 focus:outline-none"
                />
              </div>
              <div>
                <label
                  htmlFor="film-conflict-input"
                  className="block text-xs font-medium text-zinc-400 mb-1"
                >
                  Main Conflict
                </label>
                <textarea
                  id="film-conflict-input"
                  rows={3}
                  value={mainConflict}
                  onChange={(e) => setMainConflict(e.target.value)}
                  className="w-full rounded-lg border border-white/10 bg-[#08090f] px-3 py-2 text-xs text-zinc-200 leading-relaxed focus:border-blue-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="screenplay-editor"
                className="block text-xs font-medium text-zinc-400 mb-1"
              >
                Screenplay
              </label>
              <div className="relative">
                <span
                  data-testid="screenplay-word-count"
                  className="pointer-events-none absolute top-3 right-3.5 z-10 rounded bg-[#07080d]/90 px-1.5 py-0.5 font-mono text-xs text-zinc-400 tabular-nums"
                >
                  {scriptStats.wordCount.toLocaleString()}{" "}
                  {scriptStats.wordCount === 1 ? "word" : "words"}
                  {scriptStats.wordCount > 0 ? ` · ~${scriptStats.estimatedMinutes}m` : ""}
                </span>
                <textarea
                  id="screenplay-editor"
                  rows={20}
                  value={script}
                  onChange={(e) => setScript(e.target.value)}
                  placeholder="Your generated or pasted screenplay will appear here..."
                  className="w-full rounded-lg border border-white/10 bg-[#07080d] p-4 pr-36 font-mono text-xs leading-relaxed text-zinc-100 focus:border-violet-500 focus:outline-none"
                />
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
