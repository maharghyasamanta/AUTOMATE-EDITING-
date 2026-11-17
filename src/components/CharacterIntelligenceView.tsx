import React, { useEffect, useState } from "react";
import { ArrowRight, Check, Loader2, Plus, Save, Trash2, Users } from "lucide-react";
import type { CharacterProfile, FilmProject, NavSection } from "../types/frameforge";

interface CharacterIntelligenceViewProps {
  project: FilmProject;
  onUpdateProject: (updater: (prev: FilmProject) => FilmProject) => void;
  onNavigate: (nav: NavSection) => void;
}

export default function CharacterIntelligenceView({
  project,
  onUpdateProject,
  onNavigate,
}: CharacterIntelligenceViewProps) {
  const [sourceScript, setSourceScript] = useState(project.screenplay);
  const [characters, setCharacters] = useState<CharacterProfile[]>(project.characters);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedNotice, setSavedNotice] = useState(false);

  useEffect(() => {
    setSourceScript(project.screenplay);
    setCharacters(project.characters);
  }, [project.id, project.updatedAt]);

  async function handleExtract() {
    setError(null);
    if (!sourceScript.trim()) {
      setError("Please paste or generate a screenplay first.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/characters", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ screenplay: sourceScript }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Character extraction failed.");
      }

      setCharacters(data.characters);
      onUpdateProject((prev) => ({
        ...prev,
        screenplay: sourceScript,
        characters: data.characters,
      }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to extract characters.");
    } finally {
      setLoading(false);
    }
  }

  function updateCharacterField(
    id: string,
    field: keyof CharacterProfile,
    value: string | string[]
  ) {
    setCharacters((prev) =>
      prev.map((char) => (char.id === id ? { ...char, [field]: value } : char))
    );
  }

  function handleAddCharacter() {
    const newChar: CharacterProfile = {
      id: `char-${Date.now()}`,
      name: "New Character",
      physicalAppearance: "Unknown",
      personality: "Unknown",
      background: "Unknown",
      motivations: "Unknown",
      relationships: "Unknown",
      establishedFacts: [],
      dialogueStyle: "Unknown",
    };
    setCharacters((prev) => [...prev, newChar]);
  }

  function handleRemoveCharacter(id: string) {
    setCharacters((prev) => prev.filter((c) => c.id !== id));
  }

  function handleSaveCharacters() {
    onUpdateProject((prev) => ({
      ...prev,
      screenplay: sourceScript,
      characters,
    }));
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 2000);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Character Intelligence</h1>
          <p className="mt-1 text-sm text-zinc-400">
            Profiles extracted strictly from screenplay evidence. Unsupported details are marked
            as Unknown.
          </p>
        </div>

        {characters.length > 0 && (
          <button
            type="button"
            onClick={() => onNavigate("scenes")}
            className="inline-flex items-center gap-2 self-start rounded-lg border border-blue-500/40 bg-blue-600/15 px-4 py-2 text-xs font-semibold text-blue-300 hover:bg-blue-600/25 transition-colors whitespace-nowrap shrink-0"
          >
            Next: Scene Director
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {error && (
        <div
          role="alert"
          className="rounded-lg border border-rose-500/40 bg-rose-500/10 px-4 py-3 text-sm text-rose-200"
        >
          {error}
        </div>
      )}

      {/* Source Screenplay Input */}
      <section className="rounded-xl border border-white/10 bg-[#10121b] p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <label
            htmlFor="character-source-script"
            className="text-base font-semibold text-white"
          >
            Screenplay Input
          </label>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setSourceScript(project.screenplay)}
              className="rounded-lg border border-white/10 bg-[#0b0c13] px-3.5 py-2 text-xs font-medium text-zinc-300 hover:bg-[#171926] whitespace-nowrap"
            >
              Sync from Project Script
            </button>
            <button
              type="button"
              disabled={loading}
              onClick={handleExtract}
              className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-violet-600 to-blue-600 px-4 py-2 text-xs font-semibold text-white hover:opacity-90 disabled:opacity-50 whitespace-nowrap"
            >
              {loading ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Extracting Profiles...
                </>
              ) : (
                <>
                  <Users className="h-3.5 w-3.5" />
                  Extract Character Intelligence
                </>
              )}
            </button>
          </div>
        </div>

        <textarea
          id="character-source-script"
          rows={6}
          value={sourceScript}
          onChange={(e) => setSourceScript(e.target.value)}
          placeholder="Paste screenplay text here or generate one in Story Architect..."
          className="w-full rounded-lg border border-white/10 bg-[#07080d] p-3.5 font-mono text-xs leading-relaxed text-zinc-200 focus:border-violet-500 focus:outline-none"
        />
      </section>

      {/* Character Cards Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-white tabular-nums">
          Character Profiles ({characters.length})
        </h2>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleAddCharacter}
            className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-[#10121b] px-3.5 py-2 text-xs font-semibold text-zinc-200 hover:bg-[#171926] whitespace-nowrap"
          >
            <Plus className="h-3.5 w-3.5" />
            Add Character
          </button>
          <button
            type="button"
            onClick={handleSaveCharacters}
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
                Save All Edits
              </>
            )}
          </button>
        </div>
      </div>

      {characters.length === 0 ? (
        <div className="rounded-xl border border-dashed border-white/15 bg-[#10121b]/60 p-10 text-center space-y-3">
          <p className="text-sm font-medium text-zinc-300">
            No character profiles extracted yet.
          </p>
          <p className="text-xs text-zinc-500 max-w-md mx-auto">
            Click Extract Character Intelligence above to analyze your screenplay without
            inventing unsupported traits.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {characters.map((char) => (
            <article
              key={char.id}
              className="rounded-xl border border-white/10 bg-[#10121b] p-5 space-y-4"
            >
              <div className="flex items-center justify-between gap-3 border-b border-white/10 pb-3">
                <label className="sr-only" htmlFor={`char-name-${char.id}`}>
                  Character Name
                </label>
                <input
                  id={`char-name-${char.id}`}
                  type="text"
                  value={char.name}
                  onChange={(e) => updateCharacterField(char.id, "name", e.target.value)}
                  className="w-full bg-transparent text-lg font-bold text-white focus:outline-none focus:ring-1 focus:ring-violet-500 rounded px-1"
                />
                <button
                  type="button"
                  onClick={() => handleRemoveCharacter(char.id)}
                  className="rounded-lg p-1.5 text-zinc-500 hover:bg-rose-500/10 hover:text-rose-400"
                  aria-label={`Remove ${char.name}`}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                {(
                  [
                    ["physicalAppearance", "Physical Appearance"],
                    ["personality", "Personality"],
                    ["background", "Background"],
                    ["motivations", "Motivations"],
                    ["relationships", "Relationships"],
                    ["dialogueStyle", "Dialogue Style"],
                  ] as const
                ).map(([field, label]) => (
                  <div key={field} className={field === "relationships" ? "sm:col-span-2" : ""}>
                    <label
                      htmlFor={`char-${field}-${char.id}`}
                      className="block text-xs font-medium text-zinc-400 mb-1"
                    >
                      {label}
                    </label>
                    <textarea
                      id={`char-${field}-${char.id}`}
                      rows={2}
                      value={char[field]}
                      onChange={(e) => updateCharacterField(char.id, field, e.target.value)}
                      className="w-full rounded-lg border border-white/10 bg-[#08090f] p-2.5 text-xs text-zinc-200 leading-relaxed focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                ))}
              </div>

              <div>
                <label
                  htmlFor={`char-facts-${char.id}`}
                  className="block text-xs font-medium text-blue-300 mb-1"
                >
                  Established Facts (One per line)
                </label>
                <textarea
                  id={`char-facts-${char.id}`}
                  rows={3}
                  value={char.establishedFacts.join("\n")}
                  onChange={(e) =>
                    updateCharacterField(
                      char.id,
                      "establishedFacts",
                      e.target.value.split("\n")
                    )
                  }
                  className="w-full rounded-lg border border-white/10 bg-[#08090f] p-2.5 text-xs text-zinc-200 leading-relaxed focus:border-blue-500 focus:outline-none"
                />
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
