# Unity: Stakeholder Network Analysis

A multi-tenant web app where the organisations in a collaborative network log their meetings,
verify each other's records, and see the network that results: who works with whom, how often,
and where the gaps are.

Built as my final-year Computer Science project at Queen's University Belfast.

### [▶ Try the live demo](https://unity-network.web.app)

One click, no sign-up: you're signed in as WHO in a sample global-health network. **Or see the admin
view** from the same page. Demo changes stay in your browser tab.

[![Deploy live site](https://github.com/mattchris3/stakeholder-network-analysis/actions/workflows/firebase-hosting-merge.yml/badge.svg)](https://github.com/mattchris3/stakeholder-network-analysis/actions/workflows/firebase-hosting-merge.yml)

![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178C6?logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-8-646CFF?logo=vite&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?logo=tailwindcss&logoColor=white)
![D3.js](https://img.shields.io/badge/D3.js-v7-F9A03C?logo=d3dotjs&logoColor=white)
![Firebase](https://img.shields.io/badge/Firebase-Realtime_DB-FFCA28?logo=firebase&logoColor=black)

## Why it exists

Network analysis of partnerships is usually done with surveys: slow, self-reported and out of date
by the time it's published. Unity replaces the survey with a shared logbook. Each member records the
meetings it took part in, every other participant confirms or disputes them, and only meetings
confirmed by **all** participants count towards the graph and the analytics. No single member can
inflate its own position.

## Features

- **Multi-tenancy.** Anyone can create a network (a "Unity") and invite members with an access code.
  All data is partitioned by `unityId`.
- **Peer verification.** Members log meetings and every participant verifies them independently.
  Approval is final; a dispute can be withdrawn.
- **Network graph.** A D3.js force-directed graph with a core-periphery layout, clustering by sector or
  funding type, search for two organisations at once, and a time filter that recalculates link
  strength.
- **Insights.** A unique-contribution score, cross-domain "bridge" organisations, and
  collaboration-gap detection, all derived from the meeting data.
- **Domain-agnostic.** Admins define their own focus-area vocabulary, so the same analytics work for
  health, energy or any other sector without code changes.
- **Admin tools.** Member approval queue, member management with soft delete, and network profile
  settings.

## Try it locally

You need Node.js 20 or later.

```bash
git clone https://github.com/mattchris3/stakeholder-network-analysis.git
cd stakeholder-network-analysis
npm install
npm run dev
```

Open <http://localhost:5173> and press **Try the demo**. It signs you in as WHO in a sample global-health
network (15 organisations), with no account needed. **Or see the admin view** opens the same network as
its admin. In demo mode you can verify, dispute, log meetings and approve members; changes stay in your
browser tab and are never written to the database.

The app reads a hosted Firebase demo database. If Firebase is unreachable it falls back to a bundled
snapshot of the same data, so the demo always opens.

| Command | What it does |
|---|---|
| `npm run dev` | Start the dev server |
| `npm test` | Run the unit tests (Vitest) |
| `npm run build` | Type-check and build for production into `dist/` |
| `npm run snapshot` | Rebuild the bundled demo snapshot from `data/data.json` |
| `npm run test:rules` | Test the database security rules against the local Firebase emulator (needs Java) |
| `npm run db:check` | Read-only health check of the live database: access, consistency, test leftovers |

## Accounts and security

Authentication uses **Firebase Authentication**, and the **Realtime Database security rules**
([`database.rules.json`](database.rules.json)) enforce every permission on the server:

| Who | How they sign in | What they can do |
|---|---|---|
| Visitors and testers | **Try the demo**: anonymous Firebase sign-in, no account | Read the sample network. Demo changes stay in the browser tab; the rules refuse anonymous writes. |
| Members | Email and password, created when they apply to join a network | Log meetings as host, verify or dispute only their own part, edit their own profile |
| Admins | Email and password, created with **Create a network** | Approve, reject and remove members of their own network; edit its settings |

`users/{uid}` links each account to its network and role. The rules check it on every write: a member
can't approve itself, decide for another participant, rewrite a logged meeting, or undo a verification,
and an admin can't touch another network. 25 emulator tests cover these cases
([`rules/database.rules.test.ts`](rules/database.rules.test.ts)).

Known limitation: the rules can't loop over a meeting's participants, so they can't prove "everyone has
verified" before a meeting's `status` becomes `confirmed`. The app sets it only when that's true.

To run your own copy with accounts, copy `.env.example` to `.env.local` and add your Firebase web app
config. Without it, the app runs the demo only.

### The original version

The first version (vanilla JavaScript, no build step) is kept in [`legacy/`](legacy/) for comparison. It
still runs with `python3 -m http.server 8000` from that folder.

### Reseeding the demo data

`data/` holds the sample dataset and two Node scripts for loading it into Firebase:

```bash
cd data
npm install
npm run seed     # uploads data.json
npm run reset    # deletes all Unity data
```

## How it's built

```
src/
├─ lib/
│  ├─ network.ts      graph model: build links from verified meetings, filter, rank (unit-tested)
│  ├─ analytics.ts    influence, activity, unique contribution, bridges, gaps (unit-tested)
│  ├─ meetings.ts     the peer-verification rules: verify, dispute, withdraw, confirm (unit-tested)
│  ├─ store.ts        Firebase writes (skipped in demo mode)
│  ├─ data.ts         loads a network from Firebase, falls back to the bundled snapshot
│  ├─ session.tsx     signed-in member (session storage)
│  └─ sectors.ts      one colour per sector, shared by the graph and legends
├─ components/
│  ├─ NetworkGraph.tsx  D3 force simulation inside React: zoom, drag, keyboard, focus highlighting
│  ├─ NetworkPanel.tsx  ranking and organisation details
│  └─ AppShell.tsx      header, navigation and page transitions
└─ pages/             Landing, SignIn, Join, NetworkPage, Profile, meetings/, analytics/, admin/
```

- **React owns the page, D3 owns the graph.** The graph component hands D3 one `<svg>` and keeps the
  simulation in refs, so selecting a node restyles it without restarting the layout, and filtering keeps
  each node where it was.
- **The network logic is pure TypeScript** with no DOM or Firebase in it, which is what the tests cover.
- **Motion** is restrained (cross-fades, a sliding detail panel, nodes easing in) and switched off when
  the system asks for reduced motion.
- **Firebase and D3 load only after sign-in**, so the landing page stays light.

## Deployment

The site is on **Firebase Hosting** at <https://unity-network.web.app>, deployed by GitHub Actions:

- **Pull requests:** type-check, unit tests, security-rules tests (Firebase emulator) and build, then a
  temporary preview site whose link is posted on the pull request.
- **Merges to `master`:** the same checks, then deploy to the live site. Nothing deploys if a check fails.

Database rules are deployed separately with `npx firebase deploy --only database`, and `npm run deploy`
publishes the site by hand.

## Roadmap

This project is being modernised:

- [x] Repository clean-up
- [x] React + TypeScript + Vite foundation, design system, landing page and demo sign-in
- [x] Network view: graph, filters, ranking and organisation details
- [x] Meetings: log, verify, dispute and history
- [x] Analytics: overview, influence, activity and insights (contribution, bridges, gaps)
- [x] Profile, admin (applications, members, network settings) and applying to join
- [x] Firebase Authentication (anonymous demo, member and admin accounts) and tested security rules
- [x] Hosted live demo with one-click demo sign-in (Firebase Hosting)
- [x] CI/CD: every pull request is tested and gets a preview link; merges to `master` deploy automatically
- [x] Unit tests for the network model, analytics and verification rules (Vitest)

## Author

**Matthew Christensen**: final-year Computer Science project (CSC3002), Queen's University Belfast.
Supervised by Neil Anderson.
