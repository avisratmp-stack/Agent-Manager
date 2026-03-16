import React, { useMemo, useState, useCallback } from 'react'
import { Monitor, Bot, Plug, Plus, Link2 } from 'lucide-react'

const NODE_W = 190
const NODE_H = 52
const COL_GAP = 140
const ROW_GAP = 18
const SECTION_GAP = 36
const PAD_X = 40
const PAD_Y = 40

function slugify(name) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
}

const AgentMapPanel = ({ agents, consumers, mcpServers, onAddAgent, onToggleAgent, onToggleMcp, onAgentDblClick }) => {
  const [hoveredId, setHoveredId] = useState(null)
  const [lockedId, setLockedId] = useState(null)
  const [showEdges, setShowEdges] = useState(true)

  const handleNodeClick = useCallback((nodeId, isAdd) => {
    if (isAdd) return
    setLockedId(prev => prev === nodeId ? null : nodeId)
  }, [])

  const activeId = lockedId || hoveredId

  const graph = useMemo(() => {
    const agentBySlug = {}
    agents.forEach(a => {
      const slug = a.slug || slugify(a.agent.name)
      agentBySlug[slug] = a
    })

    const agentSlugs = agents.map(a => a.slug || slugify(a.agent.name))
    const publicSlugs = agentSlugs.filter(s => agentBySlug[s] && agentBySlug[s].role !== 'sub-agent')
    const privateSlugs = agentSlugs.filter(s => agentBySlug[s] && agentBySlug[s].role === 'sub-agent')

    const localMcpList = (mcpServers || []).filter(s => s.type === 'local')
    const externalMcpList = (mcpServers || []).filter(s => s.type !== 'local')

    const boundServerIds = new Set()
    agents.forEach(a => (a.mcpBindings || []).forEach(b => {
      const sid = typeof b === 'string' ? b : b.serverId
      if (sid) boundServerIds.add(sid)
    }))
    const boundLocalMcp = localMcpList.filter(s => boundServerIds.has(s.id))
    const boundExternalMcp = externalMcpList.filter(s => boundServerIds.has(s.id))

    // Layout:
    // Col 0: Consumer
    // Col 1-2: Public agents (split) + local MCPs appended below with a gap
    // Col 3: Private agents (lighter)
    // Col 4: External MCPs (lighter)
    const pubHalf = Math.ceil(publicSlugs.length / 2)
    const pubCol1Slugs = publicSlugs.slice(0, pubHalf)
    const pubCol2Slugs = publicSlugs.slice(pubHalf)

    const localMcpHalf = Math.ceil(boundLocalMcp.length / 2)
    const localMcpCol1 = boundLocalMcp.slice(0, localMcpHalf)
    const localMcpCol2 = boundLocalMcp.slice(localMcpHalf)

    const allNodes = []
    allNodes.push({ id: '__consumer__', label: 'Consumer', kind: 'consumer', col: 0, row: 0 })

    pubCol1Slugs.forEach((slug, i) => {
      const a = agentBySlug[slug]
      if (!a) return
      allNodes.push({ id: `agent-${a.id}`, slug, label: a.agent.name, kind: a.type, col: 1, row: i, agentId: a.id, enabled: a.enabled !== false, role: a.role })
    })
    pubCol2Slugs.forEach((slug, i) => {
      const a = agentBySlug[slug]
      if (!a) return
      allNodes.push({ id: `agent-${a.id}`, slug, label: a.agent.name, kind: a.type, col: 2, row: i, agentId: a.id, enabled: a.enabled !== false, role: a.role })
    })

    const col1McpStartRow = pubCol1Slugs.length + 1
    localMcpCol1.forEach((s, i) => {
      const isPublic = s.role !== 'private'
      allNodes.push({ id: `mcp-${s.id}`, mcpId: s.id, label: s.name, kind: 'mcp-local', col: 1, row: col1McpStartRow + i, enabled: s.enabled !== false, isPublic, _sectionGap: i === 0 })
    })
    const col2McpStartRow = pubCol2Slugs.length + 1
    localMcpCol2.forEach((s, i) => {
      const isPublic = s.role !== 'private'
      allNodes.push({ id: `mcp-${s.id}`, mcpId: s.id, label: s.name, kind: 'mcp-local', col: 2, row: col2McpStartRow + i, enabled: s.enabled !== false, isPublic, _sectionGap: i === 0 })
    })

    allNodes.push({ id: '__add_agent__', label: 'Add Agent', kind: 'add', col: 1, row: col1McpStartRow + localMcpCol1.length })

    let nextCol = 3
    const privateCol = nextCol
    if (privateSlugs.length > 0) {
      privateSlugs.forEach((slug, i) => {
        const a = agentBySlug[slug]
        if (!a) return
        allNodes.push({ id: `agent-${a.id}`, slug, label: a.agent.name, kind: 'private', col: privateCol, row: i, agentId: a.id, enabled: a.enabled !== false, role: a.role })
      })
      nextCol++
    }

    const extMcpCol = nextCol
    if (boundExternalMcp.length > 0) {
      boundExternalMcp.forEach((s, i) => {
        allNodes.push({ id: `mcp-${s.id}`, mcpId: s.id, label: s.name, kind: 'mcp-ext', col: extMcpCol, row: i, enabled: s.enabled !== false })
      })
      nextCol++
    }

    // Edges
    const edges = []
    const agentNodes = allNodes.filter(n => n.slug)

    // Consumer -> public agents only (solid direct call). Never to private.
    agentNodes.forEach(n => {
      if (n.kind !== 'private') {
        edges.push({ from: '__consumer__', to: n.id, type: 'consumer-agent' })
      }
    })

    // Consumer -> public local MCPs only (solid direct call)
    allNodes.forEach(n => {
      if (n.kind === 'mcp-local' && n.isPublic) {
        edges.push({ from: '__consumer__', to: n.id, type: 'consumer-mcp' })
      }
    })

    // Agent -> Agent calls
    agents.forEach(a => {
      const srcSlug = a.slug || slugify(a.agent.name)
      const src = agentNodes.find(n => n.slug === srcSlug)
      if (!src) return
      ;(a.calls || []).forEach(targetSlug => {
        const target = agentNodes.find(n => n.slug === targetSlug)
        if (target) edges.push({ from: src.id, to: target.id, type: 'agent-agent' })
      })
      // Agent -> MCP (mcp-binding style, dashed amber)
      ;(a.mcpBindings || []).forEach(b => {
        const sid = typeof b === 'string' ? b : b.serverId
        const target = allNodes.find(n => n.mcpId === sid)
        if (target) edges.push({ from: src.id, to: target.id, type: 'agent-mcp' })
      })
    })

    // Positioning
    const totalCols = nextCol
    const colCounts = new Array(totalCols).fill(0)
    allNodes.forEach(n => { colCounts[n.col] = Math.max(colCounts[n.col], n.row + 1) })
    const maxRows = Math.max(...colCounts, 1)

    const nodePositions = {}
    allNodes.forEach(n => {
      let y = PAD_Y + n.row * (NODE_H + ROW_GAP)
      if (n._sectionGap) y += SECTION_GAP
      if (n.kind === 'mcp-local' && !n._sectionGap) {
        const firstMcpInCol = allNodes.find(nn => nn.col === n.col && nn._sectionGap)
        if (firstMcpInCol) y += SECTION_GAP
      }
      if (n.kind === 'add') {
        const firstMcpInCol = allNodes.find(nn => nn.col === n.col && nn._sectionGap)
        if (firstMcpInCol) y += SECTION_GAP
      }
      nodePositions[n.id] = { x: PAD_X + n.col * (NODE_W + COL_GAP), y, col: n.col }
    })

    const svgW = PAD_X * 2 + totalCols * NODE_W + (totalCols - 1) * COL_GAP
    const allY = Object.values(nodePositions).map(p => p.y + NODE_H)
    const svgH = Math.max(...allY, 200) + PAD_Y

    const colLabels = {}
    colLabels[0] = 'CONSUMERS'
    colLabels[1] = 'AGENTS & LOCAL MCP'
    colLabels[2] = 'AGENTS & LOCAL MCP'
    if (privateSlugs.length > 0) colLabels[privateCol] = 'PRIVATE AGENTS'
    if (boundExternalMcp.length > 0) colLabels[extMcpCol] = 'EXTERNAL MCP'

    return { allNodes, edges, nodePositions, svgW, svgH, totalCols, colLabels, hasPrivate: privateSlugs.length > 0 }
  }, [agents, consumers, mcpServers])

  const { allNodes, edges, nodePositions, svgW, svgH, colLabels, hasPrivate } = graph

  const { highlightNodes, highlightEdges } = useMemo(() => {
    if (!activeId) return { highlightNodes: new Set(), highlightEdges: new Set() }
    const nodes = new Set([activeId])
    const edgeIdxs = new Set()
    edges.forEach((e, i) => {
      if (e.from === activeId || e.to === activeId) {
        nodes.add(e.from)
        nodes.add(e.to)
        edgeIdxs.add(i)
      }
    })
    return { highlightNodes: nodes, highlightEdges: edgeIdxs }
  }, [activeId, edges])

  // Private agents & external MCPs get lighter/faded colors
  const kindColor    = { consumer: '#6366f1', local: '#059669', external: '#2563eb', private: '#94a3b8', mcp: '#d97706', 'mcp-local': '#d97706', 'mcp-ext': '#ca8a04', add: '#6d28d9' }
  const kindBg       = { consumer: '#f5f3ff', local: '#ecfdf5', external: '#eff6ff', private: '#f8fafc', mcp: '#fffbeb', 'mcp-local': '#fffbeb', 'mcp-ext': '#fefce8', add: '#faf5ff' }
  const kindBorder   = { consumer: '#c4b5fd', local: '#a7f3d0', external: '#bfdbfe', private: '#e2e8f0', mcp: '#fde68a', 'mcp-local': '#fde68a', 'mcp-ext': '#fef08a', add: '#d8b4fe' }
  const KindIcon     = { consumer: Monitor, local: Bot, external: Bot, private: Bot, mcp: Plug, 'mcp-local': Plug, 'mcp-ext': Plug, add: Plus }

  function edgePath(from, to) {
    const sameCol = from.col === to.col
    if (sameCol) {
      const x1 = from.x + NODE_W
      const y1 = from.y + NODE_H / 2
      const x2 = to.x + NODE_W
      const y2 = to.y + NODE_H / 2
      const bulge = 50
      return `M${x1},${y1} C${x1 + bulge},${y1} ${x2 + bulge},${y2} ${x2},${y2}`
    }
    const x1 = from.x + NODE_W
    const y1 = from.y + NODE_H / 2
    const x2 = to.x
    const y2 = to.y + NODE_H / 2
    const cx1 = x1 + (x2 - x1) * 0.4
    const cx2 = x2 - (x2 - x1) * 0.4
    return `M${x1},${y1} C${cx1},${y1} ${cx2},${y2} ${x2},${y2}`
  }

  return (
    <div className="map-panel">
      <div className="map-legend">
        {[
          { kind: 'consumer', label: 'Consumer' },
          { kind: 'local', label: 'Local Agent' },
          { kind: 'external', label: 'External Agent' },
          ...(hasPrivate ? [{ kind: 'private', label: 'Private Agent' }] : []),
          { kind: 'mcp-local', label: 'Local MCP' },
          { kind: 'mcp-ext', label: 'External MCP' },
        ].map(l => (
          <span key={l.kind} className="map-legend-item">
            <span className="map-legend-dot" style={{ background: kindColor[l.kind] }} />
            {l.label}
          </span>
        ))}
        <span className="map-legend-item map-legend-sep">
          <svg width="32" height="10" style={{ display: 'block' }}>
            <line x1="0" y1="5" x2="28" y2="5" stroke="#94a3b8" strokeWidth="1.5" markerEnd="url(#arrowLeg)" />
          </svg>
          <span>Direct call</span>
        </span>
        <span className="map-legend-item">
          <svg width="32" height="10" style={{ display: 'block' }}>
            <line x1="0" y1="5" x2="28" y2="5" stroke="#94a3b8" strokeWidth="1.5" strokeDasharray="5,3" markerEnd="url(#arrowLeg)" />
          </svg>
          <span>Agent-to-agent</span>
        </span>
        <span className="map-legend-item">
          <svg width="32" height="10" style={{ display: 'block' }}>
            <line x1="0" y1="5" x2="28" y2="5" stroke="#d97706" strokeWidth="1.5" strokeDasharray="2,3" markerEnd="url(#arrowMcp)" />
          </svg>
          <span>MCP binding</span>
        </span>

        <button
          className={`map-edge-toggle ${showEdges ? 'active' : ''}`}
          onClick={() => setShowEdges(v => !v)}
          title={showEdges ? 'Hide connections' : 'Show connections'}
        >
          <Link2 size={13} />
          <span>{showEdges ? 'Hide' : 'Show'} connections</span>
        </button>
        {lockedId && (
          <button className="map-edge-toggle" onClick={() => setLockedId(null)} title="Clear selection">
            <span>Clear selection</span>
          </button>
        )}
      </div>

      <div className="map-scroll">
        <svg width={svgW} height={svgH} viewBox={`0 0 ${svgW} ${svgH}`} className="map-svg">
          <defs>
            <marker id="arrowHi" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto"><path d="M0,0.5 L7,3 L0,5.5" fill="#6d28d9" /></marker>
            <marker id="arrowNorm" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto"><path d="M0,0.5 L7,3 L0,5.5" fill="#94a3b8" /></marker>
            <marker id="arrowDim" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto"><path d="M0,0.5 L7,3 L0,5.5" fill="#e2e8f0" /></marker>
            <marker id="arrowLeg" markerWidth="6" markerHeight="5" refX="5" refY="2.5" orient="auto"><path d="M0,0.5 L5,2.5 L0,4.5" fill="#94a3b8" /></marker>
            <marker id="arrowMcpHi" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto"><path d="M0,0.5 L7,3 L0,5.5" fill="#d97706" /></marker>
            <marker id="arrowMcp" markerWidth="6" markerHeight="5" refX="5" refY="2.5" orient="auto"><path d="M0,0.5 L5,2.5 L0,4.5" fill="#d97706" /></marker>
            <marker id="arrowMcpDim" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto"><path d="M0,0.5 L7,3 L0,5.5" fill="#e2e8f0" /></marker>
          </defs>

          {Object.entries(colLabels).map(([col, label]) => (
            <text key={col} x={PAD_X + parseInt(col) * (NODE_W + COL_GAP) + NODE_W / 2} y={20} textAnchor="middle" className="map-col-label">{label}</text>
          ))}

          {showEdges && edges.map((e, i) => {
            const from = nodePositions[e.from]
            const to = nodePositions[e.to]
            if (!from || !to) return null
            const isHi = activeId && highlightEdges.has(i)
            const isDim = activeId && !isHi
            const isMcpBinding = e.type === 'agent-mcp'
            const dashed = e.type === 'agent-agent'

            let stroke, markerEnd, strokeW
            if (isMcpBinding) {
              stroke = isDim ? '#e2e8f0' : '#d97706'
              markerEnd = isDim ? 'url(#arrowMcpDim)' : 'url(#arrowMcpHi)'
              strokeW = isHi ? 2.5 : 1.5
            } else {
              stroke = isDim ? '#e2e8f0' : isHi ? '#6d28d9' : '#94a3b8'
              markerEnd = isDim ? 'url(#arrowDim)' : isHi ? 'url(#arrowHi)' : 'url(#arrowNorm)'
              strokeW = isHi ? 2.5 : 1.5
            }

            return (
              <path
                key={i}
                d={edgePath(from, to)}
                fill="none"
                stroke={stroke}
                strokeWidth={strokeW}
                strokeDasharray={dashed ? '6,3' : isMcpBinding ? '2,3' : 'none'}
                markerEnd={markerEnd}
                style={{ transition: 'all 0.2s', opacity: isDim ? 0.2 : 1 }}
              />
            )
          })}

          {allNodes.map(node => {
            const pos = nodePositions[node.id]
            if (!pos) return null
            const color = kindColor[node.kind]
            const bg = kindBg[node.kind]
            const border = kindBorder[node.kind]
            const Icon = KindIcon[node.kind]
            const isAdd = node.kind === 'add'
            const isDim = activeId && !highlightNodes.has(node.id) && !isAdd
            const isHov = activeId === node.id
            const isLocked = lockedId === node.id
            const isMcpKind = node.kind === 'mcp-ext' || node.kind === 'mcp-local'
            const isFaded = node.kind === 'private' || node.kind === 'mcp-ext'
            return (
              <g
                key={node.id}
                transform={`translate(${pos.x}, ${pos.y})`}
                onMouseEnter={() => !lockedId && setHoveredId(node.id)}
                onMouseLeave={() => !lockedId && setHoveredId(null)}
                onClick={() => {
                  if (isAdd && onAddAgent) { onAddAgent(); return }
                  handleNodeClick(node.id, isAdd)
                }}
                onDoubleClick={() => {
                  if (!isAdd && node.slug && onAgentDblClick) {
                    onAgentDblClick(node.slug, node.label)
                  }
                }}
                style={{ cursor: 'pointer', opacity: isDim ? 0.2 : isFaded && !isHov && !isLocked ? 0.6 : 1, transition: 'opacity 0.2s' }}
              >
                {(isHov || isLocked) && (
                  <rect x={-3} y={-3} width={NODE_W + 6} height={NODE_H + 6} rx={11} fill="none" stroke={color} strokeWidth={isLocked ? 2 : 1} opacity={isLocked ? 0.6 : 0.3} />
                )}
                <rect
                  width={NODE_W} height={NODE_H} rx={8}
                  fill={isAdd ? '#faf5ff' : bg}
                  stroke={isHov || isLocked ? color : border}
                  strokeWidth={isHov || isLocked ? 2 : 1}
                  strokeDasharray={isAdd ? '6,4' : 'none'}
                />
                {!isAdd && <line x1={34} y1={8} x2={34} y2={NODE_H - 8} stroke={border} strokeWidth={1} />}
                <foreignObject x={0} y={0} width={NODE_W} height={NODE_H}>
                  <div xmlns="http://www.w3.org/1999/xhtml" className={`map-node-inner ${isAdd ? 'map-node-add' : ''}`}>
                    <div className="map-node-icon" style={{ color }}>
                      <Icon size={isAdd ? 18 : 14} />
                    </div>
                    <div className="map-node-text">
                      <span className="map-node-name" style={{ color }}>{node.label}</span>
                      {!isAdd && (
                        <span className="map-node-kind">
                          {node.kind === 'consumer' ? 'Service' : node.kind === 'mcp-ext' ? 'Ext. MCP' : node.kind === 'mcp-local' ? 'Local MCP' : node.kind === 'private' ? 'private' : node.kind === 'local' ? 'local' : node.kind}
                        </span>
                      )}
                    </div>
                    {!isAdd && node.kind !== 'consumer' && (
                      <label className={`live-toggle live-toggle-sm ${isMcpKind ? 'live-toggle-ro' : ''}`} onClick={e => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={node.enabled !== false}
                          disabled={isMcpKind}
                          onChange={() => {
                            if (node.agentId != null && onToggleAgent) onToggleAgent(node.agentId, node.enabled !== false)
                          }}
                        />
                        <span className="live-toggle-track" />
                      </label>
                    )}
                  </div>
                </foreignObject>
              </g>
            )
          })}
        </svg>
      </div>
    </div>
  )
}

export default AgentMapPanel
