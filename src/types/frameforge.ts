export type NavSection =
  | "dashboard"
  | "story"
  | "characters"
  | "scenes"
  | "auditor"
  | "storyboard";

export interface StoryInput {
  idea: string;
  genre: string;
  duration: string;
  tone: string;
}

export interface CharacterProfile {
  id: string;
  name: string;
  physicalAppearance: string;
  personality: string;
  background: string;
  motivations: string;
  relationships: string;
  establishedFacts: string[];
  dialogueStyle: string;
}

export interface SceneBreakdown {
  id: string;
  sceneNumber: number;
  heading: string;
  location: string;
  timeOfDay: string;
  charactersPresent: string[];
  action: string;
  dialogue: string;
  cameraFraming: string;
  lighting: string;
  visualDescription: string;
}

export type AuditSeverity = "Low" | "Medium" | "High";

export interface AuditIssue {
  id: string;
  category: string;
  severity: AuditSeverity;
  sceneReferences: string[];
  evidence: string;
  explanation: string;
  suggestedCorrection: string;
}

export interface AuditReport {
  hasContradictions: boolean;
  summary: string;
  analyzedAt: string;
  issues: AuditIssue[];
}

export interface StoryboardPanel {
  id: string;
  sceneNumber: number;
  sceneHeading: string;
  mode: "image" | "prompt";
  imageDataUrl?: string;
  visualPrompt: string;
  shotType: string;
  cameraMovement: string;
  lightingNotes: string;
  colorPalette: string;
  generationNote?: string;
}

export interface FilmProject {
  id: string;
  title: string;
  isDemo: boolean;
  createdAt: string;
  updatedAt: string;
  storyInput: StoryInput;
  synopsis: string;
  mainConflict: string;
  characterNames: string[];
  numberedSceneSummaries: string[];
  screenplay: string;
  characters: CharacterProfile[];
  scenes: SceneBreakdown[];
  auditReport: AuditReport | null;
  storyboardPanels: StoryboardPanel[];
}
