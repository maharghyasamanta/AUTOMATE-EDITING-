import React from "react";
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Download,
  FileText,
  FlaskConical,
  FolderOpen,
  Plus,
  ShieldAlert,
  Trash2,
} from "lucide-react";
import type { FilmProject, NavSection } from "../types/frameforge";
import {
  computeScreenplayStats,
  formatAuditReportMarkdown,
  sanitizeSlug,
} from "../utils/projectHelpers";

interface DashboardViewProps {
  projects: FilmProject[];
  activeProject: FilmProject;
  onSelectProject: (id: string) => void;
  onCreateProject: () => void;
  onDeleteProject: (id: string) => void;
  onLoadDemo: () => void;
  onNavigate: (nav: NavSection) => void;
}

function downloadTextFile(filename: string, content: string, mime = "text/plain") {
  const blob = new Blob([content], { type: `${mime};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export default function DashboardView({
  projects,
  activeProject,
  onSelectProject,
  onCreateProject,
  onDeleteProject,
  onLoadDemo,
  onNavigate,
}: DashboardViewProps) {
  const stats = computeScreenplayStats(activeProject.screenplay);
  const hasScreenplay = stats.wordCount > 0;
  const hasCharacters = activeProject.characters.length > 0;
  const hasScenes = activeProject.scenes.length > 0;
  const hasAudit = activeProject.auditReport !== null;
  const hasStoryboards = activeProject.storyboardPanels.length > 0;

  const pipelineSteps: {
    step: string;
    label: string;
    done: boolean;
    target: NavSection;
    detail: string;
  }[] = [
    {
      step: "01",
      label: "Story & Screenplay",
      done: hasScreenplay,
      target: "story",
      detail: hasScreenplay
        ? `${stats.wordCount} words · ~${stats.estimatedMinutes}m`
        : "Not generated yet",
    },
    {
      step: "02",
      label: "Character Intelligence",
      done: hasCharacters,
      target: "characters",
      detail: hasCharacters
        ? `${activeProject.characters.length} character profiles`
        : "Pending extraction",
    },
    {
      step: "03",
      label: "Scene Director",
      done: hasScenes,
      target: "scenes",
      detail: hasScenes
        ? `${activeProject.scenes.length} structured scenes`
        : "Pending breakdown",
    },
    {
      step: "04",
      label: "Narrative Auditor",
      done: hasAudit,
      target: "auditor",
      detail: hasAudit
        ? `${activeProject.auditReport?.issues.length ?? 0} issues flagged`
        : "Not audited yet",
    },
    {
      step: "05",
      label: "Storyboard Studio",
      done: hasStoryboards,
      target: "storyboard",
      detail: hasStoryboards
        ? `${activeProject.storyboardPanels.length} panels ready`
        : "Pending generation",
    },
  ];

  const safeSlug = sanitizeSlug(activeProject.title);

  return (
    <div className="space-y-8">
      {/* Studio Hero Banner */}
      <section className="glass-hero p-6 sm:p-8">
        <div
          className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full bg-violet-500/15 blur-3xl"
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute -bottom-24 left-1/3 h-56 w-56 rounded-full bg-blue-500/15 blur-3xl"
          aria-hidden="true"
        />
        <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold tracking-wide text-violet-300">
              FrameForge AI · Production Workspace
            </p>
            <h1 className="mt-2 text-2xl sm:text-3xl font-bold tracking-tight text-white text-balance">
              Your imagination. Your direction. AI-powered execution.
            </h1>
            <p className="mt-3 text-sm text-zinc-300 leading-relaxed max-w-xl">
              Develop a story idea into a formatted screenplay, extract fact-grounded
              character dossiers, direct structured scene breakdowns, and audit
              narrative continuity before stepping onto set.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={onCreateProject}
              className="inline-flex items-center gap-2 rounded-xl border border-violet-300/35 bg-gradient-to-r from-violet-600/90 to-blue-600/90 px-4 py-2.5 text-sm font-semibold text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.32),0_10px_24px_-8px_rgba(109,40,217,0.65)] backdrop-blur-md transition-all hover:brightness-110 whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-violet-400"
            >
              <Plus className="h-4 w-4 shrink-0" />
              New Film Project
            </button>
            <button
              type="button"
              onClick={onLoadDemo}
              className="liquid-demo-btn inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-blue-100 whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-blue-400"
            >
              <FlaskConical className="h-4 w-4 shrink-0 text-blue-300" />
              Reset Continuity Demo
            </button>
          </div>
        </div>
      </section>

      {/* Active Production Pipeline & Exports */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <section className="xl:col-span-2 glass-panel p-6">
          <div className="flex flex-wrap items-baseline justify-between gap-3 pb-4 border-b border-white/10">
            <div>
              <h2 className="text-lg font-semibold text-white">
                {activeProject.title}
              </h2>
              <p className="mt-1 text-xs text-zinc-400">
                {activeProject.storyInput.genre || "Unspecified Genre"}
                <span aria-hidden="true"> · </span>
                {activeProject.storyInput.duration || "Flexible Runtime"}
                {activeProject.isDemo ? " · Sample Continuity Case" : ""}
              </p>
            </div>
            <button
              type="button"
              onClick={() => onNavigate(hasScreenplay ? "auditor" : "story")}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-300 hover:text-blue-200 whitespace-nowrap shrink-0"
            >
              {hasScreenplay ? "Inspect Continuity" : "Start Writing"}
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {pipelineSteps.map((item) => (
              <button
                key={item.step}
                type="button"
                onClick={() => onNavigate(item.target)}
                className={`glass-tab ${
                  item.done ? "glass-tab-done" : ""
                } group flex flex-col justify-between p-4 text-left focus-visible:outline-2 focus-visible:outline-violet-400`}
              >
                <div className="flex items-center justify-between gap-2 w-full">
                  <span className="font-mono text-xs font-medium text-zinc-300/80 tabular-nums">
                    {item.step}
                  </span>
                  {item.done ? (
                    <span className="flex h-6 w-6 items-center justify-center rounded-full border border-emerald-400/35 bg-emerald-500/15 backdrop-blur-md">
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-300 shrink-0" />
                    </span>
                  ) : (
                    <span className="flex h-6 w-6 items-center justify-center rounded-full border border-white/15 bg-white/[0.06] backdrop-blur-md transition-colors group-hover:border-blue-400/40 group-hover:bg-blue-500/20">
                      <ArrowRight className="h-3.5 w-3.5 text-zinc-400 group-hover:text-blue-200 transition-colors shrink-0" />
                    </span>
                  )}
                </div>
                <div className="mt-4">
                  <div className="text-sm font-semibold text-white">
                    {item.label}
                  </div>
                  <div className="mt-1 text-xs text-zinc-300/80 tabular-nums">
                    {item.detail}
                  </div>
                </div>
              </button>
            ))}
          </div>

          {activeProject.isDemo && (
            <div className="mt-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-t border-white/10 pt-5">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-white">
                    Demo Challenge: Detective Maya Vance&apos;s Wardrobe Error
                  </p>
                  <p className="mt-1 text-xs text-zinc-400 leading-relaxed">
                    Maya wears a blue jacket in Scenes 1 and 2, then suddenly enters Scene 3
                    wearing a red jacket with no explanation. Run the Narrative Auditor to catch
                    it, then edit Scene 3 to explain the swap and re-run the audit.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => onNavigate("auditor")}
                className="shrink-0 rounded-xl border border-blue-400/40 bg-blue-600/85 px-4 py-2 text-xs font-semibold text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.28)] backdrop-blur-md transition-colors hover:bg-blue-500 whitespace-nowrap"
              >
                Open Narrative Auditor
              </button>
            </div>
          )}
        </section>

        {/* Export Deliverables */}
        <section className="glass-panel p-6 flex flex-col justify-between">
          <div>
            <h2 className="text-lg font-semibold text-white">Export Deliverables</h2>
            <p className="mt-1 text-xs text-zinc-400">
              Download your screenplay script or consistency audit report at any time.
            </p>

            <div className="mt-5 space-y-3">
              <button
                type="button"
                disabled={!hasScreenplay}
                onClick={() =>
                  downloadTextFile(`${safeSlug}-screenplay.txt`, activeProject.screenplay)
                }
                className="glass-tab flex w-full items-center justify-between px-4 py-3 text-sm font-medium text-zinc-100 disabled:cursor-not-allowed disabled:opacity-40 whitespace-nowrap"
              >
                <span className="flex items-center gap-2.5">
                  <FileText className="h-4 w-4 text-violet-300 shrink-0" />
                  Download Screenplay (.txt)
                </span>
                <Download className="h-4 w-4 text-zinc-400 shrink-0" />
              </button>

              <button
                type="button"
                disabled={!hasAudit}
                onClick={() =>
                  downloadTextFile(
                    `${safeSlug}-audit-report.md`,
                    formatAuditReportMarkdown(activeProject),
                    "text/markdown"
                  )
                }
                className="glass-tab flex w-full items-center justify-between px-4 py-3 text-sm font-medium text-zinc-100 disabled:cursor-not-allowed disabled:opacity-40 whitespace-nowrap"
              >
                <span className="flex items-center gap-2.5">
                  <ShieldAlert className="h-4 w-4 text-blue-300 shrink-0" />
                  Download Audit Report (.md)
                </span>
                <Download className="h-4 w-4 text-zinc-400 shrink-0" />
              </button>
            </div>
          </div>

          <p className="mt-6 border-t border-white/10 pt-4 text-xs text-zinc-500">
            Projects automatically save in browser local storage after every edit.
          </p>
        </section>
      </div>

      {/* Saved Projects Library */}
      <section className="glass-panel p-6">
        <div className="flex items-center justify-between gap-4 pb-4 border-b border-white/10">
          <h2 className="text-lg font-semibold text-white">
            Saved Projects ({projects.length})
          </h2>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {projects.map((proj) => {
            const isCurrent = proj.id === activeProject.id;
            return (
              <div
                key={proj.id}
                className={`glass-subcard flex flex-col justify-between p-4 transition-colors ${
                  isCurrent
                    ? "!border-violet-400/50 bg-violet-500/10"
                    : "hover:border-white/20"
                }`}
              >
                <div>
                  <h3 className="text-sm font-semibold text-white truncate">
                    {proj.title}
                  </h3>
                  <p className="mt-1 text-xs text-zinc-400 tabular-nums">
                    {proj.storyInput.genre || "Unspecified"}
                    <span aria-hidden="true"> · </span>
                    {new Date(proj.updatedAt).toLocaleDateString()}
                    {proj.isDemo ? " · Demo" : ""}
                  </p>
                  <p className="mt-2.5 text-xs text-zinc-400 line-clamp-2 leading-relaxed">
                    {proj.synopsis || "No synopsis created yet."}
                  </p>
                </div>

                <div className="mt-4 flex items-center justify-between border-t border-white/10 pt-3">
                  <button
                    type="button"
                    onClick={() => onSelectProject(proj.id)}
                    className={`inline-flex items-center gap-1.5 text-xs font-semibold whitespace-nowrap ${
                      isCurrent ? "text-blue-400" : "text-zinc-300 hover:text-white"
                    }`}
                  >
                    <FolderOpen className="h-3.5 w-3.5 shrink-0" />
                    {isCurrent ? "Active Project" : "Open Project"}
                  </button>

                  {projects.length > 1 && (
                    <button
                      type="button"
                      onClick={() => onDeleteProject(proj.id)}
                      className="rounded-lg p-1.5 text-zinc-500 hover:bg-rose-500/10 hover:text-rose-400 transition-colors"
                      aria-label={`Delete ${proj.title}`}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
