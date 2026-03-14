import React, { useState, useMemo } from 'react'
import { Cpu, Plug, Eye, Globe, HardDrive, Zap, Shield, ShieldOff, ChevronRight, Search, ExternalLink, Layers, Link2 } from 'lucide-react'

const STAGE_COLORS = {
  Released: { bg: '#dcfce7', text: '#15803d', border: '#86efac' },
  Dev:      { bg: '#dbeafe', text: '#1d4ed8', border: '#93c5fd' },
  Design:   { bg: '#fef3c7', text: '#92400e', border: '#fcd34d' },
}

const AgentCardsPanel = ({ items, onSelect, onPreview, selectedId, previewId, onToggleAgent, onToggleMcp, selectedMcpId, onSelectMcp, onEditMcp }) => {
  const [hoveredId, setHoveredId] = useState(null)

  const agents = useMemo(() => items.filter(r => r._kind === 'agent'), [items])
  const mcps = useMemo(() => items.filter(r => r._kind === 'mcp'), [items])

  const renderCard = (row) => {
    const isAgent = row._kind === 'agent'
    const itemId = isAgent ? row.raw.id : row.raw.id
    const isPrivate = row._role === 'sub-agent' || row._role === 'private'
    const isSelected = isAgent ? selectedId === row.raw.id : selectedMcpId === row.raw.id
    const isPreviewing = isAgent && previewId === row.raw.id
    const isHovered = hoveredId === row._uid
    const stage = row._stage || 'Design'
    const stageColor = STAGE_COLORS[stage] || STAGE_COLORS.Design
    const mcpCount = isAgent ? (row.raw.mcpBindings || []).length : 0
    const toolCount = isAgent
      ? (row.raw.agent?.tools || []).length
      : (row.raw.tools || []).length
    const tags = row._tags || []

    return (
      <div
        key={row._uid}
        className={`cards-item ${isAgent ? 'cards-agent' : 'cards-mcp'} ${isSelected ? 'selected' : ''} ${isPreviewing ? 'previewing' : ''} ${isPrivate ? 'private' : ''}`}
        onMouseEnter={() => setHoveredId(row._uid)}
        onMouseLeave={() => setHoveredId(null)}
        onClick={() => {
          if (isAgent) onSelect?.(row.raw.id)
          else onSelectMcp?.(row.raw.id)
        }}
        onDoubleClick={() => {
          if (!isAgent) onEditMcp?.(row.raw)
        }}
      >
        <div className="cards-item-top">
          <div className={`cards-item-icon ${isAgent ? 'agent' : 'mcp'}`}>
            {isAgent ? <Cpu size={16} /> : <Plug size={16} />}
          </div>
          <div className="cards-item-meta">
            <span className="cards-item-origin" style={{ background: row._type === 'local' ? '#f0fdf4' : '#fff7ed', color: row._type === 'local' ? '#15803d' : '#c2410c', borderColor: row._type === 'local' ? '#bbf7d0' : '#fed7aa' }}>
              {row._type === 'local' ? <HardDrive size={10} /> : <Globe size={10} />}
              {row._type === 'local' ? 'Local' : 'External'}
            </span>
            <span className="cards-item-stage" style={{ background: stageColor.bg, color: stageColor.text, borderColor: stageColor.border }}>
              {stage}
            </span>
          </div>
          <div className="cards-item-toggle" onClick={e => e.stopPropagation()}>
            <label className="live-toggle">
              <input
                type="checkbox"
                checked={row._enabled}
                onChange={() => {
                  if (isAgent) onToggleAgent?.(row.raw.id, row._enabled)
                  else onToggleMcp?.(row.raw.id, row._enabled)
                }}
              />
              <span className="live-toggle-track" />
            </label>
          </div>
        </div>

        <div className="cards-item-body">
          <h3 className="cards-item-name">{row._name}</h3>
          <p className="cards-item-desc">{row._desc || 'No description'}</p>
        </div>

        <div className="cards-item-stats">
          {isAgent && mcpCount > 0 && (
            <span className="cards-stat" title={`${mcpCount} MCP binding(s)`}>
              <Link2 size={12} /> {mcpCount}
            </span>
          )}
          {toolCount > 0 && (
            <span className="cards-stat" title={`${toolCount} tool(s)`}>
              <Zap size={12} /> {toolCount}
            </span>
          )}
          <span className={`cards-stat cards-visibility ${isPrivate ? 'private' : 'public'}`} title={isPrivate ? 'Private' : 'Public'}>
            {isPrivate ? <ShieldOff size={12} /> : <Shield size={12} />}
            {isPrivate ? 'Private' : 'Public'}
          </span>
        </div>

        {tags.length > 0 && (
          <div className="cards-item-tags">
            {tags.slice(0, 4).map(t => (
              <span key={t} className="cards-tag">{t}</span>
            ))}
            {tags.length > 4 && <span className="cards-tag cards-tag-more">+{tags.length - 4}</span>}
          </div>
        )}

        {isAgent && (
          <div className={`cards-item-actions ${isHovered ? 'visible' : ''}`}>
            <button
              className={`cards-action-btn ${isPreviewing ? 'active' : ''}`}
              title="Preview details"
              onClick={e => { e.stopPropagation(); onPreview?.(row.raw.id) }}
            >
              <Eye size={14} /> Details
            </button>
          </div>
        )}

        <div className={`cards-item-glow ${isAgent ? 'agent' : 'mcp'}`} />
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div className="cards-empty">
        <Layers size={40} strokeWidth={1} />
        <p>No agents or MCPs found</p>
      </div>
    )
  }

  return (
    <div className="cards-panel">
      {agents.length > 0 && (
        <div className="cards-section">
          <div className="cards-section-header">
            <Cpu size={15} />
            <span>Agents</span>
            <span className="cards-section-count">{agents.length}</span>
          </div>
          <div className="cards-grid">
            {agents.map(renderCard)}
          </div>
        </div>
      )}
      {mcps.length > 0 && (
        <div className="cards-section">
          <div className="cards-section-header">
            <Plug size={15} />
            <span>Local MCPs</span>
            <span className="cards-section-count">{mcps.length}</span>
          </div>
          <div className="cards-grid">
            {mcps.map(renderCard)}
          </div>
        </div>
      )}
    </div>
  )
}

export default AgentCardsPanel
