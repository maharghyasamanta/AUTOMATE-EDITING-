FrameForge AI

Turn a simple story idea into a full pre-production package: screenplay, character profiles, scene breakdowns, storyboards, and a narrative consistency audit. Powered by Google Gemini.

Features
Story Architect – expand an idea into a structured screenplay
Character Intelligence – generate detailed character profiles
Scene Director – break the story down into scenes
Storyboard Studio – create storyboard panels for each scene
Narrative Auditor – check the story for consistency issues
Auto-save – your project is saved as you work
Tech Stack
React 19, Vite, Tailwind CSS 4
Express (TypeScript, run with tsx)
Google Gemini via @google/genai
Three.js and Lenis for the landing page
Getting Started

Prerequisites: Node.js 18+ and a Gemini API key.
Environment Variables
Variable	Required	Description
GEMINI_API_KEY	Yes	Your Gemini API key. Used server-side only.
PORT	No	Server port (default 3000).
Scripts
Command	What it does
npm run dev	Start the dev server (Express + Vite)
npm run build	Build the frontend for production
npm run preview	Preview the production build
npm run lint	Type-check with TypeScript
Project Structure
├── server.ts          # Express server and Gemini API routes
├── src/
│   ├── components/    # Views: story, characters, scenes, storyboard, audit
│   ├── hooks/         # Auto-save hook
│   ├── types/         # Shared TypeScript types
│   └── utils/         # Helpers and tests
└── public/            # Static assets
API Routes
Method	Route	Purpose
GET	/api/health	Health check
POST	/api/story	Generate the screenplay
POST	/api/characters	Generate character profiles
POST	/api/scenes	Generate scene breakdowns
POST	/api/audit	Run the narrative audit
POST	/api/storyboard	Generate storyboard panels
