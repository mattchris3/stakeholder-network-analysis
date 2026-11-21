# Unity: Stakeholder Network Analysis

A multi-tenant web app where the organisations in a collaborative network log their meetings,
verify each other's records, and see the network that results: who works with whom, how often,
and where the gaps are.

Built as my final-year Computer Science project at Queen's University Belfast.

![JavaScript](https://img.shields.io/badge/JavaScript-ES_Modules-F7DF1E?logo=javascript&logoColor=black)
![D3.js](https://img.shields.io/badge/D3.js-v7-F9A03C?logo=d3dotjs&logoColor=white)
![Firebase](https://img.shields.io/badge/Firebase-Realtime_DB-FFCA28?logo=firebase&logoColor=black)
![Chart.js](https://img.shields.io/badge/Chart.js-4-FF6384?logo=chartdotjs&logoColor=white)

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

You need Python 3 (or any static file server) and a modern browser. There's no build step.

```bash
git clone https://github.com/mattchris3/stakeholder-network-analysis.git
cd stakeholder-network-analysis
python3 -m http.server 8000
```

Open <http://localhost:8000>. The app connects to a hosted Firebase demo database, so it works straight
away.

### Demo accounts

These sign in to a sample global-health network (25 organisations, 65 meetings):

| Role | Unity ID | Member ID / username | Password |
|---|---|---|---|
| Member | `UNITY-GLOBHEALTH-2025` | `WHO-001` | none |
| Admin | `UNITY-GLOBHEALTH-2025` | `admin_globalhealth` | `Admin123!` |

The demo database is shared and public, so please don't enter real data.

### Tests

With the local server running, open <http://localhost:8000/tests/tests.html>. The tests check tenant
isolation (entities and meetings never leak between Unities) and data integrity (participants belong to
the meeting's Unity, approval fields are valid, and confirmed meetings are approved by everyone).

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
Browser (ES modules, no build step)
 ├─ index.html, welcome-*.html   landing, sign-in and registration flows
 └─ home.html + js/main.js       single-page dashboard: shared state and navigation
      ├─ network/    data.js (Firebase reads, filtering, link strength)
      │              visualization.js (D3 force graph), sidebar.js
      ├─ meeting/    log, verify/dispute, history
      ├─ analytics/  overview, influence, activity charts, insights
      ├─ admin/      approvals, member management, profile
      └─ member/     member profile
              │
              ▼
Firebase Realtime Database: unities / admins / entities / meetings
```

```
css/       welcome.css, network/*, admin/*
data/      sample dataset + seed/reset scripts
tests/     browser-based isolation and integrity tests
```

## Roadmap

This project is being modernised:

- [x] Repository clean-up
- [ ] Redesign in React + TypeScript + Vite, with a new design system
- [ ] Firebase Authentication and database security rules (replacing the current demo-grade sign-in)
- [ ] Hosted live demo with one-click demo sign-in
- [ ] Unit tests for the analytics engine (Vitest)

## Author

**Matthew Christensen**: final-year Computer Science project (CSC3002), Queen's University Belfast.
Supervised by Neil Anderson.
