# Agent Component Model — Architecture Review

**Reviewer**: Avi Harel-Yisraelian, SW R&D Manager  
**Date**: March 2026  
**Scope**: AOC/Sky agent definition model vs. [agentskills.io](https://agentskills.io/specification) specification  

---

## 1. Current Agent Data Model

Each agent record in `agents.json` contains:

| Field | Type | Purpose |
|-------|------|---------|
| `id` | number | Unique numeric identifier |
| `type` | `local` \| `external` | Whether agent is managed locally or referenced remotely |
| `role` | `public` \| `sub-agent` | Visibility — public agents are top-level; sub-agents are called by others |
| `stage` | string | Lifecycle stage (Draft → Design → Dev → Released) |
| `environment` | string | Product environment (AOC, Sky) |
| `slug` | string | Filesystem directory name for local agents |
| `calls` | string[] | Sub-agent references this agent invokes |
| `mcpBindings` | object[] | MCP servers this agent connects to, with tool subset |
| `enabled` | boolean | Live/disabled toggle |
| `tags` | string[] | Categorical labels for filtering |
| `agent.name` | string | Display name |
| `agent.description` | string | What the agent does |
| `agent.url` | string | Agent endpoint URL |
| `agent.version` | string | Semantic version |
| `agent.capabilities` | object | `streaming`, `async_execution` flags |
| `agent.tools` | object[] | Tools the agent exposes (`id`, `name`, `description`, `tags`) |
| `agent.handler.class` | string | Python handler class path |
| `agent.handler.args` | object | `agent_executor`, `task_store` |

### Skills (Local Agents)

Each local agent has a folder under `src/data/agents/{slug}/skills/` containing `SKILL.md` files.

### MCP Bindings

Each binding specifies an MCP server ID and a subset of its tools the agent is authorized to use.

---

## 2. Alignment with agentskills.io Specification

### What We Do Well

| Area | Status | Notes |
|------|--------|-------|
| SKILL.md per agent | ✅ Aligned | Each local agent has a `SKILL.md` with YAML frontmatter |
| Description field | ✅ Aligned | Rich descriptions explaining what and when |
| Tags/metadata | ✅ Aligned | Tags provide discovery and filtering |
| Directory structure | ✅ Aligned | `agents/{slug}/skills/primary-skill/SKILL.md` |
| Tool definitions | ✅ Aligned | `id`, `name`, `description`, `tags` per tool |

### Gaps & Recommendations

| # | Gap | agentskills.io Spec | Current State | Recommendation | Priority |
|---|-----|---------------------|---------------|----------------|----------|
| 1 | **Skill `name` must be lowercase-hyphenated** | `name` field: lowercase, hyphens only, 1-64 chars, must match directory name | Our SKILL.md `name` fields use mixed-case with spaces (e.g. "Analyze Issue - Agent") | Rename SKILL.md `name` fields to match slug format (e.g. `analyze-issue-agent`). Keep a `display_name` in metadata for UI. | **High** |
| 2 | **Missing `description` in frontmatter as trigger text** | Description should include keywords for when to activate the skill | Our descriptions are generic. They don't tell the agent *when* to use the skill. | Add trigger keywords: "Use when handling fallout tickets", "Use when order field updates are needed" | **High** |
| 3 | **No `license` field** | Optional but recommended | Missing | Add `license: Proprietary` to enterprise skills | Low |
| 4 | **No `compatibility` field** | Indicates runtime requirements | Missing | Add for agents with specific requirements (e.g. Python runtime, K8s access) | Medium |
| 5 | **No `allowed-tools` field** | Pre-approves tools the skill may use | Missing | Map from `mcpBindings` tools — e.g. `allowed-tools: get-order update-order` | Medium |
| 6 | **No `references/` or `scripts/` directories** | Spec recommends progressive disclosure | Only `SKILL.md` exists per skill | Add `references/` for runbooks, `scripts/` for remediation scripts | Medium |
| 7 | **Tool `inputSchema` missing** | Industry standard (OpenAI, Anthropic function calling) requires JSON Schema for tool parameters | Tools only have `id`, `name`, `description`, `tags` | Add `inputSchema` (JSON Schema) per tool to enable proper function calling | **High** |
| 8 | **No `outputSchema`** | Best practice for typed agent-to-agent communication | Not present | Add optional `outputSchema` for tools that return structured data | Medium |
| 9 | **mcpBinding key inconsistency** | — | Some bindings use `serverId`, others use `mcpId` | Standardize to `mcpId` across all bindings | **High** |
| 10 | **No agent `authentication` field** | A2A protocol and production agents need auth | Not present | Add optional `auth` block: `{ type: 'bearer' \| 'api-key' \| 'oauth', config: {} }` | Medium |
| 11 | **No `timeout` / `retry` policy** | Production agents need SLA and retry configuration | Not present | Add `timeout_ms` and `retry: { max_attempts, backoff }` per agent | Medium |
| 12 | **Skills body too short** | Spec recommends step-by-step instructions, edge cases, examples | Current SKILL.md bodies are 3-4 lines | Expand with: step-by-step instructions, input/output examples, edge cases, failure modes | **High** |

---

## 3. Agent-to-Agent Communication Model

### Current: `calls` Array
Agents reference sub-agents by slug string in a flat `calls` array. This is simple but lacks:
- **Invocation context** — why is the sub-agent called?
- **Data contract** — what data flows between them?
- **Conditional routing** — when should the call happen?

### Recommendation
Evolve `calls` to structured objects:

```json
"calls": [
  {
    "agentId": "default-observer-agent",
    "trigger": "on_completion",
    "purpose": "Log execution outcome for observability",
    "dataContract": { "input": "execution_result", "output": "ack" }
  }
]
```

---

## 4. MCP Bindings Model

### Current State
Two inconsistent formats exist:

```json
// Format A (newer agents)
{ "mcpId": "ces-mcp-ordering", "tools": ["get-order", "update-order"] }

// Format B (older agents)
{ "serverId": "elasticsearch", "tools": ["search"], "purpose": "Log search" }

// Format C (string reference)
"aoc-log-aggregator"
```

### Recommendation
Standardize to a single format with `purpose`:

```json
{
  "mcpId": "ces-mcp-ordering",
  "tools": ["get-order", "update-order"],
  "purpose": "Order lifecycle management",
  "permission": "read-write"
}
```

---

## 5. Tool Definition Model

### Current
```json
{ "id": "classify-issue", "name": "Classify Issue", "description": "...", "tags": ["classification"] }
```

### Recommended (aligned with OpenAI / Anthropic function calling)
```json
{
  "id": "classify-issue",
  "name": "Classify Issue",
  "description": "Classifies fallout ticket by type, root cause and confidence",
  "tags": ["classification", "ai"],
  "inputSchema": {
    "type": "object",
    "properties": {
      "ticket_id": { "type": "string", "description": "The fallout ticket ID" },
      "include_stack_trace": { "type": "boolean", "default": true }
    },
    "required": ["ticket_id"]
  },
  "outputSchema": {
    "type": "object",
    "properties": {
      "issue_type": { "type": "string" },
      "root_cause": { "type": "string" },
      "confidence": { "type": "number", "minimum": 0, "maximum": 1 }
    }
  }
}
```

---

## 6. SKILL.md Compliance Checklist

| Check | Required | Status |
|-------|----------|--------|
| `name` lowercase-hyphenated, matches directory | Yes | ❌ Needs fix |
| `name` 1-64 chars, no consecutive hyphens | Yes | ❌ Needs fix |
| `description` non-empty, includes trigger keywords | Yes | ⚠️ Partial |
| `description` ≤ 1024 chars | Yes | ✅ OK |
| Body under 500 lines | Recommended | ✅ OK (too short though) |
| `references/` for detailed docs | Recommended | ❌ Missing |
| `scripts/` for executable code | Recommended | ❌ Missing |

---

## 7. Summary of Actions

| Priority | Action | Effort |
|----------|--------|--------|
| **High** | Fix SKILL.md `name` fields to lowercase-hyphenated format | Small |
| **High** | Add trigger keywords to SKILL.md descriptions | Small |
| **High** | Add `inputSchema` to tool definitions | Medium |
| **High** | Standardize mcpBinding key to `mcpId` everywhere | Small |
| **High** | Enrich SKILL.md body with instructions, examples, edge cases | Medium |
| Medium | Add `compatibility`, `license` to SKILL.md frontmatter | Small |
| Medium | Add `allowed-tools` to SKILL.md from mcpBindings | Small |
| Medium | Add `references/` and `scripts/` directories | Medium |
| Medium | Add `auth`, `timeout`, `retry` fields to agent model | Medium |
| Medium | Evolve `calls` to structured sub-agent invocations | Medium |
| Low | Add `outputSchema` to tools | Small |

---

*This review is based on the [agentskills.io specification](https://agentskills.io/specification) and industry patterns from OpenAI function calling, Anthropic tool use, and A2A protocol standards.*
