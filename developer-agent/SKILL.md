---
name: obsagents-developer
description: >-
  Develop features in the ObsAgents (AOC Agent Manager) project. Covers architecture,
  component patterns, sidebar/routing, backend API, data model, and styling conventions.
  Use when creating new pages, components, API endpoints, or modifying existing UI in this project.
---

# ObsAgents Developer Guide

## Project Overview

AOC Agent Manager — a React + Express app for managing observability agents, MCP servers, and Sky fallout workflows.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Vite 5, JSX (no TypeScript) |
| Backend | Node.js + Express 5 (`server.js`) |
| Icons | `lucide-react` — always import from here |
| Flow diagrams | `@xyflow/react` v12 |
| Styling | Plain CSS — no Tailwind, no CSS modules |
| Data | JSON files under `src/config/common/` |
| Agent files | `src/config/agents/<slug>/` |
| MCP configs | `src/config/mcp/<id>/` |

## Directory Structure

```
src/
  api.js                          # Frontend API client
  App.jsx                         # Root (renders AgentConfig)
  config/
    common/
      agents.json                 # Agent registry
      mcp-servers.json            # MCP server registry
      sky-tasks.json              # Sky fallout task data
    agents/<slug>/                # Per-agent folders
      services/handler.py         # Python handler
      agent_servers.json          # Server contract
    mcp/<id>/config/server.json   # MCP server configs
  components/AgentConfig/
    AgentConfig.jsx               # Main shell: sidebar, routing, login, breadcrumbs
    AgentConfig.css               # Global styles
    SkyTasks.css                  # Sky + Ticket Details styles
    [Component].jsx               # Feature panels
server.js                        # Express backend (port 3001)
vite.config.js                   # Vite dev server (port 5173), proxies /api -> 3001
```

## Adding a New Page

### 1. Add sidebar item in `AgentConfig.jsx`

Edit `SIDEBAR_ITEMS_BASE` array:

```jsx
{ icon: IconName, label: 'Page Label', view: 'my-view', sub: true }
```

Properties:
- `sub: true` — indented under current section
- `sky: true` — belongs to Sky section (hidden when Sky is off)
- `section: true, highlight: true` — section header (not clickable)
- No `sub`/`sky` — standalone top-level item

### 2. Import and route the component

In `AgentConfig.jsx`:
1. Import: `import MyPanel from './MyPanel'`
2. Add routing in the JSX ternary chain (search for `activeView ===`):

```jsx
) : activeView === 'my-view' ? (
  <MyPanel />
```

### 3. Create the component file

Create `src/components/AgentConfig/MyPanel.jsx`. Pattern:

```jsx
import React, { useState, useEffect } from 'react'
import { SomeIcon } from 'lucide-react'

export default function MyPanel() {
  return (
    <div className="my-panel">
      {/* content */}
    </div>
  )
}
```

### 4. Add styles

Add CSS to either:
- `AgentConfig.css` — for general/shared styles
- `SkyTasks.css` — for Sky-related pages
- Import from `AgentConfig.jsx` (both CSS files are already imported there)

## Styling Conventions

### Design tokens (used throughout)

```css
/* Text */
--heading: #0f172a;
--body: #334155;
--muted: #64748b;
--faint: #94a3b8;

/* Backgrounds */
--surface: #fff;
--panel-bg: #f8fafc;
--hover-bg: #f1f5f9;

/* Borders */
--border: #e2e8f0;
--border-light: #f1f5f9;

/* Brand */
--purple: #6d28d9;
--purple-light: #f5f3ff;
```

### Class naming

Prefix classes by component abbreviation:
- `ac-*` — AgentConfig shell
- `sky-*` — Sky tasks/detail
- `td2-*` — TicketDetails2
- `map-*` — Operation Graph

### Common patterns

```css
.my-panel { padding: 0; height: 100%; display: flex; flex-direction: column; background: #fff; }
.my-panel-header { display: flex; align-items: center; gap: 12px; padding: 18px 24px 0; }
.my-panel-header h2 { font-size: 17px; font-weight: 700; color: #0f172a; margin: 0; display: flex; align-items: center; gap: 8px; }
```

### Badges/pills pattern

```css
.my-badge {
  font-size: 11px; font-weight: 600;
  padding: 2px 10px; border-radius: 6px;
  display: inline-flex; align-items: center; gap: 4px;
}
```

## Backend API (`server.js`)

### Adding a new endpoint

All endpoints are in `server.js`. Data dir constant: `DATA_DIR = path.join(__dirname, 'src', 'config')`.

Pattern:

```js
app.get('/api/my-endpoint', (req, res) => {
  const filePath = path.join(DATA_DIR, 'common', 'my-data.json')
  if (!fs.existsSync(filePath)) return res.json([])
  const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'))
  res.json(data)
})
```

### Frontend API calls

Use `fetch('/api/...')` directly — Vite proxies `/api` to Express.

## Data Model Quick Reference

### Agent object (`agents.json`)

```json
{
  "id": 1,
  "slug": "agent-slug",
  "type": "local|external",
  "role": "sub-agent",
  "environment": "AOC|Sky",
  "enabled": true,
  "agent": { "name": "...", "description": "..." },
  "mcpBindings": [{ "serverId": "..." }] or [{ "mcpId": "..." }],
  "calls": ["other-agent-slug"]
}
```

### Sky task object (`sky-tasks.json`)

```json
{
  "id": "87342",
  "priority": "HIGH|CRITICAL|MEDIUM|LOW",
  "status": "IN PROGRESS|OPEN|DONE",
  "workflowName": "Fix Order",
  "currentStep": 2,
  "steps": [
    { "id": 1, "type": "AUTO-AGENT|HYBRID|MANUAL", "label": "...", "status": "DONE|IN_PROGRESS|PENDING" }
  ]
}
```

## Configuration System

`ConfigurationPanel.jsx` manages app-wide settings via `localStorage`:
- `sectionTitle` — top section name
- `showSkyMenu` — show/hide Sky section (default: false)
- `visibleColumns` — table columns
- `stagePipeline` — lifecycle stages

Access in components: passed as `appConfig` prop from `AgentConfig.jsx`.

## Running the App

```bash
# Terminal 1 — API server
node server.js

# Terminal 2 — Frontend
npx vite
```

App at `http://localhost:5173`, API at `http://localhost:3001`.

## Access Logging

All API requests logged to `user_access.log` in project root with timestamp, method, path, hostname, and IP.

## Key Files to Know

| File | What it does |
|------|-------------|
| `AgentConfig.jsx` | Shell: sidebar, routing, login, breadcrumbs (~1000 lines) |
| `AgentConfig.css` | Global styles (~800 lines) |
| `SkyTasks.css` | Sky + Ticket Details styles (~600 lines) |
| `AgentMapPanel.jsx` | Operation Graph (SVG-based node graph) |
| `TicketDetails2.jsx` | React Flow workflow visualization |
| `SkyTasksPanel.jsx` | Tasks list with detail drill-down |
| `SkyTaskDetail.jsx` | Full task detail with workflow steps |
| `ConfigurationPanel.jsx` | App settings panel |
| `server.js` | All backend API routes |
| `vite.config.js` | Vite config with /api proxy |
