# Atlas — Autonomous SWE Agent (Frontend)

This repository contains a developer-focused frontend for Atlas, an autonomous AI Software Engineer. It includes:
- A static prototype (index.html) for quick preview.
- A Next.js 14 app (app router) for real development, with React components, dark IDE-like UI, diff viewer, log stream panel, tool drawer, and bottom bar controls.

## Prerequisites

- Node.js 18.17+ (recommended 20.x)
- npm 9+, or yarn/pnpm if you prefer

## Quick preview (static prototype)

If you only want to preview the UI quickly:
- Open `index.html` in your browser.
- The UI will render with sample data and interactions (no backend).

## Run the Next.js app (recommended)

1) Install dependencies
```bash
npm install
# or
yarn
# or
pnpm install
```

2) Start the dev server
```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

3) Open in your browser
- http://localhost:3000

You should see the three-panel Atlas UI:
- Left: Autonomous Log (Planning, Researching, Executing, Drafting, User)
- Center: Code/Diff/Tests tabs with inline diff and comment threads
- Right: Tool/Utility bar with Activity, Files, Terminal, Integrations, Settings
- Bottom: Task input with Quick/Think/Run on Atlas controls and Mic/Web/Command icons

## Available scripts

- `npm run dev` — start Next.js in development mode
- `npm run build` — production build
- `npm run start` — start the production server
- `npm run lint` — run Next.js lint

## Environment configuration (for upcoming integrations)

Create a `.env.local` file at the project root when you want to connect real services:

```
# WebSocket stream from your backend (Atlas agent)
NEXT_PUBLIC_WS_URL=wss://your-backend.example/ws/logs

# GitHub (for repo tree, diffs, PRs, review comments)
GITHUB_TOKEN=ghp_...
GITHUB_OWNER=your-org
GITHUB_REPO=your-repo
GITHUB_BASE_BRANCH=main

# JIRA (optional, for issues/comments)
JIRA_BASE_URL=https://your-domain.atlassian.net
JIRA_EMAIL=your-email@example.com
JIRA_API_TOKEN=your-jira-api-token
JIRA_PROJECT_KEY=ENG
```

These variables are not required to run the UI locally. They’ll be used once the API routes are added.

## Troubleshooting

- If you see a blank page or a 404:
  - Ensure Node.js 18.17+ or 20.x
  - Make sure `app/page.tsx` exists (it’s included)
  - Run `npm install` again to ensure deps are installed

- If the static prototype looks different than the Next app:
  - The Next app ports the design and behavior; minor differences are expected due to React componentization.

## Next steps

We can add:
- WebSocket log streaming from your backend
- GitHub repo explorer and real diffs from Atlas actions
- PR creation and inline review comments synchronized with GitHub
- JIRA integration for task/issue management

Once you provide repo/org details and JIRA credentials, we’ll wire these endpoints and UI behaviors end-to-end.