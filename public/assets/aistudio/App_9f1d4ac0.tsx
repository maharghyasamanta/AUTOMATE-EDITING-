import { useCallback, useEffect, useState } from "react";
import { Menu } from "lucide-react";
import type { FilmProject, NavSection } from "./types/frameforge";
import {
  createDemoProject,
  createEmptyProject,
  DEMO_PROJECT_ID,
  loadProjectsFromStorage,
  saveProjectsToStorage,
} from "./utils/projectHelpers";
import Sidebar from "./components/Sidebar";
import DashboardView from "./components/DashboardView";
import StoryArchitectView from "./components/StoryArchitectView";
import CharacterIntelligenceView from "./components/CharacterIntelligenceView";
import SceneDirectorView from "./components/SceneDirectorView";
import NarrativeAuditorView from "./components/NarrativeAuditorView";
import StoryboardStudioView from "./components/StoryboardStudioView";

const SECTION_LABEL: Record<NavSection, string> = {
  dashboard: "Dashboard",
  story: "Story Architect",
  characters: "Character Intelligence",
  scenes: "Scene Director",
  auditor: "Narrative Auditor",
  storyboard: "Storyboard Studio",
};

export default function App() {
  const [initialState] = useState(() =>
    loadProjectsFromStorage(typeof window !== "undefined" ? window.localStorage : null)
  );
  const [projects, setProjects] = useState<FilmProject[]>(initialState.projects);
  const [activeProjectId, setActiveProjectId] = useState<string>(
    initialState.activeProjectId
  );
  const [activeNav, setActiveNav] = useState<NavSection>("dashboard");
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    saveProjectsToStorage(window.localStorage, projects, activeProjectId);
  }, [projects, activeProjectId]);

  const activeProject =
    projects.find((p) => p.id === activeProjectId) ?? projects[0];

  const updateActiveProject = useCallback(
    (updater: (prev: FilmProject) => FilmProject) => {
      setProjects((prevProjects) =>
        prevProjects.map((proj) => {
          if (proj.id !== activeProjectId) return proj;
          const updated = updater(proj);
          return {
            ...updated,
            updatedAt: new Date().toISOString(),
          };
        })
      );
    },
    [activeProjectId]
  );

  function handleCreateProject() {
    const newProj = createEmptyProject(`Untitled Project ${projects.length + 1}`);
    setProjects((prev) => [newProj, ...prev]);
    setActiveProjectId(newProj.id);
    setActiveNav("story");
  }

  function handleDeleteProject(id: string) {
    setProjects((prev) => {
      const remaining = prev.filter((p) => p.id !== id);
      if (remaining.length === 0) {
        const fallback = createEmptyProject("New Film Project");
        setActiveProjectId(fallback.id);
        return [fallback];
      }
      if (id === activeProjectId) {
        setActiveProjectId(remaining[0].id);
      }
      return remaining;
    });
  }

  function handleLoadDemo() {
    const freshDemo = createDemoProject();
    setProjects((prev) => {
      const exists = prev.some((p) => p.id === DEMO_PROJECT_ID);
      return exists
        ? prev.map((p) => (p.id === DEMO_PROJECT_ID ? freshDemo : p))
        : [freshDemo, ...prev];
    });
    setActiveProjectId(DEMO_PROJECT_ID);
    setActiveNav("auditor");
  }

  const auditIssueCount = activeProject.auditReport
    ? activeProject.auditReport.issues.length
    : null;

  return (
    <div className="flex min-h-screen bg-[#08090f] text-zinc-100">
      <Sidebar
        activeNav={activeNav}
        onSelectNav={setActiveNav}
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
        onLoadDemo={handleLoadDemo}
        projectTitle={activeProject.title}
        auditIssueCount={auditIssueCount}
      />

      <div className="flex flex-1 flex-col min-w-0">
        {/* Clean 3-Zone Top Bar */}
        <header className="sticky top-0 z-30 flex items-center justify-between gap-6 border-b border-white/10 bg-[#08090f]/90 px-4 py-3 backdrop-blur-md sm:px-6 lg:px-8">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              className="lg:hidden rounded-lg border border-white/10 bg-[#10121b] p-2 text-zinc-300 hover:text-white focus-visible:outline-2 focus-visible:outline-violet-500"
              aria-label="Open navigation menu"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div className="flex items-center gap-2 text-sm min-w-0">
              <span className="font-semibold text-white truncate max-w-[160px] sm:max-w-xs">
                {activeProject.title}
              </span>
              <span aria-hidden="true" className="text-zinc-600">
                /
              </span>
              <span className="text-zinc-400 whitespace-nowrap">
                {SECTION_LABEL[activeNav]}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={handleCreateProject}
              className="rounded-lg border border-white/15 bg-[#10121b] px-3.5 py-2 text-xs font-semibold text-zinc-200 hover:bg-[#171926] transition-colors whitespace-nowrap shrink-0"
            >
              New Project
            </button>
          </div>
        </header>

        {/* Main Studio Canvas */}
        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8 max-w-7xl w-full mx-auto">
          {activeNav === "dashboard" && (
            <DashboardView
              projects={projects}
              activeProject={activeProject}
              onSelectProject={(id) => setActiveProjectId(id)}
              onCreateProject={handleCreateProject}
              onDeleteProject={handleDeleteProject}
              onLoadDemo={handleLoadDemo}
              onNavigate={setActiveNav}
            />
          )}

          {activeNav === "story" && (
            <StoryArchitectView
              project={activeProject}
              onUpdateProject={updateActiveProject}
              onNavigate={setActiveNav}
            />
          )}

          {activeNav === "characters" && (
            <CharacterIntelligenceView
              project={activeProject}
              onUpdateProject={updateActiveProject}
              onNavigate={setActiveNav}
            />
          )}

          {activeNav === "scenes" && (
            <SceneDirectorView
              project={activeProject}
              onUpdateProject={updateActiveProject}
              onNavigate={setActiveNav}
            />
          )}

          {activeNav === "auditor" && (
            <NarrativeAuditorView
              project={activeProject}
              onUpdateProject={updateActiveProject}
              onNavigate={setActiveNav}
            />
          )}

          {activeNav === "storyboard" && (
            <StoryboardStudioView
              project={activeProject}
              onUpdateProject={updateActiveProject}
              onNavigate={setActiveNav}
            />
          )}
        </main>
      </div>
    </div>
  );
}
