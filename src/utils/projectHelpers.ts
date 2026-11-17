import type { FilmProject } from "../types/frameforge";

export const DEMO_PROJECT_ID = "demo-cobalt-jacket";
const STORAGE_KEY = "frameforge_ai_projects_v1";

const DEMO_UNEXPLAINED_LINE =
  "Maya slides into the vinyl booth across from Leo, shaking rain off her red jacket.";

const DEMO_EXPLAINED_LINE =
  "Maya slides into the vinyl booth across from Leo, wearing a spare red rain jacket she grabbed from her patrol trunk after oil soaked her blue jacket on the pier.";

export const DEMO_SCREENPLAY = `SCENE 1
INT. PRECINCT ARCHIVE ROOM - NIGHT

Fluorescent tubes hum above steel filing cabinets. Rain streaks a narrow basement window.

DETECTIVE MAYA VANCE (30s) flips through a water-damaged evidence ledger. She wears a worn blue jacket with brass snaps, sleeves pushed up to her forearms.

MAYA
(to herself)
Three freight manifests, all signed after midnight.

Her phone buzzes on the metal desk. A single text message glows on the screen: PIER 9. ALONE.

Maya zips her blue jacket up to her collar and heads for the stairwell.

SCENE 2
EXT. HARBOR PIER 9 - NIGHT

Fog drifts beneath amber sodium lamps. Waves slap violently against wooden pilings.

Maya walks toward Locker 14, her blue jacket darkened at the shoulders by the steady drizzle. She shines a tactical flashlight onto a freshly cut padlock.

LEO MERCER (40s), an informant in a charcoal wool coat, steps out from behind a stack of shipping crates.

LEO
You actually came. Didn't think Precinct 4 still cared about harbor ghosts.

MAYA
I care about who wiped the manifest log. Who gave you this locker number?

LEO
Not here. Too many eyes on the gantry. Meet me at Bell's Diner in twenty minutes.

Leo vanishes into the fog. Maya checks the empty locker, pockets a brass key, and hurries back toward the street.

SCENE 3
INT. BELL'S DINER - LATE NIGHT

Neon red light from the street sign spills across chrome counter stools. A half-empty coffee pot sits on a burner.

${DEMO_UNEXPLAINED_LINE}

LEO
(studying the booth)
You look rattled. Did someone follow you off the dock?

MAYA
No one followed me. Now give me the name on the manifest.

Maya places the brass key from Locker 14 onto the Formica table. Leo stares at the key, his jaw tightening.`;

export function createEmptyProject(title = "Untitled Film Project"): FilmProject {
  const now = new Date().toISOString();
  return {
    id: `proj-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    title,
    isDemo: false,
    createdAt: now,
    updatedAt: now,
    storyInput: {
      idea: "",
      genre: "Sci-Fi Thriller",
      duration: "6 minutes",
      tone: "Cinematic & Tense",
    },
    synopsis: "",
    mainConflict: "",
    characterNames: [],
    numberedSceneSummaries: [],
    screenplay: "",
    characters: [],
    scenes: [],
    auditReport: null,
    storyboardPanels: [],
  };
}

export function createDemoProject(): FilmProject {
  const now = new Date().toISOString();
  return {
    id: DEMO_PROJECT_ID,
    title: "The Harbor Manifest (Continuity Demo)",
    isDemo: true,
    createdAt: now,
    updatedAt: now,
    storyInput: {
      idea: "A detective investigating falsified harbor manifests meets an informant across three late-night locations.",
      genre: "Neo-Noir Crime",
      duration: "4 minutes",
      tone: "Moody, rainy neo-noir suspense",
    },
    synopsis:
      "Detective Maya Vance uncovers forged midnight freight manifests and follows a cryptic tip to Harbor Pier 9, where informant Leo Mercer agrees to reveal the mastermind at a late-night diner.",
    mainConflict:
      "Maya must secure the truth behind the altered manifests before whoever cut the locker padlock silences her informant.",
    characterNames: ["Detective Maya Vance", "Leo Mercer"],
    numberedSceneSummaries: [
      "Scene 1: Maya discovers tampered manifests in the precinct archive and leaves for Pier 9 wearing her blue jacket.",
      "Scene 2: On rain-slicked Pier 9, Maya (still in her blue jacket) meets informant Leo Mercer and recovers a brass key.",
      "Scene 3: At Bell's Diner, Maya abruptly appears in a red jacket without explanation as Leo reacts to the brass key.",
    ],
    screenplay: DEMO_SCREENPLAY,
    characters: [
      {
        id: "demo-char-maya",
        name: "Detective Maya Vance",
        physicalAppearance: "30s; wears a worn blue jacket with brass snaps in Scene 1 and Scene 2.",
        personality: "Focused, persistent, direct under pressure.",
        background: "Detective associated with Precinct 4.",
        motivations: "Uncover who altered the midnight freight manifests.",
        relationships: "Uses Leo Mercer as a reluctant harbor informant.",
        establishedFacts: [
          "Wears a worn blue jacket with brass snaps in Scene 1.",
          "Continues wearing the blue jacket in Scene 2 at Harbor Pier 9.",
          "Recovers a brass key from Locker 14.",
        ],
        dialogueStyle: "Crisp, investigative, no wasted words.",
      },
      {
        id: "demo-char-leo",
        name: "Leo Mercer",
        physicalAppearance: "40s; wears a charcoal wool coat.",
        personality: "Cautious, guarded, street-smart.",
        background: "Harbor informant familiar with Pier 9 operations.",
        motivations: "Stay unseen while trading information on the manifests.",
        relationships: "Informant to Detective Maya Vance.",
        establishedFacts: [
          "Meets Maya at Harbor Pier 9 in Scene 2.",
          "Directs Maya to Bell's Diner for a safer conversation.",
        ],
        dialogueStyle: "Wary, clipped, observant.",
      },
    ],
    scenes: [
      {
        id: "demo-scene-1",
        sceneNumber: 1,
        heading: "INT. PRECINCT ARCHIVE ROOM - NIGHT",
        location: "Precinct Archive Room",
        timeOfDay: "Night",
        charactersPresent: ["Detective Maya Vance"],
        action:
          "Maya reviews water-damaged freight manifests in a worn blue jacket, receives a 'PIER 9. ALONE.' text, and heads out.",
        dialogue: "MAYA: Three freight manifests, all signed after midnight.",
        cameraFraming: "Medium close-up over the ledger, tilting down to the glowing phone.",
        lighting: "Cold overhead fluorescent tubes with rain shadows from the basement window.",
        visualDescription:
          "Dark archival basement lined with steel cabinets; Maya in a blue canvas field jacket under cool fluorescent light.",
      },
      {
        id: "demo-scene-2",
        sceneNumber: 2,
        heading: "EXT. HARBOR PIER 9 - NIGHT",
        location: "Harbor Pier 9",
        timeOfDay: "Night",
        charactersPresent: ["Detective Maya Vance", "Leo Mercer"],
        action:
          "Maya arrives at Locker 14 in her rain-darkened blue jacket, speaks briefly with Leo Mercer, and pockets a brass key.",
        dialogue:
          "LEO: Not here. Too many eyes on the gantry. Meet me at Bell's Diner in twenty minutes.",
        cameraFraming: "Wide atmospheric two-shot framing Maya and Leo between wet shipping crates.",
        lighting: "Warm amber sodium vapor streetlamps cutting through dense harbor fog.",
        visualDescription:
          "Rain-drenched wooden pier under amber lamps; Maya in her blue jacket facing Leo in a charcoal coat.",
      },
      {
        id: "demo-scene-3",
        sceneNumber: 3,
        heading: "INT. BELL'S DINER - LATE NIGHT",
        location: "Bell's Diner",
        timeOfDay: "Late Night",
        charactersPresent: ["Detective Maya Vance", "Leo Mercer"],
        action:
          "Maya slides into the booth wearing a red jacket and places the brass key on the table.",
        dialogue: "MAYA: No one followed me. Now give me the name on the manifest.",
        cameraFraming: "Over-the-shoulder shot across the Formica diner table landing on the brass key.",
        lighting: "Red neon street sign spilling across chrome stools and vinyl booths.",
        visualDescription:
          "Moody retro diner bathed in red neon reflections and warm interior practicals.",
      },
    ],
    auditReport: null,
    storyboardPanels: [],
  };
}

export function hasUnexplainedDemoJacketLine(screenplay: string): boolean {
  return screenplay.includes(DEMO_UNEXPLAINED_LINE);
}

export function applyDemoContinuityFix(screenplay: string): string {
  if (screenplay.includes(DEMO_UNEXPLAINED_LINE)) {
    return screenplay.replace(DEMO_UNEXPLAINED_LINE, DEMO_EXPLAINED_LINE);
  }
  return screenplay;
}

export function loadProjectsFromStorage(
  storage: Pick<Storage, "getItem"> | null
): { projects: FilmProject[]; activeProjectId: string } {
  if (!storage) {
    const demo = createDemoProject();
    return { projects: [demo], activeProjectId: demo.id };
  }

  try {
    const raw = storage.getItem(STORAGE_KEY);
    if (!raw) {
      const demo = createDemoProject();
      return { projects: [demo], activeProjectId: demo.id };
    }

    const parsed = JSON.parse(raw) as {
      projects?: FilmProject[];
      activeProjectId?: string;
    };

    if (!Array.isArray(parsed.projects) || parsed.projects.length === 0) {
      const demo = createDemoProject();
      return { projects: [demo], activeProjectId: demo.id };
    }

    const activeExists = parsed.projects.some(
      (p) => p.id === parsed.activeProjectId
    );
    return {
      projects: parsed.projects,
      activeProjectId: activeExists
        ? (parsed.activeProjectId as string)
        : parsed.projects[0].id,
    };
  } catch {
    const demo = createDemoProject();
    return { projects: [demo], activeProjectId: demo.id };
  }
}

export function saveProjectsToStorage(
  storage: Pick<Storage, "setItem"> | null,
  projects: FilmProject[],
  activeProjectId: string
): void {
  if (!storage) return;
  try {
    storage.setItem(
      STORAGE_KEY,
      JSON.stringify({ projects, activeProjectId })
    );
  } catch {
    // Ignore storage quota errors gracefully
  }
}

export function computeScreenplayStats(screenplay: string): {
  wordCount: number;
  estimatedMinutes: number;
} {
  const trimmed = screenplay.trim();
  if (!trimmed) {
    return { wordCount: 0, estimatedMinutes: 0 };
  }
  const wordCount = trimmed.split(/\s+/).length;
  // Standard screenplay pacing ~150 words per screen minute, minimum 1 min when non-empty
  const estimatedMinutes = Math.max(1, Math.round(wordCount / 150));
  return { wordCount, estimatedMinutes };
}

export function sanitizeSlug(title: string): string {
  const cleaned = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return cleaned || "frameforge-project";
}

export function formatAuditReportMarkdown(project: FilmProject): string {
  const report = project.auditReport;
  if (!report) {
    return `# Narrative Consistency Report — ${project.title}\n\nNo audit has been run yet.\n`;
  }

  const lines: string[] = [
    `# Narrative Consistency Report — ${project.title}`,
    "",
    `- **Analyzed:** ${new Date(report.analyzedAt).toLocaleString()}`,
    `- **Status:** ${
      report.hasContradictions
        ? `${report.issues.length} Continuity Issue(s) Detected`
        : "No Continuity Contradictions Found"
    }`,
    "",
    "## Summary",
    report.summary,
    "",
  ];

  if (report.issues.length === 0) {
    lines.push("No continuity contradictions were found in this screenplay.");
  } else {
    lines.push("## Detected Issues", "");
    report.issues.forEach((issue, index) => {
      lines.push(
        `### ${index + 1}. ${issue.category} (${issue.severity} Severity)`,
        `- **Scenes:** ${issue.sceneReferences.join(", ")}`,
        `- **Evidence:** "${issue.evidence}"`,
        `- **Explanation:** ${issue.explanation}`,
        `- **Suggested Correction:** ${issue.suggestedCorrection}`,
        ""
      );
    });
  }

  return lines.join("\n");
}
