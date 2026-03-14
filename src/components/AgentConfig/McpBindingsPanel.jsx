import React, { useState } from 'react'
import { Server, Plus, Trash2, Wrench, X, ChevronDown } from 'lucide-react'
import { api } from '../../api'

const McpBindingsPanel = ({ agentId, bindings, mcpServers, onUpdate }) => {
  const [addOpen, setAddOpen] = useState(false)

  const serverMap = {}
  mcpServers.forEach(s => { serverMap[s.id] = s })

  const handleRemove = async (serverId) => {
    const updated = bindings.filter(b => b.serverId !== serverId)
    try {
      const record = await api.updateAgentMcpBindings(agentId, updated)
      onUpdate(record.mcpBindings)
    } catch (err) { console.error('Remove binding failed', err) }
  }

  const handleAdd = async (binding) => {
    const updated = [...bindings, binding]
    try {
      const record = await api.updateAgentMcpBindings(agentId, updated)
      onUpdate(record.mcpBindings)
    } catch (err) { console.error('Add binding failed', err) }
    setAddOpen(false)
  }

  const boundIds = new Set(bindings.map(b => b.serverId))
  const available = mcpServers.filter(s => !boundIds.has(s.id))

  return (
    <div className="mcpb-panel">
      <div className="mcpb-header">
        <div>
          <div className="mcpb-title">MCP Server Bindings</div>
          <div className="mcpb-desc">External MCP servers this agent consumes at runtime.</div>
        </div>
        {available.length > 0 && (
          <button className="btn-add-skill" onClick={() => setAddOpen(true)}>
            <Plus size={13} /> Bind Server
          </button>
        )}
      </div>

      {bindings.length === 0 ? (
        <div className="mcpb-empty">
          <Server size={24} strokeWidth={1.4} />
          <h4>No MCP Bindings</h4>
          <p>This agent does not consume any external MCP servers.</p>
          {available.length > 0 && (
            <button className="btn-add-skill" onClick={() => setAddOpen(true)}>
              <Plus size={13} /> Bind Server
            </button>
          )}
        </div>
      ) : (
        <div className="mcpb-list">
          {bindings.map(b => {
            const srv = serverMap[b.serverId]
            return (
              <div key={b.serverId} className="mcpb-item">
                <div className="mcpb-item-icon"><Server size={15} /></div>
                <div className="mcpb-item-info">
                  <div className="mcpb-item-name">
                    {srv ? srv.name : b.serverId}
                    <span className="mcpb-item-id">{b.serverId}</span>
                  </div>
                  {b.purpose && <div className="mcpb-item-purpose">{b.purpose}</div>}
                  <div className="mcpb-item-tools">
                    {(b.tools || []).map(t => (
                      <span key={t} className="mcp-tool-chip">{t}</span>
                    ))}
                  </div>
                </div>
                <button className="sk-action-btn sk-action-delete" title="Unbind" onClick={() => handleRemove(b.serverId)}>
                  <Trash2 size={14} />
                </button>
              </div>
            )
          })}
        </div>
      )}

      {addOpen && (
        <AddBindingDialog
          available={available}
          serverMap={serverMap}
          onAdd={handleAdd}
          onClose={() => setAddOpen(false)}
        />
      )}
    </div>
  )
}

const AddBindingDialog = ({ available, serverMap, onAdd, onClose }) => {
  const [selectedServer, setSelectedServer] = useState('')
  const [selectedTools, setSelectedTools] = useState([])
  const [purpose, setPurpose] = useState('')

  const srv = available.find(s => s.id === selectedServer)

  const toggleTool = (tool) => {
    setSelectedTools(prev =>
      prev.includes(tool) ? prev.filter(t => t !== tool) : [...prev, tool]
    )
  }

  const handleSubmit = () => {
    if (!selectedServer) return
    onAdd({
      serverId: selectedServer,
      tools: selectedTools.length > 0 ? selectedTools : (srv?.tools || []),
      purpose,
    })
  }

  return (
    <div className="dialog-overlay">
      <div className="dialog-container mcpb-dialog">
        <div className="dialog-header">
          <h2>Bind MCP Server</h2>
          <button className="dialog-close" onClick={onClose}><X size={18} /></button>
        </div>
        <div className="dialog-body">
          <div className="form-group" style={{ marginBottom: 16 }}>
            <label>Select Server <span className="required">*</span></label>
            <select
              className="sk-select"
              value={selectedServer}
              onChange={e => { setSelectedServer(e.target.value); setSelectedTools([]) }}
            >
              <option value="">Choose an MCP server...</option>
              {available.map(s => (
                <option key={s.id} value={s.id}>{s.name} ({s.id})</option>
              ))}
            </select>
          </div>

          {srv && (
            <>
              <div className="mcpb-srv-preview">
                <span className="mcp-detail-label">Description</span>
                <span className="mcp-detail-value">{srv.description}</span>
              </div>

              <div className="form-group" style={{ marginTop: 14, marginBottom: 14 }}>
                <label>Select Tools <span style={{ fontWeight: 400, color: '#94a3b8' }}>(click to toggle — all selected by default)</span></label>
                <div className="mcpb-tool-grid">
                  {(srv.tools || []).map(t => (
                    <button
                      key={t}
                      type="button"
                      className={`mcpb-tool-toggle ${selectedTools.includes(t) ? 'active' : ''} ${selectedTools.length === 0 ? 'default-active' : ''}`}
                      onClick={() => toggleTool(t)}
                    >
                      <Wrench size={11} /> {t}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          <div className="form-group">
            <label>Purpose <span style={{ fontWeight: 400, color: '#94a3b8' }}>(why does this agent need this server?)</span></label>
            <input
              type="text"
              value={purpose}
              onChange={e => setPurpose(e.target.value)}
              placeholder="e.g. Log storage and full-text search"
            />
          </div>
        </div>
        <div className="dialog-footer">
          <button className="btn btn-cancel" onClick={onClose}>Cancel</button>
          <button className="btn btn-save" onClick={handleSubmit} disabled={!selectedServer}>
            Bind Server
          </button>
        </div>
      </div>
    </div>
  )
}

export default McpBindingsPanel
