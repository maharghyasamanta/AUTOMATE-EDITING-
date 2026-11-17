import React, { useCallback, useEffect, useRef, useState } from "react";
import { ArrowRight, Camera, Check, Film, Loader2, Save, Sun } from "lucide-react";
import type { FilmProject, NavSection, SceneBreakdown } from "../types/frameforge";
import { useDebouncedAutoSave } from "../hooks/useDebouncedAutoSave";
import { AUTO_SAVE_DELAY_MS, getScenesDraftSignature } from "../utils/autoSave";

interface SceneDirectorViewProps {
  project: FilmProject;
  onUpdateProject: (updater: (prev: FilmProject) => FilmProject) => void;
  onNavigate: (nav: NavSection) => void;
}

export default function SceneDirectorView({
  project,
  onUpdateProject,
  onNavigate,
}: SceneDirectorViewProps) {
  const [scenes, setScenes] = useState<SceneBreakdown[]>(project.scenes);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedNotice, setSavedNotice] = useState(false);

  const prevProjectIdRef = useRef(project.id);
  const noticeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const triggerSavedNotice = useCallback(() => {
    if (noticeTimerRef.current !== null) {
      clearTimeout(noticeTimerRef.current);
    }
    setSavedNotice(true);
    noticeTimerRef.current = setTimeout(() => {
      setSavedNotice(false);
    }, 2000);
  }, []);

  const handleAutoSaveScenes = useCallback(
    (nextScenes: SceneBreakdown[]) => {
      onUpdateProject((prev) => ({
        ...prev,
        scenes: nextScenes,
      }));
      triggerSavedNotice();
    },
    [onUpdateProject, triggerSavedNotice]
  );

  const { saveNow, cancel, markCommitted, isCommitted } = useDebouncedAutoSave({
    value: scenes,
    resetKey: project.id,
    serialize: getScenesDraftSignature,
    onSave: handleAutoSaveScenes,
    delayMs: AUTO_SAVE_DELAY_MS,
    enabled: !loading,
  });

  useEffect(() => {
    return () => {
      if (noticeTimerRef.current !== null) {
        clearTimeout(noticeTimerRef.current);
      }
    };
  }, []);

  // Sync local scenes only on project switch or external update
  useEffect(() => {
    const switchedProject = prevProjectIdRef.current !== project.id;

    if (switchedProject || !isCommitted(project.scenes)) {
      cancel();
      prevProjectIdRef.current = project.id;
      markCommitted(project.scenes);
      setScenes(project.scenes);
    }
  }, [project.id, project.scenes, cancel, isCommitted, markCommitted]);

  async function handleGenerateScenes() {
    setError(null);
    if (!project.screenplay.trim()) {
      setError("Please create or paste a screenplay in Story Architect first.");
      return;
    }

    cancel();
    setLoading(true);
    try {
      const res = await fetch("/api/scenes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ screenplay: project.screenplay }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Scene breakdown failed.");
      }

      markCommitted(data.scenes);
      setScenes(data.scenes);
      onUpdateProject((prev) => ({
        ...prev,
        scenes: data.scenes,
      }));
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to generate scene breakdown."
      );
    } finally {
      setLoading(false);
    }
  }

  function updateScene(
    id: string,
    field: keyof SceneBreakdown,
    value: string | string[] | number
  ) {
    setScenes((prev) =>
      prev.map((scene) => (scene.id === id ? { ...scene, [field]: value } : scene))
    );
  }

  function handleSaveScenes() {
    const didSave = saveNow();
    if (!didSave) {
      triggerSavedNotice();
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="max-w-2xl">
          <h1 className="text-2xl font-bold text-white">Scene Director</h1>
          <p className="mt-1 text-sm text-zinc-400">
            Convert your screenplay into structured production scenes with framing, lighting,
            and visual direction.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            type="button"
            disabled={loading}
            onClick={handleGenerateScenes}
            className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-violet-600 to-blue-600 px-4 py-2 text-xs font-semibold text-white hover:opacity-90 disabled:opacity-50 whitespace-nowrap"
          >
            {loading ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Breaking Down Scenes...
              </>
            ) : (
              <>
                <Film className="h-3.5 w-3.5" />
                {scenes.length > 0 ? "Regenerate Breakdown" : "Generate Scene Breakdown"}
              </>
            )}
          </button>

          {scenes.length > 0 && (
            <>
              <button
                type="button"
                onClick={handleSaveScenes}
                className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-500/40 bg-emerald-500/15 px-3.5 py-2 text-xs font-semibold text-emerald-300 hover:bg-emerald-500/25 whitespace-nowrap"
              >
                {savedNotice ? (
                  <>
                    <Check className="h-3.5 w-3.5" />
                    Saved
                  </>
                ) : (
                  <>
                    <Save className="h-3.5 w-3.5" />
                    Save Changes
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={() => onNavigate("auditor")}
                className="inline-flex items-center gap-1.5 rounded-lg border border-blue-500/40 bg-blue-600/15 px-3.5 py-2 text-xs font-semibold text-blue-300 hover:bg-blue-600/25 whitespace-nowrap"
              >
                Next: Narrative Auditor
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </>
          )}
        </div>
      </div>

      {error && (
        <div
          role="alert"
          className="rounded-lg border border-rose-500/40 bg-rose-500/10 px-4 py-3 text-sm text-rose-200"
        >
          {error}
        </div>
      )}

      {scenes.length === 0 ? (
        <div className="rounded-xl border border-dashed border-white/15 bg-[#10121b]/60 p-12 text-center space-y-2">
          <p className="text-sm font-medium text-zinc-300">
            No structured scenes generated yet.
          </p>
          <p className="text-xs text-zinc-500">
            Click Generate Scene Breakdown to extract shot, lighting, and action sheets from
            your screenplay.
          </p>
        </div>
      ) : (
        <div className="space-y-5">
          {scenes.map((scene) => (
            <article
              key={scene.id}
              className="rounded-xl border border-white/10 bg-[#10121b] p-6 space-y-4"
            >
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-3">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <span className="font-mono text-sm font-bold text-violet-400 tabular-nums shrink-0">
                    Scene {scene.sceneNumber}
                  </span>
                  <span aria-hidden="true" className="text-zinc-600">
                    /
                  </span>
                  <label className="sr-only" htmlFor={`scene-heading-${scene.id}`}>
                    Scene {scene.sceneNumber} Heading
                  </label>
                  <input
                    id={`scene-heading-${scene.id}`}
                    type="text"
                    value={scene.heading}
                    onChange={(e) => updateScene(scene.id, "heading", e.target.value)}
                    className="w-full bg-transparent font-mono text-sm font-bold text-white focus:outline-none focus:ring-1 focus:ring-violet-500 rounded px-1"
                  />
                </div>
                <div className="text-xs text-zinc-400 shrink-0">
                  <span>{scene.location}</span>
                  <span aria-hidden="true"> · </span>
                  <span>{scene.timeOfDay}</span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div>
                  <label
                    htmlFor={`scene-chars-${scene.id}`}
                    className="block text-xs font-medium text-zinc-400 mb-1"
                  >
                    Characters Present (comma-separated)
                  </label>
                  <input
                    id={`scene-chars-${scene.id}`}
                    type="text"
                    value={scene.charactersPresent.join(", ")}
                    onChange={(e) =>
                      updateScene(
                        scene.id,
                        "charactersPresent",
                        e.target.value
                          .split(",")
                          .map((s) => s.trim())
                          .filter(Boolean)
                      )
                    }
                    className="w-full rounded-lg border border-white/10 bg-[#08090f] p-2.5 text-zinc-200 focus:border-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label
                    htmlFor={`scene-visual-${scene.id}`}
                    className="block text-xs font-medium text-zinc-400 mb-1"
                  >
                    Visual Description
                  </label>
                  <input
                    id={`scene-visual-${scene.id}`}
                    type="text"
                    value={scene.visualDescription}
                    onChange={(e) =>
                      updateScene(scene.id, "visualDescription", e.target.value)
                    }
                    className="w-full rounded-lg border border-white/10 bg-[#08090f] p-2.5 text-zinc-200 focus:border-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label
                    htmlFor={`scene-action-${scene.id}`}
                    className="block text-xs font-medium text-zinc-400 mb-1"
                  >
                    Action
                  </label>
                  <textarea
                    id={`scene-action-${scene.id}`}
                    rows={3}
                    value={scene.action}
                    onChange={(e) => updateScene(scene.id, "action", e.target.value)}
                    className="w-full rounded-lg border border-white/10 bg-[#08090f] p-2.5 text-zinc-200 leading-relaxed focus:border-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label
                    htmlFor={`scene-dialogue-${scene.id}`}
                    className="block text-xs font-medium text-zinc-400 mb-1"
                  >
                    Dialogue
                  </label>
                  <textarea
                    id={`scene-dialogue-${scene.id}`}
                    rows={3}
                    value={scene.dialogue}
                    onChange={(e) => updateScene(scene.id, "dialogue", e.target.value)}
                    className="w-full rounded-lg border border-white/10 bg-[#08090f] p-2.5 text-zinc-200 leading-relaxed focus:border-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label
                    htmlFor={`scene-camera-${scene.id}`}
                    className="flex items-center gap-1.5 text-xs font-medium text-blue-300 mb-1"
                  >
                    <Camera className="h-3.5 w-3.5" />
                    Camera Framing
                  </label>
                  <input
                    id={`scene-camera-${scene.id}`}
                    type="text"
                    value={scene.cameraFraming}
                    onChange={(e) =>
                      updateScene(scene.id, "cameraFraming", e.target.value)
                    }
                    className="w-full rounded-lg border border-white/10 bg-[#08090f] p-2.5 text-zinc-200 focus:border-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label
                    htmlFor={`scene-lighting-${scene.id}`}
                    className="flex items-center gap-1.5 text-xs font-medium text-amber-300 mb-1"
                  >
                    <Sun className="h-3.5 w-3.5" />
                    Lighting
                  </label>
                  <input
                    id={`scene-lighting-${scene.id}`}
                    type="text"
                    value={scene.lighting}
                    onChange={(e) => updateScene(scene.id, "lighting", e.target.value)}
                    className="w-full rounded-lg border border-white/10 bg-[#08090f] p-2.5 text-zinc-200 focus:border-blue-500 focus:outline-none"
                  />
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
