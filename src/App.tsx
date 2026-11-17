import { useCallback, useEffect, useState } from "react";
import { Globe, Menu } from "lucide-react";
import type { FilmProject, NavSection } from "./types/frameforge";
import {
  createDemoProject,
  createEmptyProject,
  DEMO_PROJECT_ID,
  loadProjectsFromStorage,
  saveProjectsToStorage,
} from "./utils/projectHelpers";
import LandingPage from "./components/LandingPage";
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

function getInitialMode(): "landing" | "studio" {
  if (typeof window === "undefined") return "landing";
  const params = new URLSearchParams(window.location.search);
  if (params.get("autostart") === "1" || params.get("view") === "studio") {
    return "studio";
  }
  return "landing";
}

export default function App() {
  const [viewMode, setViewMode] = useState<"landing" | "studio">(getInitialMode);
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

  function handleEnterStudio(section: NavSection = "dashboard") {
    setActiveNav(section);
    setViewMode("studio");
    window.scrollTo(0, 0);
  }

  if (viewMode === "landing") {
    return <LandingPage onEnterStudio={handleEnterStudio} />;
  }

  const auditIssueCount = activeProject.auditReport
    ? activeProject.auditReport.issues.length
    : null;

  return (
    <div className="relative flex min-h-screen bg-[#08090f] text-zinc-100">
      <div
        className="studio-ambient-bg pointer-events-none fixed inset-0 z-0"
        aria-hidden="true"
      />

      <Sidebar
        activeNav={activeNav}
        onSelectNav={setActiveNav}
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
        onLoadDemo={handleLoadDemo}
        projectTitle={activeProject.title}
        auditIssueCount={auditIssueCount}
      />

      <div className="relative z-10 flex flex-1 flex-col min-w-0">
        {/* Clean 3-Zone Top Bar */}
        <header className="sticky top-0 z-30 flex items-center justify-between gap-6 border-b border-white/10 bg-[#08090f]/75 px-4 py-3 backdrop-blur-xl sm:px-6 lg:px-8">
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

          <div className="flex items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={() => setViewMode("landing")}
              className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-[#10121b] px-3 py-2 text-xs font-medium text-zinc-300 hover:text-white hover:bg-[#171926] transition-colors whitespace-nowrap shrink-0"
            >
              <Globe className="h-3.5 w-3.5 text-emerald-400" />
              <span>Earth Landing</span>
            </button>
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
