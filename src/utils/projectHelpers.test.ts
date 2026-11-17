import test from "node:test";
import assert from "node:assert/strict";
import {
  applyDemoContinuityFix,
  computeScreenplayStats,
  createDemoProject,
  createEmptyProject,
  DEMO_PROJECT_ID,
  formatAuditReportMarkdown,
  hasUnexplainedDemoJacketLine,
  loadProjectsFromStorage,
  sanitizeSlug,
  saveProjectsToStorage,
} from "./projectHelpers";
import {
  getScenesDraftSignature,
  getStoryDraftSignature,
} from "./autoSave";

test("createDemoProject builds a valid 3-scene continuity test case", () => {
  const demo = createDemoProject();
  assert.equal(demo.id, DEMO_PROJECT_ID);
  assert.equal(demo.isDemo, true);
  assert.equal(demo.scenes.length, 3);
  assert.match(demo.screenplay, /SCENE 1[\s\S]*blue jacket/i);
  assert.match(demo.screenplay, /SCENE 2[\s\S]*blue jacket/i);
  assert.match(demo.screenplay, /SCENE 3[\s\S]*red jacket/i);
  assert.equal(hasUnexplainedDemoJacketLine(demo.screenplay), true);
});

test("applyDemoContinuityFix resolves the unexplained jacket swap", () => {
  const demo = createDemoProject();
  const fixed = applyDemoContinuityFix(demo.screenplay);
  assert.equal(hasUnexplainedDemoJacketLine(fixed), false);
  assert.match(fixed, /spare red rain jacket/i);
  assert.match(fixed, /oil soaked her blue jacket/i);
});

test("computeScreenplayStats calculates words and estimated minutes", () => {
  assert.deepEqual(computeScreenplayStats(""), {
    wordCount: 0,
    estimatedMinutes: 0,
  });
  assert.deepEqual(computeScreenplayStats("INT. ROOM - NIGHT\nMaya enters."), {
    wordCount: 6,
    estimatedMinutes: 1,
  });
  const longScript = Array(320).fill("word").join(" ");
  assert.deepEqual(computeScreenplayStats(longScript), {
    wordCount: 320,
    estimatedMinutes: 2,
  });
});

test("sanitizeSlug formats safe filenames", () => {
  assert.equal(sanitizeSlug("The Harbor Manifest!"), "the-harbor-manifest");
  assert.equal(sanitizeSlug("   "), "frameforge-project");
});

test("formatAuditReportMarkdown formats contradictions and clean reports", () => {
  const proj = createEmptyProject("Neon Rain");
  assert.match(formatAuditReportMarkdown(proj), /No audit has been run yet/);

  proj.auditReport = {
    hasContradictions: true,
    summary: "Found one wardrobe mismatch.",
    analyzedAt: "2026-11-17T00:00:00.000Z",
    issues: [
      {
        id: "iss-1",
        category: "Character Appearance Inconsistency",
        severity: "High",
        sceneReferences: ["Scene 1", "Scene 3"],
        evidence: "shaking rain off her red jacket",
        explanation: "Jacket changed from blue to red without explanation.",
        suggestedCorrection: "Explain why Maya changed jackets in Scene 3.",
      },
    ],
  };

  const md = formatAuditReportMarkdown(proj);
  assert.match(md, /1 Continuity Issue\(s\) Detected/);
  assert.match(md, /Character Appearance Inconsistency \(High Severity\)/);
  assert.match(md, /Scene 1, Scene 3/);
});

test("localStorage helpers round-trip saved projects and fallback cleanly", () => {
  const store = new Map<string, string>();
  const mockStorage = {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, val: string) => {
      store.set(key, val);
    },
  };

  const initial = loadProjectsFromStorage(mockStorage);
  assert.equal(initial.projects.length, 1);
  assert.equal(initial.activeProjectId, DEMO_PROJECT_ID);

  const custom = createEmptyProject("Midnight Signal");
  saveProjectsToStorage(mockStorage, [custom, ...initial.projects], custom.id);

  const reloaded = loadProjectsFromStorage(mockStorage);
  assert.equal(reloaded.projects.length, 2);
  assert.equal(reloaded.activeProjectId, custom.id);
  assert.equal(reloaded.projects[0].title, "Midnight Signal");
});

test("autoSave signatures change when draft content changes", () => {
  const sig1 = getStoryDraftSignature({
    storyInput: { idea: "A", genre: "Noir", duration: "5m", tone: "Dark" },
    title: "Title",
    synopsis: "Syn",
    mainConflict: "Conf",
    screenplay: "Script",
  });
  const sig2 = getStoryDraftSignature({
    storyInput: { idea: "A", genre: "Noir", duration: "5m", tone: "Dark" },
    title: "Title",
    synopsis: "Syn",
    mainConflict: "Conf",
    screenplay: "Script updated",
  });
  assert.notEqual(sig1, sig2);

  const demo = createDemoProject();
  const sSig1 = getScenesDraftSignature(demo.scenes);
  const sSig2 = getScenesDraftSignature(
    demo.scenes.map((s, idx) =>
      idx === 0 ? { ...s, lighting: "Changed lighting" } : s
    )
  );
  assert.notEqual(sSig1, sSig2);
});
