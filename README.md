# Unity — Stakeholder Network Analysis

A multi-tenant web application that enables stakeholders within collaborative networks to visualize, log, and verify their collaboration relationships independently.

## Overview

Unity replaces traditional survey-based network analysis with a self-service platform where stakeholders create their own networks, log meetings, and verify each other's data through a democratic peer-verification system. Only meetings confirmed by all participants appear in the network visualization and analytics.

### Key Features

- **Multi-Tenancy**: Any stakeholder can create an independent network (Unity) and invite members via access code. All data is isolated through a unityId partition key.
- **Democratic Verification**: Members log meetings, all participants verify independently. Approval is permanent, disputes are reversible. No single user can manipulate the network.
- **Network Visualization**: D3.js force-directed graph with core-periphery layout, cluster by sector/funding type modes, dual organization search, and time period filtering with link strength recalculation.
- **Network Insights**: Unique Contribution scoring, cross-domain Bridge identification, and Collaboration Gap detection, all derived from existing meeting and entity data.
- **Domain-Agnostic**: Administrators define their own focus area vocabulary. The analytics engine operates on pattern matching, enabling deployment to any industry without code changes.

## Tech Stack

- **Frontend**: Vanilla JavaScript (ES6 Modules), HTML, CSS
- **Database**: Firebase Realtime Database
- **Visualization**: D3.js (v7)
- **Charts**: Chart.js

## Setup

1. Clone the repository:
```
git clone https://gitlab.eeecs.qub.ac.uk/40392445/stakeholder-network-analysis
```

2. Navigate to the project directory:
```
cd stakeholder-network-analysis
```

3. Start a local server:
```
python3 -m http.server 8000
```

4. Open `http://localhost:8000` in a modern web browser.

The application connects to Firebase Realtime Database automatically. No additional configuration is required.

## Demo Credentials

| Role | Unity ID | Username/Member ID | Password |
|------|----------|-------------------|----------|
| Admin | UNITY-GLOBHEALTH-2025 | admin_globalhealth | Admin123! |
| Member | UNITY-GLOBHEALTH-2025 | WHO-001 | Not required |

## Project Structure

```
js/
├── main.js              — single entry point, shared state, navigation
├── config.js            — Firebase connection
├── login-admin.js       — admin authentication
├── login-member.js      — member authentication
├── new-unity.js         — Unity creation flow
├── new-member.js        — member registration flow
├── network/
│   ├── data.js          — Firebase reads, filtering, link processing
│   ├── visualization.js — D3 force graph rendering
│   └── sidebar.js       — statistics, entity details panel
├── admin/
│   ├── overview.js      — sector chart, org/meeting tables
│   ├── pending.js       — member approval workflow
│   ├── modify.js        — member management, soft delete
│   ├── organizations.js — organization list view
│   ├── meetings.js      — meeting list view
│   └── profile.js       — Unity profile, focus area management
├── meeting/
│   ├── add-meeting.js   — meeting logging form
│   ├── manage.js        — verify/dispute workflow
│   └── overview.js      — meeting history
├── member/
│   └── profile.js       — member profile, Unity info view
└── analytics/
    ├── overview.js      — personal performance summary
    ├── influence.js     — network influence scoring
    ├── activity.js      — trend, type, format charts
    └── insights.js      — contribution, bridges, gaps analysis
```

## Author

Matthew Christensen (40392445)
Queen's University Belfast — CSC3002 Computer Science Project
Supervised by Neil Anderson