---
name: AOC-Observability-Developer
description: >-
  Full knowledge base for the AOC Agent Manager project — business context,
  product domain, SDLC, architecture, data model, UI screens, backend API,
  coding patterns, and deployment. Use this skill for any development,
  enhancement, bug fix, or question related to the ObsAgents codebase.
---

# AOC Agent Manager — Complete Developer Knowledge Base

## 1. Business Context

### What is AOC?

AOC (Autonomous Operations Center) is an Amdocs product that automates IT operations for telecom accounts. It ingests fallout tickets (failed orders, billing errors, provisioning timeouts) and resolves them through a pipeline of AI agents — reducing L2 support load by up to 50%.

### What is this project?

This codebase (**ObsAgents / AOC Agent Manager**) is a diagnostic and management UI for AOC's agent ecosystem. It lets operators:

- Register, configure, and monitor **observability agents** and **MCP servers**
- Visualize agent-to-agent and agent-to-MCP relationships (Operation Graph)
- Manage **Sky fallout workflows** — view tickets, step through resolution workflows, execute Python handlers, and run sandbox tests
- Track team productivity via the Sky Tracking Report

### Product suites

Agents and MCPs belong to one or more **suites**: `CES 2.X`, `Classic`, `Ensemble`, `Cross`, or `TBD`. This maps to the Amdocs product portfolio the agent serves.

### Key accounts

The product serves 60+ telecom customers. Largest: **AT&T**, **XL**, **TMO** (T-Mobile). Sky tasks in the system reference these accounts.

### Stakeholders

| Role | Person | Notes |
|------|--------|-------|
| R&D Manager | Avi Harel-Yisraelian | Leads the iPaaS/AOC dev team (~15 people, Israel + India) |
| Manager's manager | Johny | |
| Product Manager | Shagun (reports to Anna → Erez) | |
| Delivery partners | PSU CoE | Center of Excellence, work for accounts |

### Team structure

4 technical domains: **Integration**, **BPM**, **Portal**, **Sky**. The team delivers ~28 releases/year supporting 100+ active projects.

### Operational groups in Sky

Tasks are assigned to groups: `Support Team`, `OH Fallouts Team`, `DLQ Team`, `Agents` (AI-handled), `ACE Group`, `ACS Group`, `RTB Group`, `Brite Bill Group`, `Security Group`.

---

## 2. Architecture

### High-level stack

```
┌─────────────────────────────────────────────┐
│  Browser (React 18 + Vite 5)                │
│    └─ AgentConfig shell → feature panels    │
├─────────────────────────────────────────────┤
│  Vite dev server (:5173)                    │
│    └─ proxies /api → Express (:3001)        │
├─────────────────────────────────────────────┤
│  Express 5 backend (server.js)              │
│    └─ reads/writes JSON files on disk       │
├─────────────────────────────────────────────┤
│  File system (src/config/)                  │
│    ├─ common/agents.json                    │
│    ├─ common/mcp-servers.json               │
│    ├─ common/sky-tasks.json                 │
│    └─ agents/<slug>/  (per-agent dirs)      │
└─────────────────────────────────────────────┘
```

### Technology table

| Layer | Technology | Notes |
|-------|-----------|-------|
| Frontend | React 18, Vite 5, JSX | No TypeScript |
| Backend | Node.js, Express 5 | Single `server.js` file |
| Icons | `lucide-react` | All icons from here |
| Flow diagrams | `@xyflow/react` v12 | Ticket Details 2 workflow |
| Styling | Plain CSS | No Tailwind, no CSS modules |
| File uploads | `multer` | Agent import, reference uploads |
| ZIP handling | `adm-zip` | Agent import/export |
| Data | JSON files on disk | No database |

### Dependencies (package.json)

```json
{
  "@xyflow/react": "^12.10.1",
  "adm-zip": "^0.5.16",
  "express": "^5.2.1",
  "lucide-react": "^0.294.0",
  "multer": "^2.1.1",
  "react": "^18.2.0",
  "react-dom": "^18.2.0",
  "xlsx": "^0.18.5"
}
```

### Network topology

- Frontend listens on `0.0.0.0:5173` (accessible on LAN)
- Backend listens on `0.0.0.0:3001`
- Vite `allowedHosts` includes `avii01`
- Vite proxy forwards `X-Forwarded-For` for real client IP

---

## 3. Directory Structure

```
ObsAgents/
├── server.js                        # ALL backend API routes
├── vite.config.js                   # Vite config + /api proxy
├── package.json
├── user_access.log                  # Auto-generated access log
├── developer-agent/                 # Legacy dev skill (superseded by this)
├── .agents/skills/                  # Cursor AI skill files
├── docs/
│   └── ui-pages-and-api.md          # Full UI/API reference doc
└── src/
    ├── App.jsx                      # Root: renders AgentConfig
    ├── App.css
    ├── api.js                       # Frontend API client wrapper
    ├── config/
    │   ├── common/
    │   │   ├── agents.json          # Agent registry (54+ agents)
    │   │   ├── mcp-servers.json     # MCP server registry (38+ servers)
    │   │   └── sky-tasks.json       # Sky fallout tasks (15+ tickets)
    │   └── agents/<slug>/           # Per-agent directories
    │       ├── services/handler.py  # Python handler script
    │       ├── agent_servers.json   # Server contract
    │       ├── skills/              # Agent skills (SKILL.md files)
    │       └── references/          # Reference documents
    └── components/AgentConfig/
        ├── AgentConfig.jsx          # Main shell (~1035 lines)
        ├── AgentConfig.css          # Global styles (~5000 lines)
        ├── SkyTasks.css             # Sky + workflow styles (~700 lines)
        ├── AgentFormDialog.jsx      # Create/edit agent dialog
        ├── AgentDetailPanel.jsx     # Agent detail side panel
        ├── AgentMapPanel.jsx        # SVG Operation Graph
        ├── AgentMapVerticalPanel.jsx
        ├── AgentCardsPanel.jsx      # Card grid view
        ├── AgentMcpMatrixPanel.jsx  # Agent×MCP cross-reference
        ├── AgentTestPanel.jsx       # Test execution panel
        ├── AgentLogViewer.jsx       # Agent log viewer
        ├── McpServersPanel.jsx      # External MCP registry + dialog
        ├── McpBindingsPanel.jsx     # MCP bindings editor (in agent form)
        ├── ConfigurationPanel.jsx   # App settings (localStorage)
        ├── SkyTasksPanel.jsx        # Tasks list with filters
        ├── SkyTaskDetail.jsx        # Task detail with workflow steps
        ├── TicketDetails2.jsx       # React Flow workflow visualization
        ├── SkyTrackingReport.jsx    # 7-day productivity report
        ├── SkillsPanel.jsx          # Agent skills list
        ├── SkillEditorDialog.jsx    # Skill editor
        ├── KnowledgePanel.jsx       # Knowledge/reference viewer
        └── KnowledgeUploadDialog.jsx
```

---

## 4. Data Model

### Agent object (`agents.json`)

```json
{
  "id": 1,
  "type": "local|external",
  "role": "sub-agent|orchestrator|null",
  "stage": "Draft|Design|Dev|Released",
  "environment": "AOC|Sky",
  "suite": ["CES 2.X"],
  "tags": ["logs", "search"],
  "slug": "log-agent",
  "calls": ["other-agent-slug"],
  "mcpBindings": [
    { "serverId": "elasticsearch", "tools": ["search"], "purpose": "..." }
  ],
  "enabled": true,
  "agent": {
    "name": "Log Agent",
    "description": "...",
    "url": "http://localhost:8010",
    "version": "2.0.0",
    "capabilities": { "streaming": true, "async_execution": true },
    "tools": [
      { "id": "tool-id", "name": "Tool Name", "description": "...", "tags": [] }
    ],
    "handler": {
      "class": "framework.handlers.DefaultRequestHandler",
      "args": { "agent_executor": "...", "task_store": "..." }
    }
  }
}
```

**API enrichment**: `buildAgentRecord()` adds `managedSkills`, `references` arrays for local agents by reading disk.

### MCP Server object (`mcp-servers.json`)

```json
{
  "id": "elasticsearch",
  "name": "Elasticsearch",
  "description": "...",
  "url": "mcp://host:port",
  "transport": "stdio|sse",
  "type": "local|external",
  "role": "public|private",
  "stage": "Draft|Design|Dev|Released",
  "environment": "AOC|Sky",
  "suite": [],
  "tools": ["search", "index", "aggregate"],
  "tags": ["logs", "search"],
  "enabled": true
}
```

### Sky Task object (`sky-tasks.json`)

```json
{
  "id": "87342",
  "priority": "HIGH|CRITICAL|MEDIUM|LOW",
  "summary": "...",
  "account": "AT&T|XL|TMO",
  "orderId": "ORD-xxxx-XX",
  "slaDeadline": "2026-02-20T13:43:00Z",
  "created": "2026-02-20",
  "reporter": "System (auto)|CRM Portal|Monitoring Agent",
  "assignee": "David Cohen|Unassigned",
  "status": "IN PROGRESS|OPEN|DONE",
  "workflowName": "Fix Order",
  "workflowDesc": "...",
  "currentStep": 2,
  "errorSnippet": "{ JSON error payload }",
  "relatedTickets": ["87340"],
  "history": [{ "date": "Feb 20, 09:15", "text": "...", "active": true }],
  "steps": [
    {
      "id": 1,
      "type": "AUTO-AGENT|HYBRID|MANUAL",
      "label": "Validate Order Integrity",
      "status": "DONE|IN_PROGRESS|PENDING",
      "skippable": false,
      "agentLog": ["[timestamp] message"],
      "manualReview": {
        "type": "DATE_ADJUSTMENT",
        "fromValue": "...",
        "toValue": "...",
        "notesPlaceholder": "..."
      }
    }
  ],
  "assigneeGroup": "Support Team|OH Fallouts Team|Agents|ACE Group|..."
}
```

### Per-agent directory structure

```
src/config/agents/<slug>/
├── services/
│   └── handler.py          # Python handler (executed from UI)
├── agent_servers.json      # Server contract config
├── skills/
│   ├── README.optional.md
│   └── <skill-name>/
│       ├── SKILL.md
│       ├── scripts/
│       ├── references/
│       └── assets/
└── references/
    ├── manifest.json       # Reference entries metadata
    └── <uploaded files>
```

---

## 5. UI Screens & Navigation

### Sidebar structure

```
Observability (section header — configurable title)
  ├─ Agents & Local MCPs     [view: list]
  ├─ Operation Graph          [view: map]
  ├─ External MCP             [view: mcp]
  ├─ Agent to MCPs            [view: matrix]
  └─ Test                     [view: test]

Resolver: Sky (section header — visible when showSkyMenu=true)
  ├─ Tasks List               [view: sky-tasks]
  ├─ Ticket Details 2         [view: sky-ticket2]
  └─ Tracking Report          [view: sky-report]

Configuration                 [view: config, password-protected]
```

### Screen details

| View | Component | Key features |
|------|-----------|-------------|
| `list` | AgentConfig (inline) | Sortable table, pagination, tag/stage/suite filters, create/edit/delete/import agents + local MCPs, detail panel with skills/references/MCP bindings tabs |
| `cards` | AgentCardsPanel | Card grid view of same data |
| `map` | AgentMapPanel | SVG node graph showing consumers → agents → MCPs. Node colors by type. Log viewer on double-click. |
| `mcp` | McpServersPanel | External MCP registry. Create/edit/delete. Expandable tool list. |
| `matrix` | AgentMcpMatrixPanel | Cross-reference grid: agents × MCP servers |
| `test` | AgentTestPanel | Execute traced requests through agent graph |
| `sky-tasks` | SkyTasksPanel | Fallout ticket list with priority/status badges, search, agent-toggle filter, POC mode toggle. Click row → SkyTaskDetail drill-down |
| `sky-ticket2` | TicketDetails2 | React Flow workflow for ticket #87342. Parallel step layout. Click node → edit drawer with Python execution + sandbox |
| `sky-report` | SkyTrackingReport | 7-day productivity dashboard: cards, group table, daily chart |
| `config` | ConfigurationPanel | App settings via localStorage |

### Global toolbar filters

The toolbar (visible on list/cards/map views) provides:

- **Search** — filters by name, description, tags, URL, type
- **Tags** — multi-select dropdown, filters agents + MCPs
- **Stage** — multi-select (Draft/Design/Dev/Released)
- **Suite** — multi-select (CES 2.X/Classic/Ensemble/Cross/TBD)

All filters apply across: list view, cards view, Operation Graph, External MCP, and Agent to MCPs matrix.

---

## 6. Backend API

All endpoints in `server.js`. Base URL: `http://localhost:3001`.

### Agent endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/agents` | List all agents (enriched with skills + references) |
| POST | `/api/agents` | Create agent |
| PUT | `/api/agents/:id` | Update agent |
| DELETE | `/api/agents/:id` | Delete agent + disk folder |
| PATCH | `/api/agents/:id/enabled` | Toggle enabled |
| PUT | `/api/agents/:id/mcp-bindings` | Update MCP bindings |
| POST | `/api/agents/:slug/skills` | Create skill |
| PUT | `/api/agents/:slug/skills/:name` | Update skill |
| DELETE | `/api/agents/:slug/skills/:name` | Delete skill |
| POST | `/api/agents/:slug/references` | Add reference item |
| DELETE | `/api/agents/:slug/references/:id` | Delete reference item |
| GET | `/api/agents/:slug/references/files` | List reference files |
| POST | `/api/agents/:slug/references/upload` | Upload reference file |
| GET | `/api/agents/:slug/references/download/:filename` | Download reference file |
| DELETE | `/api/agents/:slug/references/files/:filename` | Delete reference file |
| GET | `/api/agents/:slug/handler` | Read handler.py content |
| GET | `/api/agents/:slug/servers-config` | Read agent_servers.json |
| GET | `/api/agent-handlers` | List agents with handler.py |

### MCP Server endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/mcp-servers` | List all |
| POST | `/api/mcp-servers` | Create |
| PUT | `/api/mcp-servers/:id` | Update |
| DELETE | `/api/mcp-servers/:id` | Delete |
| PATCH | `/api/mcp-servers/:id/enabled` | Toggle enabled |

### Other endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/consumers` | List consumers |
| POST | `/api/consumers` | Add consumer |
| DELETE | `/api/consumers/:id` | Delete consumer |
| GET | `/api/sky-tasks` | Get all Sky tasks |
| POST | `/api/agents/import` | Import agent from ZIP |
| POST | `/api/agents/import-confirm` | Confirm partial import |
| GET | `/api/agents/:slug/logs` | Get agent log files |
| POST | `/api/test/execute` | Execute traced test |

### Middleware

- **Access logging**: Every request logged to `user_access.log` as `[dd-mm-yy hh:mm] METHOD /path — hostname (ip)`. Uses DNS reverse lookup for hostname.
- **JSON body parser**: `express.json({ limit: '10mb' })`
- **Static files**: `express.static('src/config')`

### Frontend API client (`src/api.js`)

Thin wrapper around `fetch` with error handling. All methods return parsed JSON. Vite proxy handles `/api` routing.

---

## 7. SDLC & Development Workflow

### Running the app

```bash
# Terminal 1 — Backend API
node server.js
# → http://0.0.0.0:3001

# Terminal 2 — Frontend
npm run dev
# → http://localhost:5173 (also on LAN via 0.0.0.0)
```

### Adding a new UI page

1. Add sidebar item in `SIDEBAR_ITEMS_BASE` in `AgentConfig.jsx`
2. Import component and add `activeView === 'view-key'` in JSX ternary chain
3. Create `src/components/AgentConfig/MyPanel.jsx`
4. Add styles to `AgentConfig.css` or `SkyTasks.css`

### Adding a new API endpoint

Add in `server.js` before `app.listen()`:

```js
app.get('/api/my-data', (req, res) => {
  const filePath = path.join(DATA_DIR, 'common', 'my-data.json')
  if (!fs.existsSync(filePath)) return res.json([])
  res.json(JSON.parse(fs.readFileSync(filePath, 'utf-8')))
})
```

### Adding a new field to agents or MCPs

1. Add default value in `agents.json` / `mcp-servers.json` (script or manual)
2. Include in `buildAgentRecord()` in `server.js`
3. Pass through in POST/PUT handlers (`req.body` destructuring)
4. Add UI in `AgentFormDialog.jsx` (agents) or `McpServerDialog` in `McpServersPanel.jsx` (MCPs)
5. Include in `handleSave` payload in `AgentConfig.jsx`
6. Optionally add column to `COLUMNS` and cell rendering in the table
7. Optionally add filter in toolbar

### Git workflow

- Repository: `https://github.com/avisratmp-stack/Agent-Manager.git`
- Branch: `master`
- Corporate proxy bypass: `git -c http.proxy="" -c https.proxy="" push origin master`
- PowerShell note: use `;` not `&&` for chaining commands

### Coding standards

- **No TypeScript** — all `.jsx` / `.js`
- **No Tailwind / CSS modules** — plain CSS with prefix conventions
- **Functional components only** — hooks for state
- **No state library** — props from AgentConfig, localStorage for config
- **Icons** — always `lucide-react`
- **Class naming**: `ac-*` (shell), `sky-*` (Sky), `td2-*` (TicketDetails2), `map-*` (graph)

---

## 8. Key Patterns

### Python Execution (in task detail screens)

Both `SkyTaskDetail.jsx` and `TicketDetails2.jsx` share this pattern:

1. **Auto-suggestion**: `STEP_HANDLER_SUGGESTIONS` maps step labels → agent slugs. On step open, the suggested handler is auto-selected.
2. **Handler dropdown**: Lists all agents with `handler.py`. Suggested one marked with ★.
3. **Execute mode**: Read-only code view, "Run" button executes handler.
4. **Sandbox mode**: Editable textarea, "Run in Sandbox" button for safe testing. "Reset" button restores original code.
5. **Output panel**: Green for normal execution, purple for sandbox output.

### Filtering pattern

Toolbar filters (`tags`, `stages`, `suites`) use:
- `useState` for selected values array
- `useRef` + click-outside `useEffect` for dropdown dismiss
- Applied in `useMemo` filter chains for `filteredAgents`, `filteredMcpServers`, `listItems`
- Chip display below toolbar for active filters

### Dialog/Drawer pattern

- Overlay: `position: fixed; inset: 0; background: rgba(0,0,0,0.25)`
- Drawer slides from right: `animation: slide-in 0.2s ease`
- Click overlay = close, click drawer = `e.stopPropagation()`

---

## 9. Configuration System

`ConfigurationPanel.jsx` manages app settings persisted in `localStorage`:

| Setting | Type | Description |
|---------|------|-------------|
| `appTitle` | string | Header title (default: "IT Operation") |
| `sectionTitle` | string | First section name (default: "Observability") |
| `showSkyMenu` | boolean | Show/hide Sky section |
| `visibleColumns` | string[] | Which table columns to show |
| `stagePipeline` | string[] | Stage lifecycle values |
| `defaultView` | string | Initial page on load |
| `defaultSortColumn` | string | Default sort column |
| `defaultSortDirection` | string | asc/desc |
| `pageSize` | number | Table rows per page |
| `sidebarOpen` | boolean | Sidebar expanded/collapsed |
| `activeEnvironment` | string | Filter by environment |
| `defaultAgentOrigin` | string | Default agent type on create |
| `defaultAgentStage` | string | Default stage on create |
| `defaultEnvironment` | string | Default environment on create |

Access via `appConfig` prop from `AgentConfig.jsx`. Password gate: `00`.

---

## 10. Color Palette

```
Greens:  #f0fdf4  #dcfce7  #86efac  #22c55e  #16a34a  #15803d
Blues:   #eff6ff  #dbeafe  #93c5fd  #3b82f6  #2563eb  #1d4ed8
Purples: #faf5ff  #f5f3ff  #ede9fe  #c4b5fd  #a78bfa  #7c3aed  #6d28d9
Reds:    #fef2f2  #fecaca  #f87171  #dc2626
Ambers:  #fffbeb  #fef3c7  #fde68a  #d97706  #b45309
Grays:   #fafafa  #f8fafc  #f1f5f9  #e2e8f0  #cbd5e1  #94a3b8  #64748b  #334155  #1e293b  #0f172a
```

### Status colors

```js
PRIORITY: { CRITICAL: '#dc2626', HIGH: '#ea580c', MEDIUM: '#ca8a04', LOW: '#16a34a' }
STATUS:   { DONE: '#15803d', IN_PROGRESS: '#1d4ed8', PENDING: '#b0b0b0' }
STEP_TYPE: { AUTO-AGENT: '#2563eb', HYBRID: '#7c3aed', MANUAL: '#ea580c' }
```

### Suite badge: purple (`#ede9fe` bg, `#7c3aed` text)

---

## 11. AOC Domain Glossary

| Term | Meaning |
|------|---------|
| **AOC** | Autonomous Operations Center — the parent product |
| **Sky** | Fallout management system for telco tickets |
| **iPaaS** | Integration Platform as a Service — Amdocs product |
| **MCP** | Model Context Protocol — tool/server interface for agents |
| **Fallout** | Failed operation (order, billing, provisioning) requiring resolution |
| **DLQ** | Dead Letter Queue — messages that couldn't be processed |
| **Suite** | Product family: CES 2.X, Classic, Ensemble, Cross |
| **PSU CoE** | Professional Services Unit Center of Excellence |
| **Agent** | Autonomous software component with A2A endpoint |
| **Handler** | Python script (`handler.py`) that implements agent logic |
| **Sandbox** | Safe execution environment for testing edited Python code |
| **Workflow** | Sequence of steps (Auto/Hybrid/Manual) to resolve a ticket |
| **SLA** | Service Level Agreement — deadline for ticket resolution |
| **PMX** | Platform modernization (Spring Boot, PostgreSQL, Kubernetes) |
