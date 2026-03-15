import React, { useState, useEffect, useCallback, useMemo } from 'react'
import {
  Plug, Plus, Pencil, Trash2, Search, X, ExternalLink,
  Tag, Wrench, Globe2, ChevronDown, ChevronUp
} from 'lucide-react'
import { api } from '../../api'

const TRANSPORT_COLORS = {
  stdio: { bg: '#ecfdf5', color: '#047857', border: '#a7f3d0' },
  sse:   { bg: '#eff6ff', color: '#1d4ed8', border: '#bfdbfe' },
}

const McpServersPanel = ({ mcpServers, onServersChange, addTrigger, onToggleMcp }) => {
  const [search, setSearch] = useState('')
  const [editServer, setEditServer] = useState(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [dialogMode, setDialogMode] = useState('create')
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [expandedId, setExpandedId] = useState(null)

  const filtered = useMemo(() => {
    if (!search) return mcpServers
    const q = search.toLowerCase()
    return mcpServers.filter(s =>
      s.name.toLowerCase().includes(q) ||
      s.id.toLowerCase().includes(q) ||
      (s.description || '').toLowerCase().includes(q) ||
      (s.tags || []).some(t => t.toLowerCase().includes(q))
    )
  }, [mcpServers, search])

  const handleCreate = () => {
    setEditServer(null)
    setDialogMode('create')
    setDialogOpen(true)
  }

  useEffect(() => {
    if (addTrigger > 0) handleCreate()
  }, [addTrigger])

  const handleEdit = (srv) => {
    setEditServer(srv)
    setDialogMode('edit')
    setDialogOpen(true)
  }

  const handleSave = async (formData) => {
    try {
      let updated
      if (dialogMode === 'create') {
        updated = await api.createMcpServer(formData)
      } else {
        updated = await api.updateMcpServer(editServer.id, formData)
      }
      onServersChange(updated)
    } catch (err) {
      console.error('MCP server save failed', err)
    }
    setDialogOpen(false)
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    try {
      const updated = await api.deleteMcpServer(deleteTarget.id)
      onServersChange(updated)
    } catch (err) {
      console.error('MCP server delete failed', err)
    }
    setDeleteTarget(null)
  }

  return (
    <div className="mcp-panel">
      <div className="mcp-panel-header">
        <div>
          <div className="mcp-panel-title">
            <Plug size={16} /> MCP Servers Registry
          </div>
          <div className="mcp-panel-desc">
            Central registry of available MCP servers. Agents bind to specific servers and tools.
          </div>
        </div>
        <button className="ac-btn ac-btn-create" onClick={handleCreate}>
          <Plus size={14} /> Add Server
        </button>
      </div>

      <div className="mcp-search-bar">
        <Search size={14} className="mcp-search-icon" />
        <input
          type="text"
          placeholder="Filter servers by name, tag..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        {search && (
          <button className="mcp-search-clear" onClick={() => setSearch('')}>
            <X size={14} />
          </button>
        )}
      </div>

      {filtered.length === 0 ? (
        <div className="mcp-empty">
          <Plug size={28} strokeWidth={1.4} />
          <h4>No MCP Servers</h4>
          <p>{search ? 'No servers match your filter.' : 'Add your first MCP server to the registry.'}</p>
          {!search && (
            <button className="ac-btn ac-btn-create" onClick={handleCreate}>
              <Plus size={14} /> Add Server
            </button>
          )}
        </div>
      ) : (
        <div className="mcp-server-list">
          {filtered.map(srv => {
            const tc = TRANSPORT_COLORS[srv.transport] || TRANSPORT_COLORS.stdio
            const isExpanded = expandedId === srv.id
            return (
              <div key={srv.id} className={`mcp-server-card ${isExpanded ? 'expanded' : ''}`}>
                <div className="mcp-server-row" onClick={() => setExpandedId(isExpanded ? null : srv.id)}>
                  <div className="mcp-server-icon">
                    <Plug size={16} />
                  </div>
                  <div className="mcp-server-info">
                    <div className="mcp-server-name">
                      {srv.name}
                      <span className="mcp-server-id">{srv.id}</span>
                    </div>
                    <div className="mcp-server-meta">
                      <span className="mcp-transport-badge" style={{ background: tc.bg, color: tc.color, borderColor: tc.border }}>
                        {srv.transport}
                      </span>
                      <span className="mcp-tool-count">
                        <Wrench size={11} /> {(srv.tools || []).length} tool{(srv.tools || []).length !== 1 ? 's' : ''}
                      </span>
                      {(srv.tools || []).slice(0, 5).map(t => {
                        const name = typeof t === 'string' ? t : t.name
                        return <span key={name} className="mcp-tool-chip-inline">{name}</span>
                      })}
                      {(srv.tools || []).length > 5 && (
                        <span className="mcp-tool-chip-inline mcp-tool-more">+{(srv.tools || []).length - 5}</span>
                      )}
                    </div>
                  </div>
                  <div className="mcp-server-actions">
                    <label className="live-toggle" onClick={e => e.stopPropagation()} title={srv.enabled !== false ? 'Live' : 'Disabled'}>
                      <input
                        type="checkbox"
                        checked={srv.enabled !== false}
                        onChange={() => onToggleMcp && onToggleMcp(srv.id, srv.enabled !== false)}
                      />
                      <span className="live-toggle-track" />
                    </label>
                    <button className="sk-action-btn" title="Edit" onClick={e => { e.stopPropagation(); handleEdit(srv) }}>
                      <Pencil size={14} />
                    </button>
                    <button className="sk-action-btn sk-action-delete" title="Delete" onClick={e => { e.stopPropagation(); setDeleteTarget(srv) }}>
                      <Trash2 size={14} />
                    </button>
                    {isExpanded ? <ChevronUp size={14} className="mcp-chevron" /> : <ChevronDown size={14} className="mcp-chevron" />}
                  </div>
                </div>

                {isExpanded && (
                  <div className="mcp-server-details">
                    <div className="mcp-detail-row">
                      <span className="mcp-detail-label">URL</span>
                      <span className="mcp-detail-value mcp-mono">{srv.url}</span>
                    </div>
                    <div className="mcp-detail-row">
                      <span className="mcp-detail-label">Description</span>
                      <span className="mcp-detail-value">{srv.description || '—'}</span>
                    </div>
                    <div className="mcp-detail-row">
                      <span className="mcp-detail-label">Available Tools</span>
                      <span className="mcp-detail-value">
                        <div className="mcp-tools-list">
                          {(srv.tools || []).map(t => (
                            <span key={t} className="mcp-tool-chip">{t}</span>
                          ))}
                        </div>
                      </span>
                    </div>
                    {(srv.tags || []).length > 0 && (
                      <div className="mcp-detail-row">
                        <span className="mcp-detail-label">Tags</span>
                        <span className="mcp-detail-value">
                          {srv.tags.map(t => (
                            <span key={t} className="mcp-tag">{t}</span>
                          ))}
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Create / Edit Dialog */}
      {dialogOpen && (
        <McpServerDialog
          mode={dialogMode}
          server={editServer}
          onSave={handleSave}
          onClose={() => setDialogOpen(false)}
        />
      )}

      {/* Delete Confirmation */}
      {deleteTarget && (
        <div className="dialog-overlay">
          <div className="ac-confirm-dialog">
            <h3>Delete MCP Server</h3>
            <p>Remove <strong>"{deleteTarget.name}"</strong> from the registry? Existing agent bindings to this server will become orphaned.</p>
            <div className="ac-confirm-actions">
              <button className="btn btn-cancel" onClick={() => setDeleteTarget(null)}>Cancel</button>
              <button className="btn btn-delete-confirm" onClick={handleDelete}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

const McpServerDialog = ({ mode, server, onSave, onClose }) => {
  const toolsToStr = (tools) => (tools || []).map(t => typeof t === 'string' ? t : t.name || '').filter(Boolean).join(', ')

  const [form, setForm] = useState({
    id: server?.id || '',
    name: server?.name || '',
    description: server?.description || '',
    url: server?.url || '',
    transport: server?.transport || 'stdio',
    type: server?.type || 'external',
    role: server?.role || 'public',
    stage: server?.stage || 'Design',
    environment: server?.environment || 'AOC',
    tools: toolsToStr(server?.tools),
    tags: (server?.tags || []).join(', '),
  })

  const set = (key, val) => setForm(prev => ({ ...prev, [key]: val }))

  const handleSubmit = () => {
    const toolNames = form.tools.split(',').map(s => s.trim()).filter(Boolean)
    const origTools = server?.tools || []
    const tools = toolNames.map(name => {
      const existing = origTools.find(t => (typeof t === 'string' ? t : t.name) === name)
      if (existing && typeof existing === 'object') return existing
      return typeof origTools[0] === 'object' ? { name, description: `Tool: ${name}` } : name
    })
    const data = {
      ...form,
      tools,
      tags: form.tags.split(',').map(s => s.trim()).filter(Boolean),
    }
    onSave(data)
  }

  return (
    <div className="dialog-overlay">
      <div className="dialog-container mcp-dialog">
        <div className="dialog-header">
          <h2>{mode === 'create' ? 'Add MCP Server' : 'Edit MCP Server'}</h2>
          <button className="dialog-close" onClick={onClose}><X size={18} /></button>
        </div>
        <div className="dialog-body">
          <div className="form-grid">
            <div className="form-group">
              <label>Server ID <span className="required">*</span></label>
              <input
                type="text"
                value={form.id}
                onChange={e => set('id', e.target.value)}
                placeholder="e.g. elasticsearch"
                disabled={mode === 'edit'}
              />
            </div>
            <div className="form-group">
              <label>Name <span className="required">*</span></label>
              <input
                type="text"
                value={form.name}
                onChange={e => set('name', e.target.value)}
                placeholder="e.g. Elasticsearch"
              />
            </div>
            <div className="form-group full-width">
              <label>Description</label>
              <textarea
                rows={2}
                value={form.description}
                onChange={e => set('description', e.target.value)}
                placeholder="What this MCP server does"
              />
            </div>
            <div className="form-group">
              <label>Origin</label>
              <div className="mcp-transport-selector">
                {['local', 'external'].map(t => (
                  <button
                    key={t}
                    type="button"
                    className={`mcp-transport-opt ${form.type === t ? 'active' : ''}`}
                    onClick={() => set('type', t)}
                  >
                    {t === 'local' ? 'Local' : 'External'}
                  </button>
                ))}
              </div>
            </div>
            <div className="form-group">
              <label>Role</label>
              <div className="mcp-transport-selector">
                {['public', 'private'].map(t => (
                  <button
                    key={t}
                    type="button"
                    className={`mcp-transport-opt ${form.role === t ? 'active' : ''}`}
                    onClick={() => set('role', t)}
                  >
                    {t === 'public' ? 'Public' : 'Private'}
                  </button>
                ))}
              </div>
            </div>
            <div className="form-group">
              <label>Stage</label>
              <select value={form.stage} onChange={e => set('stage', e.target.value)} className="mcp-stage-select">
                <option value="Draft">Draft</option>
                <option value="Design">Design</option>
                <option value="Dev">Dev</option>
                <option value="Released">Released</option>
              </select>
            </div>
            {form.type === 'external' && (
              <>
                <div className="form-group">
                  <label>URL</label>
                  <input
                    type="text"
                    value={form.url}
                    onChange={e => set('url', e.target.value)}
                    placeholder="mcp://host:port"
                  />
                </div>
                <div className="form-group">
                  <label>Transport</label>
                  <div className="mcp-transport-selector">
                    {['stdio', 'sse'].map(t => (
                      <button
                        key={t}
                        type="button"
                        className={`mcp-transport-opt ${form.transport === t ? 'active' : ''}`}
                        onClick={() => set('transport', t)}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}
            <div className="form-group full-width">
              <label>Tools <span style={{ fontWeight: 400, color: '#94a3b8' }}>(comma-separated)</span></label>
              <textarea
                rows={2}
                value={form.tools}
                onChange={e => set('tools', e.target.value)}
                placeholder="search, index, aggregate"
                spellCheck={false}
              />
            </div>
            <div className="form-group full-width">
              <label>Tags <span style={{ fontWeight: 400, color: '#94a3b8' }}>(comma-separated)</span></label>
              <input
                type="text"
                value={form.tags}
                onChange={e => set('tags', e.target.value)}
                placeholder="logs, search, analytics"
              />
            </div>
          </div>
        </div>
        <div className="dialog-footer">
          <button className="btn btn-cancel" onClick={onClose}>Cancel</button>
          <button className="btn btn-save" onClick={handleSubmit} disabled={!form.id || !form.name}>
            {mode === 'create' ? 'Add Server' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  )
}

export { McpServerDialog }
export default McpServersPanel
