import React, { useMemo, useState, useCallback, useRef, useEffect } from 'react'
import { Monitor, Cpu, Plug, Plus, Link2 } from 'lucide-react'

const NODE_W = 190
const NODE_H = 52
const COL_GAP = 22
const ROW_GAP = 100
const SECTION_GAP = 36
const PAD_X = 40
const PAD_Y = 50

function slugify(name) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
}

const AgentMapVerticalPanel = ({ agents, consumers, mcpServers, onAddAgent, onToggleAgent, onToggleMcp, onAgentDblClick }) => {
  const [hoveredId, setHoveredId] = useState(null)
  const [lockedId, setLockedId] = useState(null)
  const [showEdges, setShowEdges] = useState(true)
  const [containerW, setContainerW] = useState(1200)
  const scrollRef = useRef(null)

  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    const ro = new ResizeObserver(entries => {
      for (const entry of entries) {
        setContainerW(entry.contentRect.width)
      }
    })
    ro.observe(el)
    setContainerW(el.clientWidth)
    return () => ro.disconnect()
  }, [])

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

    // Vertical layout: rows from top to bottom
    // Row 0: Consumer (centered)
    // Row 1: Public agents spread horizontally
    // Row 2: Private agents + Local MCPs
    // Row 3: External MCPs
    const allNodes = []
    const rowNodes = {}

    // Row 0 — Consumer
    allNodes.push({ id: '__consumer__', label: 'Consumer', kind: 'consumer', vrow: 0, vcol: 0 })
    rowNodes[0] = [allNodes[allNodes.length - 1]]

    // Row 1 — Public agents
    const row1 = []
    publicSlugs.forEach((slug, i) => {
      const a = agentBySlug[slug]
      if (!a) return
      const node = { id: `agent-${a.id}`, slug, label: a.agent.name, kind: a.type, vrow: 1, vcol: i, agentId: a.id, enabled: a.enabled !== false, role: a.role }
      allNodes.push(node)
      row1.push(node)
    })
    const addNode = { id: '__add_agent__', label: 'Add Agent', kind: 'add', vrow: 1, vcol: row1.length }
    allNodes.push(addNode)
    row1.push(addNode)
    rowNodes[1] = row1

    // Row 2 — Private agents + Local MCPs
    const row2 = []
    privateSlugs.forEach((slug, i) => {
      const a = agentBySlug[slug]
      if (!a) return
      const node = { id: `agent-${a.id}`, slug, label: a.agent.name, kind: 'private', vrow: 2, vcol: row2.length, agentId: a.id, enabled: a.enabled !== false, role: a.role }
      allNodes.push(node)
      row2.push(node)
    })
    boundLocalMcp.forEach((s) => {
      const isPublic = s.role !== 'private'
      const node = { id: `mcp-${s.id}`, mcpId: s.id, label: s.name, kind: 'mcp-local', vrow: 2, vcol: row2.length, enabled: s.enabled !== false, isPublic }
      allNodes.push(node)
      row2.push(node)
    })
    rowNodes[2] = row2

    // Row 3 — External MCPs
    const row3 = []
    boundExternalMcp.forEach((s) => {
      const node = { id: `mcp-${s.id}`, mcpId: s.id, label: s.name, kind: 'mcp-ext', vrow: 3, vcol: row3.length, enabled: s.enabled !== false }
      allNodes.push(node)
      row3.push(node)
    })
    rowNodes[3] = row3

    // Edges
    const edges = []
    const agentNodes = allNodes.filter(n => n.slug)

    agentNodes.forEach(n => {
      if (n.kind !== 'private') {
        edges.push({ from: '__consumer__', to: n.id, type: 'consumer-agent' })
      }
    })
    allNodes.forEach(n => {
      if (n.kind === 'mcp-local' && n.isPublic) {
        edges.push({ from: '__consumer__', to: n.id, type: 'consumer-mcp' })
      }
    })
    agents.forEach(a => {
      const srcSlug = a.slug || slugify(a.agent.name)
      const src = agentNodes.find(n => n.slug === srcSlug)
      if (!src) return
      ;(a.calls || []).forEach(targetSlug => {
        const target = agentNodes.find(n => n.slug === targetSlug)
        if (target) edges.push({ from: src.id, to: target.id, type: 'agent-agent' })
      })
      ;(a.mcpBindings || []).forEach(b => {
        const sid = typeof b === 'string' ? b : b.serverId
        const target = allNodes.find(n => n.mcpId === sid)
        if (target) edges.push({ from: src.id, to: target.id, type: 'agent-mcp' })
      })
    })

    const rowLabels = {
      0: 'CONSUMERS',
      1: 'PUBLIC AGENTS',
      2: (privateSlugs.length > 0 && (boundLocalMcp.length > 0)) ? 'PRIVATE AGENTS & LOCAL MCP'
        : privateSlugs.length > 0 ? 'PRIVATE AGENTS'
        : boundLocalMcp.length > 0 ? 'LOCAL MCP' : '',
      3: 'EXTERNAL MCP',
    }

    // Responsive positioning — wrap nodes when they exceed available width
    const availW = Math.max(containerW - PAD_X * 2, NODE_W + COL_GAP)
    const maxPerLine = Math.max(1, Math.floor((availW + COL_GAP) / (NODE_W + COL_GAP)))
    const svgW = Math.max(availW + PAD_X * 2, 400)

    const LABEL_H = 24
    const WRAP_ROW_GAP = 10
    const nodePositions = {}
    const rowLabelYs = {}
    let cursorY = PAD_Y

    const totalRows = 4
    for (let r = 0; r < totalRows; r++) {
      const nodes = rowNodes[r] || []
      if (nodes.length === 0) continue

      rowLabelYs[r] = cursorY + 14
      cursorY += LABEL_H

      const lineCount = Math.ceil(nodes.length / maxPerLine)
      for (let li = 0; li < lineCount; li++) {
        const lineNodes = nodes.slice(li * maxPerLine, (li + 1) * maxPerLine)
        const lineW = lineNodes.length * NODE_W + Math.max(0, lineNodes.length - 1) * COL_GAP
        const startX = (svgW - lineW) / 2
        lineNodes.forEach((n, i) => {
          nodePositions[n.id] = { x: startX + i * (NODE_W + COL_GAP), y: cursorY, vrow: r }
        })
        cursorY += NODE_H + (li < lineCount - 1 ? WRAP_ROW_GAP : 0)
      }
      cursorY += ROW_GAP
    }

    const svgH = cursorY - ROW_GAP + PAD_Y + 20

    return { allNodes, edges, nodePositions, svgW, svgH, rowLabels, rowNodes, rowLabelYs, hasPrivate: privateSlugs.length > 0, LABEL_H }
  }, [agents, consumers, mcpServers, containerW])

  const { allNodes, edges, nodePositions, svgW, svgH, rowLabels, rowNodes, rowLabelYs, hasPrivate, LABEL_H } = graph

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

  const kindColor  = { consumer: '#6366f1', local: '#059669', external: '#2563eb', private: '#94a3b8', mcp: '#d97706', 'mcp-local': '#d97706', 'mcp-ext': '#ca8a04', add: '#6d28d9' }
  const kindBg     = { consumer: '#f5f3ff', local: '#ecfdf5', external: '#eff6ff', private: '#f8fafc', mcp: '#fffbeb', 'mcp-local': '#fffbeb', 'mcp-ext': '#fefce8', add: '#faf5ff' }
  const kindBorder = { consumer: '#c4b5fd', local: '#a7f3d0', external: '#bfdbfe', private: '#e2e8f0', mcp: '#fde68a', 'mcp-local': '#fde68a', 'mcp-ext': '#fef08a', add: '#d8b4fe' }
  const KindIcon   = { consumer: Monitor, local: Cpu, external: Cpu, private: Cpu, mcp: Plug, 'mcp-local': Plug, 'mcp-ext': Plug, add: Plus }

  function edgePath(from, to) {
    const x1 = from.x + NODE_W / 2
    const y1 = from.y + NODE_H
    const x2 = to.x + NODE_W / 2
    const y2 = to.y
    const sameRow = from.vrow === to.vrow
    if (sameRow) {
      const bulge = 50
      return `M${x1},${y1} C${x1},${y1 + bulge} ${x2},${y2 + bulge} ${x2},${y2}`
    }
    const cy1 = y1 + (y2 - y1) * 0.35
    const cy2 = y2 - (y2 - y1) * 0.35
    return `M${x1},${y1} C${x1},${cy1} ${x2},${cy2} ${x2},${y2}`
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
            <line x1="0" y1="5" x2="28" y2="5" stroke="#94a3b8" strokeWidth="1.5" markerEnd="url(#vArrowLeg)" />
          </svg>
          <span>Direct call</span>
        </span>
        <span className="map-legend-item">
          <svg width="32" height="10" style={{ display: 'block' }}>
            <line x1="0" y1="5" x2="28" y2="5" stroke="#94a3b8" strokeWidth="1.5" strokeDasharray="5,3" markerEnd="url(#vArrowLeg)" />
          </svg>
          <span>Agent-to-agent</span>
        </span>
        <span className="map-legend-item">
          <svg width="32" height="10" style={{ display: 'block' }}>
            <line x1="0" y1="5" x2="28" y2="5" stroke="#d97706" strokeWidth="1.5" strokeDasharray="2,3" markerEnd="url(#vArrowMcp)" />
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

      <div className="map-scroll" ref={scrollRef}>
        <svg width={svgW} height={svgH} viewBox={`0 0 ${svgW} ${svgH}`} className="map-svg">
          <defs>
            <marker id="vArrowHi" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto"><path d="M0,0.5 L7,3 L0,5.5" fill="#6d28d9" /></marker>
            <marker id="vArrowNorm" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto"><path d="M0,0.5 L7,3 L0,5.5" fill="#94a3b8" /></marker>
            <marker id="vArrowDim" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto"><path d="M0,0.5 L7,3 L0,5.5" fill="#e2e8f0" /></marker>
            <marker id="vArrowLeg" markerWidth="6" markerHeight="5" refX="5" refY="2.5" orient="auto"><path d="M0,0.5 L5,2.5 L0,4.5" fill="#94a3b8" /></marker>
            <marker id="vArrowMcpHi" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto"><path d="M0,0.5 L7,3 L0,5.5" fill="#d97706" /></marker>
            <marker id="vArrowMcp" markerWidth="6" markerHeight="5" refX="5" refY="2.5" orient="auto"><path d="M0,0.5 L5,2.5 L0,4.5" fill="#d97706" /></marker>
            <marker id="vArrowMcpDim" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto"><path d="M0,0.5 L7,3 L0,5.5" fill="#e2e8f0" /></marker>
          </defs>

          {/* Row labels */}
          {Object.entries(rowLabels).map(([row, label]) => {
            if (!label) return null
            const labelY = rowLabelYs[row]
            if (labelY == null) return null
            return (
              <text key={row} x={svgW / 2} y={labelY} textAnchor="middle" className="map-col-label">{label}</text>
            )
          })}

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
              markerEnd = isDim ? 'url(#vArrowMcpDim)' : 'url(#vArrowMcpHi)'
              strokeW = isHi ? 2.5 : 1.5
            } else {
              stroke = isDim ? '#e2e8f0' : isHi ? '#6d28d9' : '#94a3b8'
              markerEnd = isDim ? 'url(#vArrowDim)' : isHi ? 'url(#vArrowHi)' : 'url(#vArrowNorm)'
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

export default AgentMapVerticalPanel
