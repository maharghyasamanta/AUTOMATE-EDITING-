import test from "node:test";
import assert from "node:assert/strict";
import { getScenesDraftSignature, getStoryDraftSignature } from "./autoSave";

test("getStoryDraftSignature changes when any draft field changes", () => {
  const base = {
    storyInput: {
      idea: "An archivist hears echoes from empty reels.",
      genre: "Mystery",
      duration: "5 minutes",
      tone: "Moody",
    },
    title: "Echo Reel",
    synopsis: "A sound archivist uncovers a lost tape.",
    mainConflict: "The tape implicates her mentor.",
    screenplay: "SCENE 1\nINT. ARCHIVE - NIGHT",
  };

  const sig1 = getStoryDraftSignature(base);
  const sig2 = getStoryDraftSignature({ ...base, title: "Echo Reel II" });
  assert.notEqual(sig1, sig2);
  assert.equal(sig1, getStoryDraftSignature({ ...base }));
});

test("getScenesDraftSignature detects scene edits", () => {
  const scenes = [
    {
      id: "s1",
      sceneNumber: 1,
      heading: "INT. LAB - DAY",
      location: "Lab",
      timeOfDay: "Day",
      charactersPresent: ["Ada"],
      action: "Ada calibrates the lens.",
      dialogue: "ADA: Ready.",
      cameraFraming: "Close-up",
      lighting: "Cool daylight",
      visualDescription: "Clean optical bench.",
    },
  ];
  const s1 = getScenesDraftSignature(scenes);
  const s2 = getScenesDraftSignature([{ ...scenes[0], lighting: "Warm tungsten" }]);
  assert.notEqual(s1, s2);
});
