import { useEffect, useRef, useState } from "react";
import Lenis from "lenis";
import type { NavSection } from "../types/frameforge";
import EarthCanvas from "./EarthCanvas";

interface LandingPageProps {
  onEnterStudio: (section?: NavSection) => void;
}

interface FeatureItem {
  id: string;
  title: string;
  description: string;
  previewLabel: string;
  previewValue: string;
  rdClass: string;
}

const FEATURES: readonly FeatureItem[] = [
  {
    id: "workflow",
    title: "Clever workflows",
    description:
      "Automate every hand-off with visual, branching pipelines that move deals forward while you sleep.",
    previewLabel: "Active automations",
    previewValue: "148 branching rules live",
    rdClass: "ascend-rd-0",
  },
  {
    id: "analytics",
    title: "Live analytics",
    description:
      "Real-time dashboards turn raw funnel data into the one number that tells you what to do next.",
    previewLabel: "Attribution latency",
    previewValue: "12ms stream sync",
    rdClass: "ascend-rd-90",
  },
  {
    id: "leads",
    title: "Seamless leads",
    description:
      "Capture, score, and route every lead automatically — no spreadsheet, no leak, no lag.",
    previewLabel: "Routing precision",
    previewValue: "99.4% SLA match rate",
    rdClass: "ascend-rd-180",
  },
  {
    id: "bolt",
    title: "Instant triggers",
    description:
      "Fire actions across your stack the moment intent appears, in milliseconds not minutes.",
    previewLabel: "Webhook dispatch",
    previewValue: "18ms median trigger",
    rdClass: "ascend-rd-270",
  },
  {
    id: "shield",
    title: "Enterprise-grade",
    description:
      "SOC 2, SSO, and granular roles baked in — security that scales quietly with your team.",
    previewLabel: "Compliance posture",
    previewValue: "SOC 2 Type II · SAML",
    rdClass: "ascend-rd-360",
  },
  {
    id: "globe",
    title: "Global by default",
    description:
      "Multi-region, multi-currency, and low-latency everywhere your customers happen to be.",
    previewLabel: "Edge regions",
    previewValue: "28 PoPs · 135+ currencies",
    rdClass: "ascend-rd-450",
  },
];

const DASH_BARS = [
  { heightClass: "ascend-bar-62", delayClass: "ascend-bar-d0", label: "Mon" },
  { heightClass: "ascend-bar-88", delayClass: "ascend-bar-d1", label: "Tue" },
  { heightClass: "ascend-bar-47", delayClass: "ascend-bar-d2", label: "Wed" },
  { heightClass: "ascend-bar-95", delayClass: "ascend-bar-d3", label: "Thu" },
  { heightClass: "ascend-bar-71", delayClass: "ascend-bar-d4", label: "Fri" },
  { heightClass: "ascend-bar-80", delayClass: "ascend-bar-d5", label: "Sat" },
  { heightClass: "ascend-bar-58", delayClass: "ascend-bar-d6", label: "Sun" },
];

const DASH_ROWS = [
  { label: "New leads", widthClass: "ascend-fill-90" },
  { label: "Qualified", widthClass: "ascend-fill-72" },
  { label: "In negotiation", widthClass: "ascend-fill-48" },
  { label: "Closed won", widthClass: "ascend-fill-34" },
];

const STATS = [
  { value: "3.4×", label: "Faster pipeline velocity", rdClass: "ascend-rd-0" },
  { value: "92%", label: "Lead capture accuracy", rdClass: "ascend-rd-80" },
  { value: "11k+", label: "Teams scaling on Ascend", rdClass: "ascend-rd-160" },
  { value: "$2.1B", label: "Revenue influenced", rdClass: "ascend-rd-240" },
];

function ArrowIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M5 12h14" />
      <path d="m12 5 7 7-7 7" />
    </svg>
  );
}

function FeatureIcon({ id }: { id: string }) {
  switch (id) {
    case "workflow":
      return (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.6}
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <rect x="3" y="3" width="6" height="6" rx="1.5" />
          <rect x="15" y="15" width="6" height="6" rx="1.5" />
          <path d="M6 9v3a3 3 0 0 0 3 3h3" />
        </svg>
      );
    case "analytics":
      return (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.6}
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M4 19V5" />
          <path d="M4 19h16" />
          <path d="M8 16v-4" />
          <path d="M13 16V8" />
          <path d="M18 16v-7" />
        </svg>
      );
    case "leads":
      return (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.6}
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      );
    case "bolt":
      return (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.6}
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M13 2 3 14h9l-1 8 10-12h-9l1-8Z" />
        </svg>
      );
    case "shield":
      return (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.6}
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" />
          <path d="m9 12 2 2 4-4" />
        </svg>
      );
    case "globe":
    default:
      return (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.6}
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <circle cx="12" cy="12" r="10" />
          <path d="M2 12h20" />
          <path d="M12 2a15 15 0 0 1 0 20 15 15 0 0 1 0-20Z" />
        </svg>
      );
  }
}

export default function LandingPage({ onEnterStudio }: LandingPageProps) {
  const [reducedMotion, setReducedMotion] = useState<boolean>(() =>
    typeof window !== "undefined"
      ? window.matchMedia("(prefers-reduced-motion: reduce)").matches
      : false
  );
  const [consultOpen, setConsultOpen] = useState(false);
  const [consultSubmitted, setConsultSubmitted] = useState(false);
  const [consultName, setConsultName] = useState("");
  const [consultEmail, setConsultEmail] = useState("");
  const lenisRef = useRef<Lenis | null>(null);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onChange = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    if (reducedMotion) {
      const nodes = document.querySelectorAll<HTMLElement>("[data-reveal]");
      nodes.forEach((el) => el.classList.add("in"));
      return;
    }

    const lenis = new Lenis({
      duration: 1.15,
      smoothWheel: true,
      touchMultiplier: 1.5,
    });
    lenisRef.current = lenis;

    let rafId = 0;
    function raf(time: number) {
      lenis.raf(time);
      rafId = requestAnimationFrame(raf);
    }
    rafId = requestAnimationFrame(raf);

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add("in");
            observer.unobserve(entry.target);
          }
        }
      },
      {
        threshold: 0.18,
        rootMargin: "0px 0px -8% 0px",
      }
    );

    const revealNodes = document.querySelectorAll<HTMLElement>("[data-reveal]");
    revealNodes.forEach((node) => observer.observe(node));

    return () => {
      cancelAnimationFrame(rafId);
      observer.disconnect();
      lenis.destroy();
      lenisRef.current = null;
    };
  }, [reducedMotion]);

  function scrollToSection(id: string) {
    const target = document.getElementById(id);
    if (!target) return;
    if (lenisRef.current && !reducedMotion) {
      lenisRef.current.scrollTo(target);
    } else {
      target.scrollIntoView({ behavior: reducedMotion ? "auto" : "smooth" });
    }
  }

  function handleConsultSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!consultName.trim() || !consultEmail.trim()) return;
    setConsultSubmitted(true);
  }

  const currentYear = new Date().getFullYear();

  return (
    <div className="ascend-root">
      <EarthCanvas reducedMotion={reducedMotion} />

      <div className="ascend-page" id="top">
        {/* SECTION 1 · HERO */}
        <header className="ascend-hero">
          <nav className="ascend-nav" aria-label="Primary">
            <a href="#top" className="ascend-brand">
              <span className="ascend-brand-mark" aria-hidden="true">
                ▲
              </span>
              <span>Ascend</span>
            </a>

            <div className="ascend-nav-links">
              <a
                href="#features"
                onClick={(e) => {
                  e.preventDefault();
                  scrollToSection("features");
                }}
              >
                Features
              </a>
              <a
                href="#solutions"
                onClick={(e) => {
                  e.preventDefault();
                  scrollToSection("solutions");
                }}
              >
                Solutions
              </a>
              <a
                href="#cta"
                onClick={(e) => {
                  e.preventDefault();
                  scrollToSection("cta");
                }}
              >
                Plans
              </a>
              <a
                href="#stats"
                onClick={(e) => {
                  e.preventDefault();
                  scrollToSection("stats");
                }}
              >
                Learning
              </a>
            </div>

            <button
              type="button"
              onClick={() => onEnterStudio("dashboard")}
              className="ascend-btn ascend-btn-ghost"
            >
              Open Studio
            </button>
          </nav>

          <div className="ascend-hero-inner">
            <h1 className="ascend-hero-title ascend-rd-60" data-reveal="">
              Scale Smarter,
              <br />
              Not <em>Harder</em>
            </h1>
            <p className="ascend-hero-sub ascend-rd-180" data-reveal="">
              Drive your funnel forward with clever workflows, analytics, and
              seamless lead management — all in one immersive command center.
            </p>
            <div className="ascend-hero-actions ascend-rd-300" data-reveal="">
              <button
                type="button"
                onClick={() => onEnterStudio("dashboard")}
                className="ascend-btn ascend-btn-primary"
              >
                <span>Start Free Right Now</span>
                <ArrowIcon />
              </button>
              <button
                type="button"
                onClick={() => {
                  setConsultSubmitted(false);
                  setConsultOpen(true);
                }}
                className="ascend-btn ascend-btn-outline"
              >
                Schedule a Consult
              </button>
            </div>
          </div>

          <div className="ascend-logos ascend-rd-420" data-reveal="">
            <p className="ascend-logos-label">Trusted by fast-moving teams</p>
            <div className="ascend-logos-row">
              <span className="ascend-logo">Nimbus</span>
              <span className="ascend-logo">Pluma</span>
              <span className="ascend-logo">Citrus</span>
              <span className="ascend-logo">Spider</span>
              <span className="ascend-logo">Helod</span>
              <span className="ascend-logo">Vertx</span>
            </div>
          </div>
        </header>

        {/* SECTION 2 · FEATURES (zero-click hover & mobile expanded) */}
        <section className="ascend-section ascend-features" id="features">
          <div className="ascend-section-head">
            <span className="ascend-eyebrow" data-reveal="">
              Everything in orbit
            </span>
            <h2 className="ascend-rd-80" data-reveal="">
              One platform to run the entire revenue engine
            </h2>
            <p className="ascend-rd-160" data-reveal="">
              Stop stitching tools together. Ascend unifies capture, automation,
              and insight into a single surface your whole team actually enjoys
              using.
            </p>
          </div>

          <div className="ascend-feature-grid">
            {FEATURES.map((feat) => (
              <article
                key={feat.id}
                className={`ascend-card ${feat.rdClass}`}
                data-reveal=""
                tabIndex={0}
              >
                <div className="ascend-card-icon">
                  <FeatureIcon id={feat.id} />
                </div>
                <h3>{feat.title}</h3>
                <p>{feat.description}</p>
                <div className="ascend-card-preview">
                  <span className="ascend-card-preview-label">
                    {feat.previewLabel}
                  </span>
                  <span className="ascend-card-preview-value">
                    {feat.previewValue}
                  </span>
                </div>
              </article>
            ))}
          </div>
        </section>

        {/* SECTION 3 · SHOWCASE + DASHBOARD + STATS */}
        <section className="ascend-section ascend-showcase" id="solutions">
          <div className="ascend-showcase-grid">
            <div className="ascend-showcase-copy">
              <span className="ascend-eyebrow" data-reveal="">
                Built for momentum
              </span>
              <h2 className="ascend-rd-90" data-reveal="">
                See the whole funnel move in real time
              </h2>
              <p className="ascend-rd-180" data-reveal="">
                Every stage, every signal, every dollar — rendered live. Ascend
                gives operators the altitude to spot what’s working and the
                controls to double down instantly.
              </p>
              <div className="ascend-showcase-cta ascend-rd-270" data-reveal="">
                <button
                  type="button"
                  onClick={() => onEnterStudio("dashboard")}
                  className="ascend-btn ascend-btn-primary"
                >
                  <span>Explore the platform</span>
                  <ArrowIcon />
                </button>
              </div>
            </div>

            <div
              className="ascend-dashboard ascend-rd-160"
              data-reveal=""
              data-testid="scroll-dashboard"
            >
              <div className="ascend-dash-top">
                <span className="ascend-dash-title">Pipeline · Q3</span>
                <span className="ascend-dash-live">
                  <span className="ascend-live-dot" aria-hidden="true" />
                  <span>Live</span>
                </span>
              </div>

              <div className="ascend-dash-bars" aria-label="Quarterly pipeline bar chart">
                {DASH_BARS.map((bar) => (
                  <div
                    key={bar.label}
                    className={`ascend-dash-bar ${bar.heightClass} ${bar.delayClass}`}
                    title={bar.label}
                  />
                ))}
              </div>

              <div className="ascend-dash-rows">
                {DASH_ROWS.map((row) => (
                  <div key={row.label} className="ascend-dash-row">
                    <span>{row.label}</span>
                    <div className="ascend-dash-track">
                      <div className={`ascend-dash-fill ${row.widthClass}`} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="ascend-stats" id="stats">
            {STATS.map((stat) => (
              <div
                key={stat.label}
                className={`ascend-stat ${stat.rdClass}`}
                data-reveal=""
              >
                <div className="ascend-stat-value">{stat.value}</div>
                <div className="ascend-stat-label">{stat.label}</div>
              </div>
            ))}
          </div>
        </section>

        {/* SECTION 4 · CTA + FOOTER */}
        <section className="ascend-section ascend-cta" id="cta">
          <div className="ascend-cta-card">
            <span className="ascend-eyebrow ascend-rd-60" data-reveal="">
              Ready when you are
            </span>
            <h2 className="ascend-rd-140" data-reveal="">
              Put your growth on a new trajectory
            </h2>
            <p className="ascend-rd-220" data-reveal="">
              Launch in minutes. No credit card. Cancel anytime. Join thousands
              of teams compounding revenue on Ascend.
            </p>
            <div className="ascend-hero-actions ascend-cta-actions ascend-rd-300" data-reveal="">
              <button
                type="button"
                onClick={() => onEnterStudio("dashboard")}
                className="ascend-btn ascend-btn-primary"
              >
                <span>Start Free Right Now</span>
                <ArrowIcon />
              </button>
              <button
                type="button"
                onClick={() => {
                  setConsultSubmitted(false);
                  setConsultOpen(true);
                }}
                className="ascend-btn ascend-btn-outline"
              >
                Talk to Sales
              </button>
            </div>
          </div>

          <footer className="ascend-footer">
            <div className="ascend-footer-brand">
              <a href="#top" className="ascend-brand">
                <span className="ascend-brand-mark" aria-hidden="true">
                  ▲
                </span>
                <span>Ascend</span>
              </a>
              <p>The revenue command center for ambitious teams.</p>
            </div>

            <div className="ascend-footer-cols">
              <div className="ascend-footer-col">
                <h4>Product</h4>
                <a
                  href="#features"
                  onClick={(e) => {
                    e.preventDefault();
                    scrollToSection("features");
                  }}
                >
                  Features
                </a>
                <a
                  href="#solutions"
                  onClick={(e) => {
                    e.preventDefault();
                    scrollToSection("solutions");
                  }}
                >
                  Solutions
                </a>
                <a
                  href="#cta"
                  onClick={(e) => {
                    e.preventDefault();
                    scrollToSection("cta");
                  }}
                >
                  Plans
                </a>
              </div>
              <div className="ascend-footer-col">
                <h4>Company</h4>
                <a
                  href="#top"
                  onClick={(e) => {
                    e.preventDefault();
                    onEnterStudio("dashboard");
                  }}
                >
                  About
                </a>
                <a
                  href="#top"
                  onClick={(e) => {
                    e.preventDefault();
                    onEnterStudio("story");
                  }}
                >
                  Careers
                </a>
                <a
                  href="#stats"
                  onClick={(e) => {
                    e.preventDefault();
                    scrollToSection("stats");
                  }}
                >
                  Blog
                </a>
              </div>
              <div className="ascend-footer-col">
                <h4>Legal</h4>
                <a href="#cta">Privacy</a>
                <a href="#cta">Terms</a>
                <a href="#cta">Security</a>
              </div>
            </div>
          </footer>

          <p className="ascend-copyright">
            © {currentYear} Ascend, Inc. — Built among the stars.
          </p>
        </section>
      </div>

      {/* Consult Dialog */}
      {consultOpen && (
        <div
          className="ascend-modal-backdrop"
          role="dialog"
          aria-modal="true"
          aria-labelledby="consult-modal-title"
        >
          <div className="ascend-modal">
            <div className="ascend-modal-head">
              <h3 id="consult-modal-title">Schedule a Consult</h3>
              <button
                type="button"
                onClick={() => setConsultOpen(false)}
                className="ascend-modal-close"
                aria-label="Close consultation modal"
              >
                ✕
              </button>
            </div>
            {consultSubmitted ? (
              <div className="ascend-modal-success">
                <p>
                  Request received for <strong>{consultName}</strong> (
                  {consultEmail}). You can launch the interactive studio right
                  now while our team prepares your session.
                </p>
                <div className="ascend-modal-actions">
                  <button
                    type="button"
                    onClick={() => {
                      setConsultOpen(false);
                      onEnterStudio("dashboard");
                    }}
                    className="ascend-btn ascend-btn-primary"
                  >
                    <span>Enter Studio Dashboard</span>
                    <ArrowIcon />
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleConsultSubmit} className="ascend-modal-form">
                <label className="ascend-field">
                  <span>Full name</span>
                  <input
                    type="text"
                    required
                    value={consultName}
                    onChange={(e) => setConsultName(e.target.value)}
                    placeholder="Alex Rivera"
                  />
                </label>
                <label className="ascend-field">
                  <span>Work email</span>
                  <input
                    type="email"
                    required
                    value={consultEmail}
                    onChange={(e) => setConsultEmail(e.target.value)}
                    placeholder="alex@company.com"
                  />
                </label>
                <div className="ascend-modal-actions">
                  <button
                    type="button"
                    onClick={() => setConsultOpen(false)}
                    className="ascend-btn ascend-btn-ghost"
                  >
                    Cancel
                  </button>
                  <button type="submit" className="ascend-btn ascend-btn-primary">
                    <span>Request Session</span>
                    <ArrowIcon />
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
