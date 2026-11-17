import React from "react";
import {
  Clapperboard,
  Film,
  FlaskConical,
  Images,
  LayoutDashboard,
  ShieldAlert,
  Sparkles,
  Users,
  X,
} from "lucide-react";
import type { NavSection } from "../types/frameforge";

interface SidebarProps {
  activeNav: NavSection;
  onSelectNav: (nav: NavSection) => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
  onLoadDemo: () => void;
  projectTitle: string;
  auditIssueCount: number | null;
}

const NAV_ITEMS: {
  id: NavSection;
  label: string;
  subtitle: string;
  icon: React.ComponentType<{ className?: string }>;
}[] = [
  {
    id: "dashboard",
    label: "Dashboard",
    subtitle: "Projects & Exports",
    icon: LayoutDashboard,
  },
  {
    id: "story",
    label: "Story Architect",
    subtitle: "Idea to Screenplay",
    icon: Sparkles,
  },
  {
    id: "characters",
    label: "Character Intelligence",
    subtitle: "Fact-Grounded Profiles",
    icon: Users,
  },
  {
    id: "scenes",
    label: "Scene Director",
    subtitle: "Shot & Lighting Breakdown",
    icon: Film,
  },
  {
    id: "auditor",
    label: "Narrative Auditor",
    subtitle: "Continuity Detection",
    icon: ShieldAlert,
  },
  {
    id: "storyboard",
    label: "Storyboard Studio",
    subtitle: "Visual Panels & Prompts",
    icon: Images,
  },
];

export default function Sidebar({
  activeNav,
  onSelectNav,
  mobileOpen,
  onCloseMobile,
  onLoadDemo,
  projectTitle,
  auditIssueCount,
}: SidebarProps) {
  const sidebarContent = (
    <div className="flex h-full flex-col bg-[#0c0d14] border-r border-white/10">
      {/* Brand Wordmark */}
      <div className="flex items-center justify-between px-5 py-5 border-b border-white/10">
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-violet-600 to-blue-600">
            <Clapperboard className="h-4 w-4 text-white" />
          </div>
          <div className="min-w-0">
            <span className="block text-base font-bold tracking-tight text-white whitespace-nowrap">
              FrameForge AI
            </span>
            <span className="block text-xs text-zinc-400 truncate">
              Filmmaking Studio
            </span>
          </div>
        </div>
        <button
          type="button"
          onClick={onCloseMobile}
          className="lg:hidden rounded-lg p-2 text-zinc-400 hover:bg-white/5 hover:text-white focus-visible:outline-2 focus-visible:outline-violet-500"
          aria-label="Close navigation menu"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Active Project Context */}
      <div className="px-5 py-4 border-b border-white/10">
        <p className="text-xs font-medium text-zinc-400">Active Project</p>
        <p className="mt-1 truncate text-sm font-semibold text-white">
          {projectTitle}
        </p>
      </div>

      {/* Primary Navigation */}
      <nav aria-label="Studio Modules" className="flex-1 space-y-1 px-3 py-4 overflow-y-auto">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = activeNav === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                onSelectNav(item.id);
                onCloseMobile();
              }}
              aria-current={isActive ? "page" : undefined}
              className={`group flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left transition-colors focus-visible:outline-2 focus-visible:outline-violet-500 ${
                isActive
                  ? "bg-violet-600/15 text-white border border-violet-500/35"
                  : "text-zinc-400 hover:bg-white/[0.04] hover:text-zinc-100 border border-transparent"
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <Icon
                  className={`h-4 w-4 shrink-0 ${
                    isActive
                      ? "text-blue-400"
                      : "text-zinc-500 group-hover:text-zinc-300"
                  }`}
                />
                <div className="min-w-0">
                  <div className="text-sm font-medium leading-tight truncate">
                    {item.label}
                  </div>
                  <div className="mt-0.5 text-xs text-zinc-500 truncate">
                    {item.subtitle}
                  </div>
                </div>
              </div>
              {item.id === "auditor" && auditIssueCount !== null && (
                <span
                  className={`ml-2 shrink-0 font-mono text-xs font-semibold tabular-nums ${
                    auditIssueCount > 0 ? "text-rose-400" : "text-emerald-400"
                  }`}
                >
                  {auditIssueCount}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Demo Action */}
      <div className="border-t border-white/10 p-4">
        <button
          type="button"
          onClick={() => {
            onLoadDemo();
            onCloseMobile();
          }}
          className="flex w-full items-center justify-center gap-2 rounded-lg border border-blue-500/40 bg-blue-600/15 px-4 py-2.5 text-xs font-semibold text-blue-300 transition-colors hover:bg-blue-600/25 whitespace-nowrap focus-visible:outline-2 focus-visible:outline-blue-400"
        >
          <FlaskConical className="h-4 w-4 shrink-0" />
          Load Continuity Demo
        </button>
        <p className="mt-2.5 text-center text-xs text-zinc-500">
          Your imagination. Your direction.
        </p>
      </div>
    </div>
  );

  return (
    <>
      <aside className="hidden lg:block lg:w-68 lg:shrink-0">
        {sidebarContent}
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <button
            type="button"
            aria-label="Dismiss navigation backdrop"
            className="fixed inset-0 bg-black/75 backdrop-blur-xs"
            onClick={onCloseMobile}
          />
          <div className="relative z-10 w-72 max-w-[85vw] h-full">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
}
