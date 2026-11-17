import React, { useEffect, useState } from "react";
import {
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  Check,
  Download,
  Edit3,
  Info,
  Loader2,
  RefreshCw,
  ShieldAlert,
  ShieldCheck,
  Wand2,
} from "lucide-react";
import type { AuditSeverity, FilmProject, NavSection } from "../types/frameforge";
import {
  applyDemoContinuityFix,
  formatAuditReportMarkdown,
  hasUnexplainedDemoJacketLine,
  sanitizeSlug,
} from "../utils/projectHelpers";

interface NarrativeAuditorViewProps {
  project: FilmProject;
  onUpdateProject: (updater: (prev: FilmProject) => FilmProject) => void;
  onNavigate: (nav: NavSection) => void;
}

const SEVERITY_STYLE: Record<
  AuditSeverity,
  { text: string; Icon: React.ComponentType<{ className?: string }> }
> = {
  High: { text: "text-rose-400", Icon: AlertCircle },
  Medium: { text: "text-amber-400", Icon: AlertTriangle },
  Low: { text: "text-blue-400", Icon: Info },
};

function downloadMarkdown(filename: string, content: string) {
  const blob = new Blob([content], { type: "text/markdown;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export default function NarrativeAuditorView({
  project,
  onUpdateProject,
  onNavigate,
}: NarrativeAuditorViewProps) {
  const [editableScript, setEditableScript] = useState(project.screenplay);
  const [showEditor, setShowEditor] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedScriptToast, setSavedScriptToast] = useState(false);

  useEffect(() => {
    setEditableScript(project.screenplay);
  }, [project.id, project.screenplay]);

  async function runAudit(scriptToAudit: string) {
    setError(null);
    if (!scriptToAudit.trim()) {
      setError("A screenplay is required before running the Narrative Consistency Audit.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/audit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          screenplay: scriptToAudit,
          characters: project.characters,
          scenes: project.scenes,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Narrative Consistency Audit failed.");
      }

      onUpdateProject((prev) => ({
        ...prev,
        screenplay: scriptToAudit,
        auditReport: data,
      }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to run Narrative Audit.");
    } finally {
      setLoading(false);
    }
  }

  function handleSaveScriptOnly() {
    onUpdateProject((prev) => ({ ...prev, screenplay: editableScript }));
    setSavedScriptToast(true);
    setTimeout(() => setSavedScriptToast(false), 1800);
  }

  function handleInsertDemoFix() {
    const updated = applyDemoContinuityFix(editableScript);
    setEditableScript(updated);
    setShowEditor(true);
    onUpdateProject((prev) => ({ ...prev, screenplay: updated }));
  }

  const report = project.auditReport;
  const safeSlug = sanitizeSlug(project.title);
  const showDemoQuickFix =
    project.isDemo && hasUnexplainedDemoJacketLine(editableScript);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="max-w-2xl">
          <h1 className="text-2xl font-bold text-white">
            Narrative Consistency Auditor
          </h1>
          <p className="mt-1 text-sm text-zinc-400">
            Audits screenplay continuity against earlier scenes and established character
            facts while respecting intentional development and explained changes.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setShowEditor((v) => !v)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-[#10121b] px-3.5 py-2 text-xs font-semibold text-zinc-200 hover:bg-[#171926] whitespace-nowrap"
          >
            <Edit3 className="h-3.5 w-3.5" />
            {showEditor ? "Hide Editor" : "Edit Screenplay"}
          </button>

          {report && (
            <button
              type="button"
              onClick={() =>
                downloadMarkdown(
                  `${safeSlug}-audit-report.md`,
                  formatAuditReportMarkdown(project)
                )
              }
              className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-[#10121b] px-3.5 py-2 text-xs font-semibold text-zinc-200 hover:bg-[#171926] whitespace-nowrap"
            >
              <Download className="h-3.5 w-3.5" />
              Export Report
            </button>
          )}

          <button
            type="button"
            disabled={loading}
            onClick={() => runAudit(editableScript)}
            className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-violet-600 to-blue-600 px-4 py-2 text-xs font-semibold text-white hover:opacity-90 disabled:opacity-50 whitespace-nowrap"
          >
            {loading ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Auditing Continuity...
              </>
            ) : (
              <>
                <RefreshCw className="h-3.5 w-3.5" />
                {report ? "Re-run Continuity Audit" : "Run Continuity Audit"}
              </>
            )}
          </button>
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

      {/* Demo Continuity Helper */}
      {project.isDemo && (
        <section className="rounded-xl border border-blue-500/30 bg-[#101628] p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h2 className="text-sm font-semibold text-white">
              Demo Continuity Test: Detective Maya Vance&apos;s Jacket
            </h2>
            <p className="text-xs text-zinc-300 leading-relaxed max-w-2xl">
              Step 1: Click Run Continuity Audit to detect Maya&apos;s unexplained Blue-to-Red
              jacket change in Scene 3. Step 2: Edit Scene 3 to explain why she changed jackets
              (or use the quick-edit button), then click Re-run Continuity Audit to confirm the
              contradiction resolves.
            </p>
          </div>
          {showDemoQuickFix && (
            <button
              type="button"
              onClick={handleInsertDemoFix}
              className="shrink-0 inline-flex items-center gap-1.5 rounded-lg border border-blue-400/40 bg-blue-500/20 px-3.5 py-2 text-xs font-semibold text-blue-200 hover:bg-blue-500/30 whitespace-nowrap"
            >
              <Wand2 className="h-3.5 w-3.5" />
              Add Explanation in Scene 3
            </button>
          )}
        </section>
      )}

      {/* Inline Screenplay Editor */}
      {showEditor && (
        <section className="rounded-xl border border-white/10 bg-[#10121b] p-5 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <label
              htmlFor="auditor-inline-script"
              className="text-sm font-semibold text-white"
            >
              Inline Screenplay Editor
            </label>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleSaveScriptOnly}
                className="inline-flex items-center gap-1.5 rounded-lg border border-white/15 bg-[#0b0c13] px-3 py-1.5 text-xs font-semibold text-zinc-200 hover:bg-[#171926] whitespace-nowrap"
              >
                {savedScriptToast ? (
                  <>
                    <Check className="h-3.5 w-3.5 text-emerald-400" />
                    Saved
                  </>
                ) : (
                  "Save Draft"
                )}
              </button>
              <button
                type="button"
                disabled={loading}
                onClick={() => runAudit(editableScript)}
                className="inline-flex items-center gap-1.5 rounded-lg bg-violet-600 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-violet-500 disabled:opacity-50 whitespace-nowrap"
              >
                Save & Re-run Audit
              </button>
            </div>
          </div>
          <textarea
            id="auditor-inline-script"
            rows={14}
            value={editableScript}
            onChange={(e) => setEditableScript(e.target.value)}
            className="w-full rounded-lg border border-white/10 bg-[#07080d] p-4 font-mono text-xs leading-relaxed text-zinc-100 focus:border-violet-500 focus:outline-none"
          />
        </section>
      )}

      {/* Audit Results */}
      {!report ? (
        <div className="rounded-xl border border-dashed border-white/15 bg-[#10121b]/60 p-12 text-center space-y-3">
          <ShieldAlert className="mx-auto h-9 w-9 text-zinc-500" />
          <p className="text-sm font-medium text-zinc-300">
            No Narrative Consistency Audit has been run yet.
          </p>
          <p className="text-xs text-zinc-500 max-w-md mx-auto">
            Checks character appearance, timeline logic, location continuity, relationships,
            personality consistency, and scene transitions.
          </p>
        </div>
      ) : (
        <div className="space-y-5">
          {/* Summary Banner */}
          <section
            className={`rounded-xl border p-6 ${
              report.hasContradictions
                ? "border-rose-500/35 bg-[#1b1015]"
                : "border-emerald-500/35 bg-[#0f1a16]"
            }`}
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                {report.hasContradictions ? (
                  <ShieldAlert className="h-6 w-6 text-rose-400 shrink-0 mt-0.5" />
                ) : (
                  <ShieldCheck className="h-6 w-6 text-emerald-400 shrink-0 mt-0.5" />
                )}
                <div>
                  <h2 className="text-lg font-bold text-white tabular-nums">
                    {report.hasContradictions
                      ? `${report.issues.length} Continuity ${
                          report.issues.length === 1 ? "Issue" : "Issues"
                        } Detected`
                      : "No Continuity Contradictions Found"}
                  </h2>
                  <p className="mt-1 text-sm text-zinc-200 leading-relaxed">
                    {report.summary}
                  </p>
                  <p className="mt-2 text-xs text-zinc-400 tabular-nums">
                    Audited {new Date(report.analyzedAt).toLocaleString()}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => onNavigate("storyboard")}
                className="shrink-0 inline-flex items-center gap-1.5 rounded-lg border border-white/15 bg-black/30 px-4 py-2 text-xs font-semibold text-white hover:bg-black/50 whitespace-nowrap"
              >
                Next: Storyboard Studio
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </section>

          {/* Detected Issues */}
          {report.issues.length > 0 && (
            <div className="space-y-4">
              {report.issues.map((issue, idx) => {
                const severityMeta = SEVERITY_STYLE[issue.severity] ?? SEVERITY_STYLE.Medium;
                const SeverityIcon = severityMeta.Icon;

                return (
                  <article
                    key={issue.id}
                    className="rounded-xl border border-white/10 bg-[#10121b] p-6 space-y-4"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-3">
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-xs text-zinc-500 tabular-nums">
                          {String(idx + 1).padStart(2, "0")}
                        </span>
                        <h3 className="text-base font-semibold text-white">
                          {issue.category}
                        </h3>
                      </div>

                      <div className="flex flex-wrap items-center gap-3 text-xs">
                        <span className="text-zinc-400">
                          {issue.sceneReferences.join(" · ")}
                        </span>
                        <span
                          className={`inline-flex items-center gap-1 font-semibold ${severityMeta.text}`}
                        >
                          <SeverityIcon className="h-3.5 w-3.5 shrink-0" />
                          {issue.severity} Severity
                        </span>
                      </div>
                    </div>

                    <div>
                      <p className="text-xs font-medium text-zinc-400 mb-1">
                        Evidence from Screenplay
                      </p>
                      <blockquote className="font-mono text-xs text-amber-200/95 leading-relaxed bg-[#07080d] rounded-lg p-3.5 border border-white/10">
                        &ldquo;{issue.evidence}&rdquo;
                      </blockquote>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-1 text-xs">
                      <div>
                        <p className="text-xs font-semibold text-zinc-300 mb-1">
                          Explanation
                        </p>
                        <p className="text-zinc-300 leading-relaxed">
                          {issue.explanation}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-emerald-300 mb-1">
                          Suggested Correction
                        </p>
                        <p className="text-zinc-200 leading-relaxed">
                          {issue.suggestedCorrection}
                        </p>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
