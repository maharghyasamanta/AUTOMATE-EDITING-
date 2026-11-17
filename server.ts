import "dotenv/config";
import express from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, ThinkingLevel, Type } from "@google/genai";
import type {
  AuditReport,
  CharacterProfile,
  SceneBreakdown,
  StoryboardPanel,
} from "./src/types/frameforge";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const TEXT_MODEL = "gemini-4-hydrogen";
const FALLBACK_TEXT_MODEL = "gemini-3.1-flash-lite";
const IMAGE_MODEL = "gemini-3.1-flash-lite-image";

function getGeminiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === "MY_GEMINI_API_KEY") {
    throw new Error(
      "GEMINI_API_KEY is not configured. Please add a valid Gemini API key in Settings > Secrets."
    );
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
}

function extractReadableMessage(raw: string): string {
  try {
    const parsed = JSON.parse(raw) as { error?: { message?: string }; message?: string };
    if (parsed?.error?.message) return parsed.error.message;
    if (parsed?.message) return parsed.message;
  } catch {
    // raw is plain text
  }
  return raw;
}

function formatGeminiError(err: unknown): { status: number; message: string } {
  const raw = err instanceof Error ? err.message : String(err);
  const readable = extractReadableMessage(raw);
  if (raw.includes("GEMINI_API_KEY is not configured")) {
    return { status: 500, message: readable };
  }
  if (raw.includes("403") || raw.includes("PERMISSION_DENIED")) {
    return {
      status: 403,
      message:
        "Gemini API permission denied. Please verify your API key in Settings > Secrets.",
    };
  }
  if (raw.includes("400") || raw.includes("API_KEY_INVALID")) {
    return {
      status: 400,
      message:
        "Invalid Gemini API key or request. Please check your key in Settings > Secrets.",
    };
  }
  if (raw.includes("429") || raw.includes("RESOURCE_EXHAUSTED")) {
    return {
      status: 429,
      message:
        "Gemini API rate or quota limit reached. Please wait a moment or check your billing quota in Settings > Secrets.",
    };
  }
  if (raw.includes("503") || raw.includes("UNAVAILABLE")) {
    return {
      status: 503,
      message:
        "The Gemini model is temporarily experiencing high demand. Please retry in a few seconds.",
    };
  }
  return {
    status: 500,
    message: readable || "Unexpected server error while calling Gemini API.",
  };
}

function isTransientError(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err);
  return (
    msg.includes("503") ||
    msg.includes("500") ||
    msg.includes("UNAVAILABLE") ||
    msg.includes("ECONNRESET") ||
    msg.includes("ETIMEDOUT") ||
    msg.includes("timed out")
  );
}

function withTimeout<T>(promise: Promise<T>, ms = 14000): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`Gemini request timed out after ${ms}ms (ETIMEDOUT)`));
    }, ms);
    promise.then(
      (val) => {
        clearTimeout(timer);
        resolve(val);
      },
      (err) => {
        clearTimeout(timer);
        reject(err);
      }
    );
  });
}

async function withRetry<T>(
  fn: (useFallbackModel: boolean) => Promise<T>,
  maxAttempts = 2
): Promise<T> {
  let lastError: unknown;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const useFallback = attempt === maxAttempts && attempt > 1;
    try {
      return await withTimeout(fn(useFallback), 14000);
    } catch (err) {
      lastError = err;
      if (!isTransientError(err) || attempt === maxAttempts) {
        throw err;
      }
      await new Promise((r) => setTimeout(r, 300));
    }
  }
  throw lastError;
}

function safeJsonParse<T>(raw: string | undefined, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw.trim()) as T;
  } catch {
    return fallback;
  }
}

async function createApp() {
  const app = express();
  app.use(express.json({ limit: "4mb" }));

  app.get("/api/health", (_req, res) => {
    res.json({ ok: true, model: TEXT_MODEL });
  });

  // 1. Story Architect: Idea -> Title, Synopsis, Conflict, Characters, Scenes, Screenplay
  app.post("/api/story", async (req, res) => {
    try {
      const { idea, genre, duration, tone } = req.body as {
        idea?: string;
        genre?: string;
        duration?: string;
        tone?: string;
      };

      if (!idea || !idea.trim()) {
        return res.status(400).json({ error: "A story idea is required." });
      }

      const ai = getGeminiClient();
      const response = await withRetry((useFallback) =>
        ai.models.generateContent({
          model: useFallback ? FALLBACK_TEXT_MODEL : TEXT_MODEL,
          contents: [
            `Story Idea: ${idea.trim()}`,
            `Genre: ${genre || "Drama"}`,
            `Preferred Duration: ${duration || "5 minutes"}`,
            `Tone: ${tone || "Cinematic"}`,
          ].join("\n"),
          config: {
            systemInstruction:
              "You are an experienced screenwriter and story architect. Turn the user's film concept into a cohesive short screenplay package. Format the screenplay with clear SCENE 1, SCENE 2, etc. headers, standard INT./EXT. sluglines, concise visual action lines, and natural character dialogue. Keep all names, props, wardrobe, and timeline details strictly consistent across every scene.",
            thinkingConfig: {
              thinkingLevel: useFallback ? ThinkingLevel.LOW : ThinkingLevel.MEDIUM,
            },
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING, description: "Original film title." },
                synopsis: {
                  type: Type.STRING,
                  description: "Concise 2-4 sentence film synopsis.",
                },
                mainConflict: {
                  type: Type.STRING,
                  description: "Core dramatic conflict driving the story.",
                },
                characterNames: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                  description: "List of speaking or named characters in the script.",
                },
                numberedSceneSummaries: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                  description:
                    "Ordered scene summaries formatted like 'Scene 1: ...'.",
                },
                screenplay: {
                  type: Type.STRING,
                  description:
                    "Complete formatted screenplay with numbered SCENE headers, sluglines, action, and dialogue.",
                },
              },
              required: [
                "title",
                "synopsis",
                "mainConflict",
                "characterNames",
                "numberedSceneSummaries",
                "screenplay",
              ],
            },
          },
        })
      );

      const parsed = safeJsonParse(response.text, null as null | Record<string, unknown>);
      if (!parsed || typeof parsed.screenplay !== "string") {
        return res.status(502).json({
          error: "Gemini returned an incomplete story package. Please try again.",
        });
      }

      return res.json(parsed);
    } catch (err) {
      const { status, message } = formatGeminiError(err);
      return res.status(status).json({ error: message });
    }
  });

  // 2. Character Intelligence: Extract strictly screenplay-grounded character dossiers
  app.post("/api/characters", async (req, res) => {
    try {
      const { screenplay } = req.body as { screenplay?: string };
      if (!screenplay || !screenplay.trim()) {
        return res.status(400).json({ error: "Screenplay text is required." });
      }

      const ai = getGeminiClient();
      const response = await withRetry((useFallback) =>
        ai.models.generateContent({
          model: useFallback ? FALLBACK_TEXT_MODEL : TEXT_MODEL,
          contents: `Extract character profiles strictly from this screenplay:\n\n${screenplay}`,
          config: {
            systemInstruction:
              "You are a script supervisor building character intelligence profiles. Extract ONLY information explicitly stated or directly demonstrated in the provided screenplay. Do NOT invent backstories, physical details, ages, occupations, or motivations that are not supported by the text. If any attribute is not established in the screenplay, output the exact string 'Unknown'.",
            thinkingConfig: {
              thinkingLevel: useFallback ? ThinkingLevel.LOW : ThinkingLevel.MEDIUM,
            },
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                characters: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      name: { type: Type.STRING },
                      physicalAppearance: { type: Type.STRING },
                      personality: { type: Type.STRING },
                      background: { type: Type.STRING },
                      motivations: { type: Type.STRING },
                      relationships: { type: Type.STRING },
                      establishedFacts: {
                        type: Type.ARRAY,
                        items: { type: Type.STRING },
                      },
                      dialogueStyle: { type: Type.STRING },
                    },
                    required: [
                      "name",
                      "physicalAppearance",
                      "personality",
                      "background",
                      "motivations",
                      "relationships",
                      "establishedFacts",
                      "dialogueStyle",
                    ],
                  },
                },
              },
              required: ["characters"],
            },
          },
        })
      );

      const parsed = safeJsonParse<{
        characters?: Omit<CharacterProfile, "id">[];
      }>(response.text, {});

      const characters: CharacterProfile[] = (parsed.characters ?? []).map(
        (c, idx) => ({
          id: `char-${Date.now()}-${idx}`,
          name: c.name || `Character ${idx + 1}`,
          physicalAppearance: c.physicalAppearance || "Unknown",
          personality: c.personality || "Unknown",
          background: c.background || "Unknown",
          motivations: c.motivations || "Unknown",
          relationships: c.relationships || "Unknown",
          establishedFacts: Array.isArray(c.establishedFacts)
            ? c.establishedFacts
            : [],
          dialogueStyle: c.dialogueStyle || "Unknown",
        })
      );

      return res.json({ characters });
    } catch (err) {
      const { status, message } = formatGeminiError(err);
      return res.status(status).json({ error: message });
    }
  });

  // 3. Scene Director: Structured production breakdown for each scene
  app.post("/api/scenes", async (req, res) => {
    try {
      const { screenplay } = req.body as { screenplay?: string };
      if (!screenplay || !screenplay.trim()) {
        return res.status(400).json({ error: "Screenplay text is required." });
      }

      const ai = getGeminiClient();
      const response = await withRetry((useFallback) =>
        ai.models.generateContent({
          model: useFallback ? FALLBACK_TEXT_MODEL : TEXT_MODEL,
          contents: `Break this screenplay down into structured production scenes:\n\n${screenplay}`,
          config: {
            systemInstruction:
              "You are a film director and cinematographer. Convert every scene in the screenplay into a structured production breakdown preserving exact scene order, locations, characters, action, and key dialogue, while adding grounded camera framing, lighting, and visual description notes.",
            thinkingConfig: {
              thinkingLevel: useFallback ? ThinkingLevel.LOW : ThinkingLevel.MEDIUM,
            },
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                scenes: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      sceneNumber: { type: Type.INTEGER },
                      heading: { type: Type.STRING },
                      location: { type: Type.STRING },
                      timeOfDay: { type: Type.STRING },
                      charactersPresent: {
                        type: Type.ARRAY,
                        items: { type: Type.STRING },
                      },
                      action: { type: Type.STRING },
                      dialogue: { type: Type.STRING },
                      cameraFraming: { type: Type.STRING },
                      lighting: { type: Type.STRING },
                      visualDescription: { type: Type.STRING },
                    },
                    required: [
                      "sceneNumber",
                      "heading",
                      "location",
                      "timeOfDay",
                      "charactersPresent",
                      "action",
                      "dialogue",
                      "cameraFraming",
                      "lighting",
                      "visualDescription",
                    ],
                  },
                },
              },
              required: ["scenes"],
            },
          },
        })
      );

      const parsed = safeJsonParse<{
        scenes?: Omit<SceneBreakdown, "id">[];
      }>(response.text, {});

      const scenes: SceneBreakdown[] = (parsed.scenes ?? []).map((s, idx) => ({
        id: `scene-${Date.now()}-${idx}`,
        sceneNumber: typeof s.sceneNumber === "number" ? s.sceneNumber : idx + 1,
        heading: s.heading || `SCENE ${idx + 1}`,
        location: s.location || "Unspecified Location",
        timeOfDay: s.timeOfDay || "Unspecified",
        charactersPresent: Array.isArray(s.charactersPresent)
          ? s.charactersPresent
          : [],
        action: s.action || "",
        dialogue: s.dialogue || "",
        cameraFraming: s.cameraFraming || "Medium shot",
        lighting: s.lighting || "Naturalistic lighting",
        visualDescription: s.visualDescription || "",
      }));

      return res.json({ scenes });
    } catch (err) {
      const { status, message } = formatGeminiError(err);
      return res.status(status).json({ error: message });
    }
  });

  // 4. Narrative Consistency Auditor (Flagship Feature)
  app.post("/api/audit", async (req, res) => {
    try {
      const { screenplay, characters, scenes } = req.body as {
        screenplay?: string;
        characters?: CharacterProfile[];
        scenes?: SceneBreakdown[];
      };

      if (!screenplay || !screenplay.trim()) {
        return res.status(400).json({ error: "Screenplay text is required." });
      }

      const ai = getGeminiClient();

      const contextParts = [
        `SCREENPLAY:\n${screenplay}`,
        characters && characters.length > 0
          ? `\nESTABLISHED CHARACTER PROFILES:\n${JSON.stringify(characters, null, 2)}`
          : "",
        scenes && scenes.length > 0
          ? `\nSTRUCTURED SCENES:\n${JSON.stringify(scenes, null, 2)}`
          : "",
      ]
        .filter(Boolean)
        .join("\n");

      const response = await withRetry((useFallback) =>
        ai.models.generateContent({
          model: useFallback ? FALLBACK_TEXT_MODEL : TEXT_MODEL,
          contents: contextParts,
          config: {
            systemInstruction: [
              "You are an expert Narrative Continuity Auditor and Script Supervisor.",
              "Carefully inspect the screenplay scene-by-scene against earlier scenes and any established character facts.",
              "Detect ONLY genuine, unsupported contradictions across these categories:",
              "1. Character Appearance Inconsistency (e.g., unexplained wardrobe, color, or physical trait changes such as wearing a blue jacket in Scenes 1-2 and suddenly a red jacket in Scene 3 without explanation)",
              "2. Timeline Contradiction",
              "3. Location Continuity Error",
              "4. Relationship Inconsistency",
              "5. Personality Contradiction",
              "6. Missing Transition",
              "CRITICAL RULES:",
              "- Always treat the SCREENPLAY text as the primary, authoritative, up-to-date script if any structured scene or character metadata differs from the edited screenplay.",
              "- Do NOT classify intentional character development, emotional arcs, or explicitly explained changes (e.g., if the script explains WHY a character changed clothes, swapped a jacket, or moved locations) as contradictions.",
              "- Do NOT invent or fabricate errors.",
              "- If NO genuine contradiction exists, set hasContradictions to false, issues to [], and state clearly in summary that no continuity contradictions were found.",
              "- For each genuine issue, cite exact scene references, quote verbatim evidence from the screenplay, assign severity ('Low', 'Medium', or 'High'), explain the contradiction clearly, and provide a concrete suggested correction.",
            ].join("\n"),
            thinkingConfig: {
              thinkingLevel: useFallback ? ThinkingLevel.LOW : ThinkingLevel.MEDIUM,
            },
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                hasContradictions: { type: Type.BOOLEAN },
                summary: { type: Type.STRING },
                issues: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      category: { type: Type.STRING },
                      severity: {
                        type: Type.STRING,
                        enum: ["Low", "Medium", "High"],
                      },
                      sceneReferences: {
                        type: Type.ARRAY,
                        items: { type: Type.STRING },
                      },
                      evidence: { type: Type.STRING },
                      explanation: { type: Type.STRING },
                      suggestedCorrection: { type: Type.STRING },
                    },
                    required: [
                      "category",
                      "severity",
                      "sceneReferences",
                      "evidence",
                      "explanation",
                      "suggestedCorrection",
                    ],
                  },
                },
              },
              required: ["hasContradictions", "summary", "issues"],
            },
          },
        })
      );

      const parsed = safeJsonParse<{
        hasContradictions?: boolean;
        summary?: string;
        issues?: Array<{
          category: string;
          severity: "Low" | "Medium" | "High";
          sceneReferences: string[];
          evidence: string;
          explanation: string;
          suggestedCorrection: string;
        }>;
      }>(response.text, {});

      const issues = (parsed.issues ?? []).map((issue, idx) => ({
        id: `issue-${Date.now()}-${idx}`,
        category: issue.category || "Continuity Issue",
        severity:
          issue.severity === "High" ||
          issue.severity === "Medium" ||
          issue.severity === "Low"
            ? issue.severity
            : "Medium",
        sceneReferences: Array.isArray(issue.sceneReferences)
          ? issue.sceneReferences
          : [],
        evidence: issue.evidence || "",
        explanation: issue.explanation || "",
        suggestedCorrection: issue.suggestedCorrection || "",
      }));

      const report: AuditReport = {
        hasContradictions: issues.length > 0 && Boolean(parsed.hasContradictions ?? true),
        summary:
          parsed.summary ||
          (issues.length > 0
            ? `${issues.length} continuity issue(s) detected.`
            : "No continuity contradictions were found in this screenplay."),
        analyzedAt: new Date().toISOString(),
        issues,
      };

      return res.json(report);
    } catch (err) {
      const { status, message } = formatGeminiError(err);
      return res.status(status).json({ error: message });
    }
  });

  // 5. Storyboard Studio: Generate storyboard frames or detailed directorial prompts
  app.post("/api/storyboard", async (req, res) => {
    try {
      const { scenes, attemptImageGeneration = true } = req.body as {
        scenes?: SceneBreakdown[];
        attemptImageGeneration?: boolean;
      };

      if (!Array.isArray(scenes) || scenes.length === 0) {
        return res
          .status(400)
          .json({ error: "Structured scenes are required to generate storyboards." });
      }

      const ai = getGeminiClient();

      // Step A: Generate detailed visual prompts and cinematographic metadata via gemini-4-hydrogen
      const promptResponse = await withRetry((useFallback) =>
        ai.models.generateContent({
          model: useFallback ? FALLBACK_TEXT_MODEL : TEXT_MODEL,
          contents: `Create detailed cinematographic storyboard direction and image prompts for each of these scenes:\n\n${JSON.stringify(
            scenes,
            null,
            2
          )}`,
          config: {
            systemInstruction:
              "You are a storyboard artist and director of photography. For each scene, craft a vivid, specific visualPrompt (composition, subject wardrobe/props, environment, lighting, lens aesthetic) plus shotType, cameraMovement, lightingNotes, and colorPalette. Stay faithful to the scene details.",
            thinkingConfig: {
              thinkingLevel: useFallback ? ThinkingLevel.LOW : ThinkingLevel.MEDIUM,
            },
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                panels: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      sceneNumber: { type: Type.INTEGER },
                      sceneHeading: { type: Type.STRING },
                      visualPrompt: { type: Type.STRING },
                      shotType: { type: Type.STRING },
                      cameraMovement: { type: Type.STRING },
                      lightingNotes: { type: Type.STRING },
                      colorPalette: { type: Type.STRING },
                    },
                    required: [
                      "sceneNumber",
                      "sceneHeading",
                      "visualPrompt",
                      "shotType",
                      "cameraMovement",
                      "lightingNotes",
                      "colorPalette",
                    ],
                  },
                },
              },
              required: ["panels"],
            },
          },
        })
      );

      const parsed = safeJsonParse<{
        panels?: Array<{
          sceneNumber: number;
          sceneHeading: string;
          visualPrompt: string;
          shotType: string;
          cameraMovement: string;
          lightingNotes: string;
          colorPalette: string;
        }>;
      }>(promptResponse.text, {});

      const basePanels = (parsed.panels && parsed.panels.length > 0
        ? parsed.panels
        : scenes.map((s) => ({
            sceneNumber: s.sceneNumber,
            sceneHeading: s.heading,
            visualPrompt: `${s.visualDescription || s.action}. Framing: ${s.cameraFraming}. Lighting: ${s.lighting}.`,
            shotType: s.cameraFraming || "Medium Shot",
            cameraMovement: "Static / Subtle push-in",
            lightingNotes: s.lighting || "Naturalistic",
            colorPalette: "Deep charcoal, cool steel blue, warm amber highlights",
          })));

      // Step B: Attempt image generation with gemini-3.1-flash-lite-image if available;
      // gracefully fall back to detailed visual prompt panels if unavailable.
      let imageServiceAvailable = Boolean(attemptImageGeneration);
      let fallbackNote: string | undefined;

      const panels: StoryboardPanel[] = [];
      for (let i = 0; i < basePanels.length; i++) {
        const item = basePanels[i];
        let imageDataUrl: string | undefined;

        if (imageServiceAvailable) {
          try {
            const imgRes = await ai.models.generateContent({
              model: IMAGE_MODEL,
              contents: {
                parts: [
                  {
                    text: `Cinematic film storyboard still, 16:9 widescreen composition, ${item.shotType}, ${item.lightingNotes}. ${item.visualPrompt}. Color palette: ${item.colorPalette}. No text overlays or watermarks.`,
                  },
                ],
              },
              config: {
                imageConfig: {
                  aspectRatio: "16:9",
                },
              },
            });

            for (const part of imgRes.candidates?.[0]?.content?.parts ?? []) {
              if (part.inlineData?.data) {
                const mime = part.inlineData.mimeType ?? "image/png";
                imageDataUrl = `data:${mime};base64,${part.inlineData.data}`;
                break;
              }
            }
          } catch {
            // Image generation unavailable or requires paid tier; fall back cleanly to prompt mode
            imageServiceAvailable = false;
            fallbackNote =
              "Image generation is unavailable in this environment; showing detailed directorial visual prompts for each scene.";
          }
        }

        panels.push({
          id: `panel-${Date.now()}-${i}`,
          sceneNumber: item.sceneNumber,
          sceneHeading: item.sceneHeading,
          mode: imageDataUrl ? "image" : "prompt",
          imageDataUrl,
          visualPrompt: item.visualPrompt,
          shotType: item.shotType,
          cameraMovement: item.cameraMovement,
          lightingNotes: item.lightingNotes,
          colorPalette: item.colorPalette,
          generationNote: imageDataUrl ? undefined : fallbackNote,
        });
      }

      return res.json({ panels });
    } catch (err) {
      const { status, message } = formatGeminiError(err);
      return res.status(status).json({ error: message });
    }
  });

  // Vite middleware (dev) or static dist serving (production)
  const isProd = process.env.NODE_ENV === "production";
  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(__dirname, "dist");
    app.use(express.static(distDir));
    app.get("*", (_req, res) => {
      const indexFile = path.join(distDir, "index.html");
      if (fs.existsSync(indexFile)) {
        res.sendFile(indexFile);
      } else {
        res.status(404).send("Application build not found.");
      }
    });
  }

  const PORT = Number(process.env.PORT) || 3000;
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`FrameForge AI server running on http://0.0.0.0:${PORT}`);
  });
}

createApp().catch((err) => {
  console.error("Failed to start FrameForge AI server:", err);
  process.exit(1);
});
