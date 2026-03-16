# Backend API Reference

All endpoints defined in `server.js`. Base URL: `http://localhost:3001`.
Frontend calls via `fetch('/api/...')` (Vite proxies to Express).

## Agent Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/agents` | List all agents from registry |
| POST | `/api/agents` | Add new agent to registry |
| PUT | `/api/agents/:id` | Update agent by ID |
| DELETE | `/api/agents/:id` | Delete agent by ID |
| PATCH | `/api/agents/:id/toggle` | Toggle agent enabled/disabled |
| GET | `/api/agents/:slug/handler` | Get agent's `services/handler.py` content |
| GET | `/api/agents/:slug/servers-config` | Get agent's `agent_servers.json` content |
| GET | `/api/agent-handlers` | List all agents that have handler.py files |

## MCP Server Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/mcp-servers` | List all MCP servers |
| POST | `/api/mcp-servers` | Add MCP server |
| PUT | `/api/mcp-servers/:id` | Update MCP server |
| DELETE | `/api/mcp-servers/:id` | Delete MCP server |

## Consumer Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/consumers` | List consumers |
| POST | `/api/consumers` | Add consumer |
| DELETE | `/api/consumers/:id` | Delete consumer |

## Sky Task Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/sky-tasks` | Get all sky fallout tasks |

## Import/Export

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/import-agent` | Import agent from ZIP upload (multipart) |

## Log Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/logs/:agentSlug` | Get agent log files |
| GET | `/api/logs/:agentSlug/:filename` | Get specific log file content |

## Data Paths

```
DATA_DIR = path.join(__dirname, 'src', 'config')
AGENTS_DIR = path.join(DATA_DIR, 'agents')
REGISTRY_PATH = path.join(DATA_DIR, 'common', 'agents.json')
MCP_SERVERS_PATH = path.join(DATA_DIR, 'common', 'mcp-servers.json')
```

## Adding a New Endpoint

```js
// In server.js — add before app.listen()
app.get('/api/my-data', (req, res) => {
  const filePath = path.join(DATA_DIR, 'common', 'my-data.json')
  if (!fs.existsSync(filePath)) return res.json([])
  res.json(JSON.parse(fs.readFileSync(filePath, 'utf-8')))
})

app.post('/api/my-data', (req, res) => {
  const filePath = path.join(DATA_DIR, 'common', 'my-data.json')
  fs.writeFileSync(filePath, JSON.stringify(req.body, null, 2))
  res.json({ ok: true })
})
```

## Access Logging

Every request is logged to `user_access.log`:
```
[dd-mm-yy hh:mm] METHOD /path — hostname (ip)
```

Middleware does DNS reverse lookup to resolve PC hostname.
Vite proxy forwards `X-Forwarded-For` header for real client IP.
