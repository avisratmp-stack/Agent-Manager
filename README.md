# Agent Manager

A full-stack management UI for **AI Agents** and **MCP (Model Context Protocol) Servers**, built for observability and operations teams. Create, configure, and visualize the relationships between agents, their MCP bindings, consumers, and tools — all from a single interface.

![Stack](https://img.shields.io/badge/React-18-blue) ![Stack](https://img.shields.io/badge/Node.js-Express-green) ![Stack](https://img.shields.io/badge/Vite-5-purple)

## What It Does

- **Agent Registry** — Manage 30+ agents (local and external) with skills, tools, MCP bindings, and metadata
- **MCP Server Registry** — Track external and local MCP servers, each with their own tools and configuration
- **Operation Map** — Interactive SVG visualization showing consumers → agents → MCP servers with live connection highlighting
- **Agent-to-MCP Matrix** — Cross-reference table showing which agents bind to which MCP servers
- **Test & Trace** — Submit requests to any agent and see the full execution trace (agent → sub-agent → MCP calls) with a Stub Mode for testing without live backends
- **Traffic Logger** — Per-agent request logs with request/response/reasoning detail
- **Import/Export** — Import agents from `.zip` files or Excel spreadsheets

## Screenshots

The UI is organized under an **Observability** sidebar with these views:

| View | Description |
|------|-------------|
| **Agents & Local MCPs** | Sortable data grid with filtering by tags, search, stage, and origin |
| **Operation Map** | Interactive graph: consumers → public agents → private agents → MCPs |
| **External MCP** | Card-based registry of MCP servers with inline tool lists |
| **Agent to MCPs** | Binding matrix showing agent ↔ MCP relationships |
| **Test** | Execute traces with optional Stub Mode that routes all MCP calls to a universal stub |

## Project Structure

```
Agent-Manager/
├── server.js                        # Express API server (port 3001)
├── index.html                       # Vite entry point
├── vite.config.js                   # Vite config with /api proxy to :3001
├── package.json
│
├── src/
│   ├── main.jsx                     # React entry
│   ├── App.jsx                      # Root component
│   ├── api.js                       # API client (all fetch calls)
│   │
│   ├── components/AgentConfig/
│   │   ├── AgentConfig.jsx          # Main shell: sidebar, toolbar, routing
│   │   ├── AgentConfig.css          # All styles
│   │   ├── AgentFormDialog.jsx      # Create/edit agent dialog
│   │   ├── AgentDetailPanel.jsx     # Side panel with agent details
│   │   ├── AgentMapPanel.jsx        # Horizontal operation map (SVG)
│   │   ├── AgentMapVerticalPanel.jsx# Vertical operation map variant
│   │   ├── AgentCardsPanel.jsx      # Card-based view
│   │   ├── AgentTestPanel.jsx       # Test trace execution UI
│   │   ├── AgentMcpMatrixPanel.jsx  # Agent ↔ MCP binding matrix
│   │   ├── AgentLogViewer.jsx       # Per-agent traffic log viewer
│   │   ├── McpServersPanel.jsx      # MCP server registry & editor
│   │   ├── McpBindingsPanel.jsx     # MCP binding editor (in agent dialog)
│   │   ├── SkillsPanel.jsx          # Skills management panel
│   │   ├── SkillEditorDialog.jsx    # Skill markdown editor
│   │   ├── KnowledgePanel.jsx       # Knowledge file management
│   │   └── KnowledgeUploadDialog.jsx# Knowledge file upload
│   │
│   └── data/
│       ├── common/
│       │   ├── agents.json          # Central agent registry (31 agents, 3 consumers)
│       │   └── mcp-servers.json     # Central MCP server registry (31 servers)
│       ├── agents/<slug>/           # Local agent folders
│       │   ├── agent.json           # Agent config override
│       │   ├── skills/*/SKILL.md    # Agent skills (markdown)
│       │   └── knowledge/           # Knowledge files
│       └── mcp/<slug>/              # Local MCP folders
│           ├── config/server.json   # MCP server config
│           └── README.md
│
├── logger/                          # Per-agent traffic logs (JSON)
│   ├── log-agent.json
│   └── apm-agent.json
│
└── public/
    └── data-model.html              # Mermaid entity diagram
```

## Data Model

[View the full Entity Relationship Diagram on Mermaid Live](https://mermaid.live/edit#pako:eNqtWFtT4zYU_isaP21nSCDZJCV5o8BOGZLZHehL23QYxT52tMiSK8mBlPDfeyTZjoMFy7TkYYmkc_nO_WSfolgmEM0iUBeMZormS0Hwcy6FLnNQ5Mmf7UcbxURGWEK-XZNlBP2sT-KKrjdYRh1KQXOoCb-qBKXdgtqwGLq0f_5FYsq5RnKagTBE8zLT7g6Smvx5KfyXM0fSgsbwWOMqBfu7BCIsLBbjdQCZ2RYWGZeogOwIPBpQgvIApZLcUhbliqOwHdHlqucR7kih2IaagDX4B2mQ7QI0ywSSXsAG_70BDlRDCJG1FxlSya2fnOdSqYhH6BTqNtdKIi4qCAi6Qg9ZW9gGiJFZxsPuRUTWuynjaKtlIpyugOs3Y-GjINO92W_H5AJSJphhUgQSp0qHhOmC0607BhyRgI4VK5yMZfSwpoaYNXgXkERCADApFbd5JpJC2kygSaJAhwg3oLQXrCHHQ4Akx3qw0ubzRfW91AFzz2lBV4yjraDbttaBQWlAcysQdZVFIRW6rrkMhZLqrYjv4BHisjK-4XNPHQi_UpHwYInGnGobvnVF4c8FNevXhJypTAcEOa9XmDAb0cf1167IdnlRfX-nkczG2x6IP7yB4zf0QrjZoAT7xhKEwlIWDNr_Si0nPpxZ-7qxRD0OG8wHe9PBv4iLX5hIrJquFRrbHqirhHyxDUpBCgpEjImDXLfurR9qU1Y7qnWFWK40GFeJjr56KMPNpChVITU4I7doI9NkVYGDR6ZNEL4H8qOGDxhCw2INVMXrj40Eolycf3u7xnHeCIgdX1Pun-r2TaTg259C-aio0LaUrCdNwqRt5Oifd3D-50HxIcPh49t8O-Kv1FwVQlcW74qfL6D9VUfX7T3jb2hqD71S2K_aMujjgGY0zLLcXl_N5_08lPyYIsbOimWUU3WfyAdBHphZk9_PFnOSKnzNqTH7NtKgvBbyAZ2MsXkV6X1Dwgzkr3mnwuj-MEEapmPiLe1onsvsUhi1DShWgMuMNlftGsS7Hh2shvHnZBTKWZYjB80LpL-6_UpOJyeh7QxHkZbCTyg_Xfc3BhM9hPLGowlNiridDMf1mYmNvD_Mabn6jhWMUwCXTZuqTBRldQQMiw7rxfIVOhQZtNSUvkXG2FK1rVKl5MGUsF2CYzGKeLvQrgNX4qyrAtgSaqgnK7mFtuWSJgFc2BTc2vPFJ_BTeKtzgUuYQslSvdoS_aj9rp0T3aHvDpjOKctCbcTVyB0Ktsb7grF7WqMpwNOkYsXWSs0Q56Gp2DE-wlA_wGpLvXnH_tJZHE7VxNXfzeXZxeKyVff7faz-wbLb9XryqfqJMLMa3C77yeNqerx_t8S7XWd3nbndSR_Qtp4rroMV8H0s9cr2grq-PqRyO9k75KK1rpPP3H5mB7_uWolErRXFktqNQOMoqWlbz8_S4dgvBbODtaXFUb3vNTRICiU3uLOFoXSi0_y-CARI7rqlNmuGcvWrZE03TbJ1qCutfgzNfNYZyoT-Ecd-JIS4Xti_e1kme5C41xxCPPBG0_4tA-4qaYobBMcZjxO_QDnOxD3UirhKllZXfpErQcqq8bVIlyI6ijLFkmhmVAlHEVZRTu0xcnWOkNZgK9nyJJBS7ImW7xnZCir-kDKvOZUss3U0SynXeCoL7KNQ_bdCQwJ2wJ_LUphoNjidDJyQaPYUPUaz3nA66k8_DybTyXg0Hkwnw_FRtMX70XjSHw5Gw5PTwSlenwyej6J_nOJBfzoejk9Hwwl-huPpz9PnfwEncG_3)

Each **Agent** has:
- `type` (local / external), `role` (public / sub-agent / private), `stage` (Design / Dev / Released)
- Nested `agent` object: name, description, url, version, capabilities, tools, handler
- `mcpBindings[]` — links to MCP servers with selected tools and a purpose
- `calls[]` — slugs of sub-agents this agent invokes
- `tags[]` — filterable labels

Each **MCP Server** has:
- `type` (local / external), `role` (public / private), `stage`, `enabled`
- `tools[]` — available tool definitions
- `url` and `transport` (external only)

**Consumers** call agents directly and are displayed at the entry point of the Operation Map.

## Prerequisites

- **Node.js** 18+ (LTS recommended)
- **npm** 9+

## Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/avisratmp-stack/Agent-Manager.git
cd Agent-Manager
```

### 2. Install dependencies

```bash
npm install
```

### 3. Start the backend API server

```bash
npm run dev:server
```

This starts the Express server on **http://localhost:3001**. It serves the REST API and persists data to the JSON files under `src/data/`.

### 4. Start the frontend dev server

Open a second terminal:

```bash
npm run dev
```

This starts Vite on **http://localhost:5173** with a proxy that forwards `/api/*` requests to the backend.

### 5. Open the app

Navigate to **http://localhost:5173** in your browser.

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/agents` | List all agents (with skills & knowledge) |
| `POST` | `/api/agents` | Create a new agent |
| `PUT` | `/api/agents/:id` | Update an agent |
| `DELETE` | `/api/agents/:id` | Delete an agent |
| `PATCH` | `/api/agents/:id/enabled` | Toggle agent enabled/disabled |
| `PUT` | `/api/agents/:id/mcp-bindings` | Update agent MCP bindings |
| `GET` | `/api/agents/:slug/logs` | Get traffic logs for an agent |
| `GET` | `/api/mcp-servers` | List all MCP servers |
| `POST` | `/api/mcp-servers` | Create a new MCP server |
| `PUT` | `/api/mcp-servers/:id` | Update an MCP server |
| `DELETE` | `/api/mcp-servers/:id` | Delete an MCP server |
| `PATCH` | `/api/mcp-servers/:id/enabled` | Toggle MCP server enabled/disabled |
| `POST` | `/api/agents/import` | Import agent from `.zip` file |
| `POST` | `/api/test/execute` | Execute a test trace (supports `stubMode`) |

## Production Build

```bash
npm run build
npm run preview
```

The `build` command outputs to `dist/`. Serve `dist/` with any static file server and run `server.js` separately as the API backend.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Vite 5, Lucide React icons |
| Backend | Node.js, Express 5 |
| Storage | File-system JSON (no database required) |
| Utilities | adm-zip (import), xlsx (Excel parsing), multer (file upload) |

## License

This project is provided as-is for internal and educational use.
