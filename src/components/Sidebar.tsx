import React, { useEffect, useRef, useState } from "react";
import { LayoutGroup, MotionConfig, motion } from "motion/react";
import {
  Film,
  FlaskConical,
  Home,
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
  onGoHome: () => void;
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
  onGoHome,
  projectTitle,
  auditIssueCount,
}: SidebarProps) {
  const desktopRef = useRef<HTMLDivElement>(null);
  const mobileRef = useRef<HTMLDivElement>(null);
  const closeTimerRef = useRef<number | null>(null);
  const [clickPulse, setClickPulse] = useState<{
    id: NavSection;
    tick: number;
  } | null>(null);

  useEffect(() => {
    return () => {
      if (closeTimerRef.current !== null) {
        window.clearTimeout(closeTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const supportsAtProperty =
      typeof CSS !== "undefined" && typeof CSS.registerProperty === "function";
    if (supportsAtProperty) return;

    let frameId = 0;
    let angle = 0;
    const tick = () => {
      angle = (angle + 1.1) % 360;
      const targets = [
        ...(desktopRef.current?.querySelectorAll<HTMLElement>(
          ".liquid-edge-ring, .liquid-home-ring, .liquid-home-glow"
        ) ?? []),
        ...(mobileRef.current?.querySelectorAll<HTMLElement>(
          ".liquid-edge-ring, .liquid-home-ring, .liquid-home-glow"
        ) ?? []),
      ];
      for (const el of targets) {
        el.style.setProperty("--angle", `${angle}deg`);
      }
      frameId = requestAnimationFrame(tick);
    };
    frameId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameId);
  }, [mobileOpen]);

  function handleSelectTab(id: NavSection, isMobileDrawer: boolean) {
    setClickPulse((prev) => ({
      id,
      tick: (prev?.tick ?? 0) + 1,
    }));
    onSelectNav(id);

    if (closeTimerRef.current !== null) {
      window.clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }

    if (isMobileDrawer) {
      closeTimerRef.current = window.setTimeout(() => {
        closeTimerRef.current = null;
        onCloseMobile();
      }, 220);
    }
  }

  function renderHomeButton(sizeClass: string, iconSizeClass: string) {
    return (
      <div className="liquid-home-capsule shrink-0">
        <button
          type="button"
          onClick={() => {
            onGoHome();
            onCloseMobile();
          }}
          aria-label="Home — Earth Landing"
          title="Return to Home"
          className={`liquid-home-btn ${sizeClass} focus-visible:outline-2 focus-visible:outline-violet-400`}
        >
          <span className="liquid-home-glow" aria-hidden="true" />
          <span className="liquid-home-ring" aria-hidden="true" />
          <Home className={`relative z-10 text-white ${iconSizeClass}`} />
        </button>
      </div>
    );
  }

  function renderNavList(scope: "desktop" | "mobile") {
    const isMobileDrawer = scope === "mobile";
    return (
      <LayoutGroup id={`sidebar-nav-${scope}`}>
        <nav aria-label="Studio Modules" className="space-y-2.5">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = activeNav === item.id;
            const isClicked = clickPulse?.id === item.id;
            const pulseKey = isClicked ? clickPulse.tick : 0;

            return (
              <motion.button
                key={item.id}
                type="button"
                onClick={() => handleSelectTab(item.id, isMobileDrawer)}
                aria-current={isActive ? "page" : undefined}
                whileHover={{ y: -1 }}
                whileTap={{ scaleX: 1.03, scaleY: 0.94 }}
                animate={
                  isClicked
                    ? {
                        scaleX: [1.03, 0.982, 1.012, 1],
                        scaleY: [0.94, 1.03, 0.992, 1],
                      }
                    : { scaleX: 1, scaleY: 1 }
                }
                transition={{
                  duration: 0.36,
                  ease: [0.22, 1.28, 0.36, 1],
                }}
                style={{ transformOrigin: "center" }}
                className={`liquid-nav-btn group flex w-full items-center justify-between px-3 py-2.5 text-left focus-visible:outline-2 focus-visible:outline-violet-400 ${
                  isActive ? "text-white" : "text-zinc-300 hover:text-white"
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId={`liquid-active-glass-pill-${scope}`}
                    className="liquid-active-pill"
                    aria-hidden="true"
                    transition={{
                      type: "spring",
                      stiffness: 340,
                      damping: 26,
                      mass: 0.85,
                    }}
                  />
                )}

                {isClicked && (
                  <span className="liquid-sheen-clip" aria-hidden="true">
                    <motion.span
                      key={`sheen-${pulseKey}`}
                      className="liquid-click-sheen"
                      initial={{ x: "-115%", opacity: 0.85 }}
                      animate={{ x: "120%", opacity: 0 }}
                      transition={{ duration: 0.42, ease: [0.16, 1, 0.3, 1] }}
                    />
                  </span>
                )}

                <span className="liquid-edge-ring" aria-hidden="true" />

                <div className="relative z-10 flex items-center gap-3 min-w-0">
                  <motion.span
                    animate={
                      isClicked
                        ? { scale: [0.88, 1.14, 1] }
                        : { scale: 1 }
                    }
                    transition={{
                      type: "spring",
                      stiffness: 460,
                      damping: 18,
                    }}
                    className={`liquid-icon-orb flex h-9 w-9 shrink-0 items-center justify-center ${
                      isActive
                        ? "liquid-icon-orb-active text-white"
                        : "text-zinc-400 group-hover:text-blue-300 group-hover:border-violet-400/35"
                    }`}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                  </motion.span>
                  <div className="min-w-0">
                    <div
                      className={`text-sm font-semibold leading-tight truncate ${
                        isActive
                          ? "text-white"
                          : "text-zinc-200 group-hover:text-white"
                      }`}
                    >
                      {item.label}
                    </div>
                    <div
                      className={`mt-0.5 text-xs truncate ${
                        isActive
                          ? "text-blue-100/85"
                          : "text-zinc-400 group-hover:text-zinc-300"
                      }`}
                    >
                      {item.subtitle}
                    </div>
                  </div>
                </div>

                {item.id === "auditor" && auditIssueCount !== null && (
                  <span
                    className={`relative z-10 ml-2 shrink-0 font-mono text-xs font-semibold tabular-nums ${
                      auditIssueCount > 0 ? "text-rose-300" : "text-emerald-300"
                    }`}
                  >
                    {auditIssueCount}
                  </span>
                )}
              </motion.button>
            );
          })}
        </nav>
      </LayoutGroup>
    );
  }

  function renderFooter() {
    return (
      <div className="border-t border-white/10 p-4">
        <button
          type="button"
          onClick={() => {
            onLoadDemo();
            onCloseMobile();
          }}
          className="liquid-demo-btn flex w-full items-center justify-center gap-2 px-4 py-2.5 text-xs font-semibold text-blue-100 whitespace-nowrap focus-visible:outline-2 focus-visible:outline-blue-400"
        >
          <FlaskConical className="h-4 w-4 shrink-0 text-blue-300" />
          Load Continuity Demo
        </button>
        <p className="mt-2.5 text-center text-xs text-zinc-500">
          Your imagination. Your direction.
        </p>
      </div>
    );
  }

  return (
    <MotionConfig reducedMotion="user">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:block lg:w-80 lg:shrink-0 lg:sticky lg:top-0 lg:h-screen">
        <div
          ref={desktopRef}
          className="flex h-full flex-col bg-[#0a0a0f] border-r border-white/10"
        >
          <div className="flex items-center gap-3 px-5 py-4 border-b border-white/10">
            {renderHomeButton("h-11 w-11", "h-5 w-5")}
            <div className="min-w-0">
              <span className="block text-base font-bold tracking-tight text-white whitespace-nowrap">
                FrameForge AI
              </span>
              <span className="block text-xs text-zinc-400 truncate">
                Filmmaking Studio
              </span>
            </div>
          </div>

          <div className="px-5 py-3.5 border-b border-white/10">
            <p className="text-xs font-medium text-zinc-400">Active Project</p>
            <p className="mt-1 truncate text-sm font-semibold text-white">
              {projectTitle}
            </p>
          </div>

          <div className="flex-1 px-3.5 py-4 overflow-y-auto overflow-x-hidden">
            {renderNavList("desktop")}
          </div>

          {renderFooter()}
        </div>
      </aside>

      {/* Mobile Navigation Drawer (390px max-width: Home circle left + Vertical menu list right) */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <button
            type="button"
            aria-label="Dismiss navigation backdrop"
            className="fixed inset-0 bg-black/75 backdrop-blur-xs"
            onClick={onCloseMobile}
          />
          <div
            ref={mobileRef}
            className="relative z-10 flex h-full w-full max-w-[390px] flex-col bg-[#0a0a0f] border-r border-white/10 shadow-2xl"
          >
            <div className="flex items-center justify-between px-4 py-3.5 border-b border-white/10">
              <div className="min-w-0">
                <span className="block text-sm font-bold tracking-tight text-white truncate">
                  FrameForge AI
                </span>
                <span className="block text-xs text-zinc-400 truncate">
                  {projectTitle}
                </span>
              </div>
              <button
                type="button"
                onClick={onCloseMobile}
                className="rounded-xl p-2 text-zinc-400 hover:bg-white/5 hover:text-white focus-visible:outline-2 focus-visible:outline-violet-500"
                aria-label="Close navigation menu"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex flex-1 items-start gap-3 px-3 py-4 overflow-y-auto overflow-x-hidden">
              <div className="pt-0.5 shrink-0">
                {renderHomeButton("h-12 w-12", "h-5 w-5")}
              </div>
              <div className="flex-1 min-w-0">{renderNavList("mobile")}</div>
            </div>

            {renderFooter()}
          </div>
        </div>
      )}
    </MotionConfig>
  );
}
