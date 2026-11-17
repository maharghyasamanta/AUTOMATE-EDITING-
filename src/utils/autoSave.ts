import type { SceneBreakdown, StoryInput } from "../types/frameforge";

export const AUTO_SAVE_DELAY_MS = 800;

export interface StoryDraftFields {
  storyInput: StoryInput;
  title: string;
  synopsis: string;
  mainConflict: string;
  screenplay: string;
}

export function getStoryDraftSignature(draft: StoryDraftFields): string {
  return JSON.stringify({
    idea: draft.storyInput.idea,
    genre: draft.storyInput.genre,
    duration: draft.storyInput.duration,
    tone: draft.storyInput.tone,
    title: draft.title,
    synopsis: draft.synopsis,
    mainConflict: draft.mainConflict,
    screenplay: draft.screenplay,
  });
}

export function getScenesDraftSignature(scenes: SceneBreakdown[]): string {
  return JSON.stringify(scenes);
}
