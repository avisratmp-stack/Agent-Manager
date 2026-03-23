const JSON_HEADERS = { 'Content-Type': 'application/json' }

async function request(url, options = {}) {
  const res = await fetch(url, options)
  if (!res.ok) {
    const body = await res.text()
    throw new Error(body || `HTTP ${res.status}`)
  }
  return res.json()
}

export const api = {
  getAgents: () => request('/api/agents'),
  getConsumers: () => request('/api/consumers'),

  createAgent: (data) =>
    request('/api/agents', { method: 'POST', headers: JSON_HEADERS, body: JSON.stringify(data) }),

  updateAgent: (id, data) =>
    request(`/api/agents/${id}`, { method: 'PUT', headers: JSON_HEADERS, body: JSON.stringify(data) }),

  deleteAgent: (id) =>
    request(`/api/agents/${id}`, { method: 'DELETE' }),

  createSkill: (slug, name, content) =>
    request(`/api/agents/${slug}/skills`, { method: 'POST', headers: JSON_HEADERS, body: JSON.stringify({ name, content }) }),

  updateSkill: (slug, skillName, content) =>
    request(`/api/agents/${slug}/skills/${skillName}`, { method: 'PUT', headers: JSON_HEADERS, body: JSON.stringify({ content }) }),

  deleteSkill: (slug, skillName) =>
    request(`/api/agents/${slug}/skills/${skillName}`, { method: 'DELETE' }),

  addReference: (slug, item) =>
    request(`/api/agents/${slug}/references`, { method: 'POST', headers: JSON_HEADERS, body: JSON.stringify(item) }),

  deleteReference: (slug, itemId) =>
    request(`/api/agents/${slug}/references/${itemId}`, { method: 'DELETE' }),

  getMcpServers: () => request('/api/mcp-servers'),

  createMcpServer: (data) =>
    request('/api/mcp-servers', { method: 'POST', headers: JSON_HEADERS, body: JSON.stringify(data) }),

  updateMcpServer: (id, data) =>
    request(`/api/mcp-servers/${id}`, { method: 'PUT', headers: JSON_HEADERS, body: JSON.stringify(data) }),

  deleteMcpServer: (id) =>
    request(`/api/mcp-servers/${id}`, { method: 'DELETE' }),

  updateAgentMcpBindings: (agentId, mcpBindings) =>
    request(`/api/agents/${agentId}/mcp-bindings`, { method: 'PUT', headers: JSON_HEADERS, body: JSON.stringify({ mcpBindings }) }),

  toggleAgentEnabled: (id, enabled) =>
    request(`/api/agents/${id}/enabled`, { method: 'PATCH', headers: JSON_HEADERS, body: JSON.stringify({ enabled }) }),

  toggleMcpEnabled: (id, enabled) =>
    request(`/api/mcp-servers/${id}/enabled`, { method: 'PATCH', headers: JSON_HEADERS, body: JSON.stringify({ enabled }) }),

  getAgentLogs: (slug) => request(`/api/agents/${slug}/logs`),

  importAgent: (file) => {
    const formData = new FormData()
    formData.append('file', file)
    return request('/api/agents/import', { method: 'POST', body: formData })
  },

  importAgentConfirm: (file, agentDef) => {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('agentDef', JSON.stringify(agentDef))
    return request('/api/agents/import-confirm', { method: 'POST', body: formData })
  },

  executeTrace: (agentSlug, action, params, stubMode) =>
    request('/api/test/execute', { method: 'POST', headers: JSON_HEADERS, body: JSON.stringify({ agentSlug, action, params, stubMode }) }),

  fetchAgentCard: (url) =>
    request('/api/test/agent-card', { method: 'POST', headers: JSON_HEADERS, body: JSON.stringify({ url }) }),

  invokeA2A: (agentUrl, skill, params, userMessage) =>
    request('/api/test/a2a-invoke', { method: 'POST', headers: JSON_HEADERS, body: JSON.stringify({ agentUrl, skill, params, userMessage }) }),

  exportRegistry: async () => {
    const res = await fetch('/api/registry/export')
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const blob = await res.blob()
    const disposition = res.headers.get('Content-Disposition') || ''
    const match = disposition.match(/filename="?([^"]+)"?/)
    const filename = match ? match[1] : 'agent-registry.json'
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
  },
}
