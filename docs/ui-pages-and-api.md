# AOC Agent Manager — UI Pages, Components & Backend API

> Auto-generated reference of all UI pages, their components, and the backend APIs they consume.

---

## Application Shell

| Component | File | Description |
|-----------|------|-------------|
| **AgentConfig** | `AgentConfig.jsx` | Main shell — sidebar, routing, login gate, config password gate, breadcrumbs, header toolbar |
| **App** | `App.jsx` | Root component, renders AgentConfig |

**CSS files:**
- `AgentConfig.css` — global styles, sidebar, toolbar, login page, dialogs
- `SkyTasks.css` — Sky tasks, ticket details, tracking report, React Flow styles

---

## UI Pages

### Observability Section

#### 1. Agents & Local MCPs (List View)

| | |
|---|---|
| **Menu** | Observability > Agents & Local MCPs |
| **View key** | `list` |
| **Component** | `AgentConfig.jsx` (inline table rendering) |
| **Sub-components** | `AgentFormDialog`, `AgentDetailPanel`, `AgentLogViewer`, `KnowledgePanel`, `SkillsPanel`, `SkillEditorDialog`, `KnowledgeUploadDialog` |

| API Call | Method | Endpoint | Purpose |
|----------|--------|----------|---------|
| Load agents | GET | `/api/agents` | Fetch all agents with skills & knowledge |
| Load consumers | GET | `/api/consumers` | Fetch consumer list |
| Load MCP servers | GET | `/api/mcp-servers` | Fetch MCP servers for bindings |
| Create agent | POST | `/api/agents` | Add new agent |
| Update agent | PUT | `/api/agents/:id` | Edit agent |
| Delete agent | DELETE | `/api/agents/:id` | Remove agent |
| Toggle agent | PATCH | `/api/agents/:id/enabled` | Enable/disable agent |
| Import agent | POST | `/api/agents/import` | Upload agent ZIP |
| Confirm import | POST | `/api/agents/import-confirm` | Finalize incomplete import |
| Create skill | POST | `/api/agents/:slug/skills` | Add skill to agent |
| Update skill | PUT | `/api/agents/:slug/skills/:name` | Edit skill content |
| Delete skill | DELETE | `/api/agents/:slug/skills/:name` | Remove skill |
| Add knowledge | POST | `/api/agents/:slug/knowledge` | Add knowledge entry |
| Delete knowledge | DELETE | `/api/agents/:slug/knowledge/:id` | Remove knowledge entry |
| Get handler | GET | `/api/agents/:slug/handler` | Read handler.py content |
| Get servers config | GET | `/api/agents/:slug/servers-config` | Read agent_servers.json |
| Get logs | GET | `/api/agents/:slug/logs` | Fetch agent log data |

---

#### 2. Agents (Cards View)

| | |
|---|---|
| **Menu** | Observability > (toggle via toolbar) |
| **View key** | `cards` |
| **Component** | `AgentCardsPanel.jsx` |

| API Call | Method | Endpoint |
|----------|--------|----------|
| (shared) | GET | `/api/agents` |

---

#### 3. Operation Graph

| | |
|---|---|
| **Menu** | Observability > Operation Graph |
| **View key** | `map` |
| **Component** | `AgentMapPanel.jsx` |
| **Sub-components** | `AgentLogViewer` (in split view) |

| API Call | Method | Endpoint |
|----------|--------|----------|
| (shared) | GET | `/api/agents` |
| (shared) | GET | `/api/consumers` |
| (shared) | GET | `/api/mcp-servers` |

SVG-based node graph. Node types: Consumer, Local Agent, External Agent, Private Agent, Local MCP, External MCP.

---

#### 4. Operation Graph (Vertical)

| | |
|---|---|
| **View key** | `mapv` |
| **Component** | `AgentMapVerticalPanel.jsx` |

| API Call | Method | Endpoint |
|----------|--------|----------|
| (shared) | GET | `/api/agents`, `/api/consumers`, `/api/mcp-servers` |

---

#### 5. External MCP

| | |
|---|---|
| **Menu** | Observability > External MCP |
| **View key** | `mcp` |
| **Component** | `McpServersPanel.jsx` |
| **Sub-components** | `McpServerDialog` |

| API Call | Method | Endpoint | Purpose |
|----------|--------|----------|---------|
| List servers | GET | `/api/mcp-servers` | Fetch all MCP servers |
| Create server | POST | `/api/mcp-servers` | Add MCP server |
| Update server | PUT | `/api/mcp-servers/:id` | Edit MCP server |
| Delete server | DELETE | `/api/mcp-servers/:id` | Remove MCP server |
| Toggle enabled | PATCH | `/api/mcp-servers/:id/enabled` | Enable/disable server |

---

#### 6. Agent to MCPs (Matrix)

| | |
|---|---|
| **Menu** | Observability > Agent to MCPs |
| **View key** | `matrix` |
| **Component** | `AgentMcpMatrixPanel.jsx` |

| API Call | Method | Endpoint |
|----------|--------|----------|
| (shared) | GET | `/api/agents`, `/api/mcp-servers` |

Cross-reference matrix of agents × MCP servers showing bindings.

---

#### 7. Test

| | |
|---|---|
| **Menu** | Observability > Test |
| **View key** | `test` |
| **Component** | `AgentTestPanel.jsx` |

| API Call | Method | Endpoint | Purpose |
|----------|--------|----------|---------|
| Execute trace | POST | `/api/test/execute` | Simulate traced request through agent graph |

---

### Resolver: Sky Section

#### 8. Tasks List

| | |
|---|---|
| **Menu** | Resolver: Sky > Tasks List |
| **View key** | `sky-tasks` |
| **Component** | `SkyTasksPanel.jsx` |
| **Sub-components** | `SkyTaskDetail.jsx` (drill-down) |

| API Call | Method | Endpoint | Purpose |
|----------|--------|----------|---------|
| Load tasks | GET | `/api/sky-tasks` | Fetch all Sky fallout tasks |
| Load handlers | GET | `/api/agent-handlers` | List available Python handlers |
| Get handler code | GET | `/api/agents/:slug/handler` | Fetch handler.py content |

Clicking a task row navigates to `SkyTaskDetail` which shows:
- Ticket info (left pane)
- Workflow steps with expand/collapse (right pane)
- Agent console logs, manual review forms
- Python execution section per step

---

#### 9. Ticket Details 2

| | |
|---|---|
| **Menu** | Resolver: Sky > Ticket Details 2 |
| **View key** | `sky-ticket2` |
| **Component** | `TicketDetails2.jsx` |
| **Library** | `@xyflow/react` (React Flow) |

| API Call | Method | Endpoint | Purpose |
|----------|--------|----------|---------|
| Load tasks | GET | `/api/sky-tasks` | Fetch ticket #87342 data |
| Load handlers | GET | `/api/agent-handlers` | List Python handlers |
| Get handler code | GET | `/api/agents/:slug/handler` | Fetch handler.py content |

React Flow workflow visualization with:
- Parallel step layout (Steps 2 & 3 side by side)
- Condition labels on fork edges
- Click-to-open editing drawer per step
- MiniMap, fixed zoom (no drag/zoom)

---

#### 10. Tracking Report

| | |
|---|---|
| **Menu** | Resolver: Sky > Tracking Report |
| **View key** | `sky-report` |
| **Component** | `SkyTrackingReport.jsx` |

| API Call | Method | Endpoint |
|----------|--------|----------|
| None | — | Client-side generated data |

7-day productivity report with:
- Summary cards (resolved, opened, avg time, SLA)
- Group comparison table
- Daily bar chart + expandable daily details

---

### Standalone

#### 11. Configuration

| | |
|---|---|
| **Menu** | Configuration (standalone) |
| **View key** | `config` |
| **Component** | `ConfigurationPanel.jsx` |
| **Protected** | Password gate (password: `00`, required every access) |

| API Call | Method | Endpoint |
|----------|--------|----------|
| None | — | Uses `localStorage` for persistence |

Settings: section title, visible columns, stage pipeline, Sky menu visibility.

---

## Shared / Utility Components

| Component | File | Used By |
|-----------|------|---------|
| `AgentFormDialog` | `AgentFormDialog.jsx` | List view — create/edit agent dialog with Handler & Contract tabs |
| `AgentDetailPanel` | `AgentDetailPanel.jsx` | List view — agent detail side panel |
| `AgentLogViewer` | `AgentLogViewer.jsx` | List, Map views — agent log viewer |
| `McpBindingsPanel` | `McpBindingsPanel.jsx` | Agent form — MCP bindings editor |
| `KnowledgePanel` | `KnowledgePanel.jsx` | Agent detail — knowledge base viewer |
| `KnowledgeUploadDialog` | `KnowledgeUploadDialog.jsx` | Agent detail — upload knowledge files |
| `SkillsPanel` | `SkillsPanel.jsx` | Agent detail — managed skills list |
| `SkillEditorDialog` | `SkillEditorDialog.jsx` | Agent detail — create/edit skill dialog |

---

## Backend API Summary

### Base URL: `http://localhost:3001`

Frontend proxied via Vite (`/api` → `localhost:3001`).

| Group | Endpoints |
|-------|-----------|
| **Agents** | `GET/POST /api/agents`, `PUT/DELETE /api/agents/:id`, `PATCH /api/agents/:id/enabled`, `PUT /api/agents/:id/mcp-bindings` |
| **Agent Import** | `POST /api/agents/import`, `POST /api/agents/import-confirm` |
| **Agent Skills** | `POST /api/agents/:slug/skills`, `PUT/DELETE /api/agents/:slug/skills/:name` |
| **Agent Knowledge** | `POST /api/agents/:slug/knowledge`, `DELETE /api/agents/:slug/knowledge/:id` |
| **Agent Files** | `GET /api/agents/:slug/handler`, `GET /api/agents/:slug/servers-config`, `GET /api/agent-handlers` |
| **Agent Logs** | `GET /api/agents/:slug/logs` |
| **Consumers** | `GET /api/consumers` |
| **MCP Servers** | `GET/POST /api/mcp-servers`, `PUT/DELETE /api/mcp-servers/:id`, `PATCH /api/mcp-servers/:id/enabled` |
| **Sky Tasks** | `GET /api/sky-tasks` |
| **Test Execution** | `POST /api/test/execute` |

### Middleware

- **Access logging** — every request logged to `user_access.log` with `[dd-mm-yy hh:mm] METHOD /path — hostname (ip)`
- **JSON body parser** — `express.json({ limit: '10mb' })`

---

## Frontend API Client (`src/api.js`)

Wrapper around `fetch` with error handling. Methods:

| Method | Maps To |
|--------|---------|
| `api.getAgents()` | `GET /api/agents` |
| `api.getConsumers()` | `GET /api/consumers` |
| `api.createAgent(data)` | `POST /api/agents` |
| `api.updateAgent(id, data)` | `PUT /api/agents/:id` |
| `api.deleteAgent(id)` | `DELETE /api/agents/:id` |
| `api.toggleAgentEnabled(id, enabled)` | `PATCH /api/agents/:id/enabled` |
| `api.updateAgentMcpBindings(id, bindings)` | `PUT /api/agents/:id/mcp-bindings` |
| `api.createSkill(slug, name, content)` | `POST /api/agents/:slug/skills` |
| `api.updateSkill(slug, name, content)` | `PUT /api/agents/:slug/skills/:name` |
| `api.deleteSkill(slug, name)` | `DELETE /api/agents/:slug/skills/:name` |
| `api.addKnowledge(slug, item)` | `POST /api/agents/:slug/knowledge` |
| `api.deleteKnowledge(slug, id)` | `DELETE /api/agents/:slug/knowledge/:id` |
| `api.getMcpServers()` | `GET /api/mcp-servers` |
| `api.createMcpServer(data)` | `POST /api/mcp-servers` |
| `api.updateMcpServer(id, data)` | `PUT /api/mcp-servers/:id` |
| `api.deleteMcpServer(id)` | `DELETE /api/mcp-servers/:id` |
| `api.toggleMcpEnabled(id, enabled)` | `PATCH /api/mcp-servers/:id/enabled` |
| `api.getAgentLogs(slug)` | `GET /api/agents/:slug/logs` |
| `api.importAgent(file)` | `POST /api/agents/import` |
| `api.importAgentConfirm(file, agentDef)` | `POST /api/agents/import-confirm` |
| `api.executeTrace(slug, action, params, stub)` | `POST /api/test/execute` |
