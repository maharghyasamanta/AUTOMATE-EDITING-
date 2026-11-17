import React, { useEffect, useState } from "react";
import { Camera, Check, Copy, Images, Loader2, Palette } from "lucide-react";
import type { FilmProject, NavSection, StoryboardPanel } from "../types/frameforge";

interface StoryboardStudioViewProps {
  project: FilmProject;
  onUpdateProject: (updater: (prev: FilmProject) => FilmProject) => void;
  onNavigate: (nav: NavSection) => void;
}

export default function StoryboardStudioView({
  project,
  onUpdateProject,
  onNavigate,
}: StoryboardStudioViewProps) {
  const [panels, setPanels] = useState<StoryboardPanel[]>(project.storyboardPanels);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    setPanels(project.storyboardPanels);
  }, [project.id, project.updatedAt]);

  async function handleGenerateStoryboards() {
    setError(null);
    if (project.scenes.length === 0) {
      setError(
        "No structured scenes found. Please run Scene Director first to break down your screenplay."
      );
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/storyboard", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scenes: project.scenes,
          attemptImageGeneration: true,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Storyboard generation failed.");
      }

      setPanels(data.panels);
      onUpdateProject((prev) => ({
        ...prev,
        storyboardPanels: data.panels,
      }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate storyboards.");
    } finally {
      setLoading(false);
    }
  }

  async function copyPrompt(id: string, prompt: string) {
    try {
      await navigator.clipboard.writeText(prompt);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 1800);
    } catch {
      setError(
        "Clipboard access was blocked by the browser. Select and copy the prompt text manually."
      );
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Storyboard Studio</h1>
          <p className="mt-1 text-sm text-zinc-400">
            Creates storyboard frames for each scene when image generation is available, or
            detailed directorial visual prompts otherwise.
          </p>
        </div>

        <button
          type="button"
          disabled={loading}
          onClick={handleGenerateStoryboards}
          className="inline-flex items-center gap-2 self-start rounded-lg bg-gradient-to-r from-violet-600 to-blue-600 px-4 py-2.5 text-xs font-semibold text-white hover:opacity-90 disabled:opacity-50 whitespace-nowrap"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Generating Storyboard Panels...
            </>
          ) : (
            <>
              <Images className="h-4 w-4" />
              {panels.length > 0 ? "Regenerate Storyboards" : "Generate Storyboards"}
            </>
          )}
        </button>
      </div>

      {error && (
        <div
          role="alert"
          className="rounded-lg border border-rose-500/40 bg-rose-500/10 px-4 py-3 text-sm text-rose-200"
        >
          {error}
        </div>
      )}

      {panels.length === 0 ? (
        <div className="rounded-xl border border-dashed border-white/15 bg-[#10121b]/60 p-12 text-center space-y-3">
          <Images className="mx-auto h-9 w-9 text-zinc-500" />
          <p className="text-sm font-medium text-zinc-300">
            No storyboard panels generated yet.
          </p>
          <p className="text-xs text-zinc-500 max-w-md mx-auto">
            {project.scenes.length > 0
              ? `Ready to generate panels for ${project.scenes.length} structured scenes.`
              : "Break down your scenes in Scene Director first, then return here to generate storyboard panels."}
          </p>
          {project.scenes.length === 0 && (
            <button
              type="button"
              onClick={() => onNavigate("scenes")}
              className="mt-2 inline-flex items-center gap-2 rounded-lg border border-white/15 bg-[#10121b] px-4 py-2 text-xs font-semibold text-zinc-200 hover:bg-[#171926]"
            >
              Go to Scene Director
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {panels.map((panel) => (
            <article
              key={panel.id}
              className="overflow-hidden rounded-xl border border-white/10 bg-[#10121b] flex flex-col"
            >
              {panel.mode === "image" && panel.imageDataUrl ? (
                <div className="relative aspect-video w-full bg-black border-b border-white/10">
                  <img
                    src={panel.imageDataUrl}
                    alt={`Storyboard frame for Scene ${panel.sceneNumber}: ${panel.sceneHeading}`}
                    referrerPolicy="no-referrer"
                    className="h-full w-full object-cover"
                  />
                </div>
              ) : (
                <div className="border-b border-white/10 bg-[#0b0c14] p-5">
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="text-xs font-semibold text-violet-300 tabular-nums">
                      Scene {panel.sceneNumber} · Visual Prompt Frame
                    </span>
                    <button
                      type="button"
                      onClick={() => copyPrompt(panel.id, panel.visualPrompt)}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-[#141624] px-3 py-1.5 text-xs font-medium text-zinc-200 hover:bg-[#1c1f32] whitespace-nowrap"
                    >
                      {copiedId === panel.id ? (
                        <>
                          <Check className="h-3.5 w-3.5 text-emerald-400" />
                          Copied
                        </>
                      ) : (
                        <>
                          <Copy className="h-3.5 w-3.5" />
                          Copy Prompt
                        </>
                      )}
                    </button>
                  </div>
                  <p className="text-xs leading-relaxed text-zinc-200">
                    {panel.visualPrompt}
                  </p>
                  {panel.generationNote && (
                    <p className="mt-3 text-xs text-zinc-400">{panel.generationNote}</p>
                  )}
                </div>
              )}

              <div className="p-5 space-y-4 flex-1 flex flex-col justify-between">
                <div>
                  <h2 className="font-mono text-xs font-bold text-white tabular-nums">
                    Scene {panel.sceneNumber} — {panel.sceneHeading}
                  </h2>
                  {panel.mode === "image" && (
                    <p className="mt-2 text-xs text-zinc-400 leading-relaxed">
                      {panel.visualPrompt}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-white/10 pt-3 text-xs">
                  <div>
                    <span className="flex items-center gap-1.5 text-xs font-medium text-blue-300">
                      <Camera className="h-3.5 w-3.5" />
                      Shot & Movement
                    </span>
                    <p className="mt-1 text-zinc-300">
                      {panel.shotType} · {panel.cameraMovement}
                    </p>
                  </div>
                  <div>
                    <span className="flex items-center gap-1.5 text-xs font-medium text-amber-300">
                      <Palette className="h-3.5 w-3.5" />
                      Lighting & Palette
                    </span>
                    <p className="mt-1 text-zinc-300">
                      {panel.lightingNotes} ({panel.colorPalette})
                    </p>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
