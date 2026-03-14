import React, { useMemo, useState } from 'react'
import { Plug, Cpu, Check, Wrench } from 'lucide-react'

const AgentMcpMatrixPanel = ({ agents, mcpServers }) => {
  const [hoveredCell, setHoveredCell] = useState(null)

  const matrix = useMemo(() => {
    const bindingMap = {}
    agents.forEach(a => {
      if (a.type !== 'local') return
      ;(a.mcpBindings || []).forEach(b => {
        const key = `${a.id}::${b.serverId}`
        bindingMap[key] = b
      })
    })

    const localAgents = agents.filter(a => a.type === 'local')
    const boundServerIds = new Set()
    localAgents.forEach(a => (a.mcpBindings || []).forEach(b => boundServerIds.add(b.serverId)))
    const relevantServers = mcpServers.filter(s => boundServerIds.has(s.id))
    const unboundServers = mcpServers.filter(s => !boundServerIds.has(s.id))

    return { localAgents, relevantServers, unboundServers, bindingMap }
  }, [agents, mcpServers])

  const { localAgents, relevantServers, unboundServers, bindingMap } = matrix
  const allServers = [...relevantServers, ...unboundServers]

  if (localAgents.length === 0 || allServers.length === 0) {
    return (
      <div className="mx-panel">
        <div className="mcp-empty">
          <Plug size={28} strokeWidth={1.4} />
          <h4>No data for matrix</h4>
          <p>Add local agents with MCP bindings to see the matrix view.</p>
        </div>
      </div>
    )
  }

  const totalBindings = Object.keys(bindingMap).length
  const totalCells = localAgents.length * allServers.length
  const coverage = totalCells > 0 ? Math.round((totalBindings / totalCells) * 100) : 0

  return (
    <div className="mx-panel">
      <div className="mx-header">
        <div>
          <div className="mx-title">Agent × MCP Server Matrix</div>
          <div className="mx-subtitle">
            {localAgents.length} local agent{localAgents.length !== 1 ? 's' : ''} · {allServers.length} MCP server{allServers.length !== 1 ? 's' : ''} · {totalBindings} binding{totalBindings !== 1 ? 's' : ''} · {coverage}% coverage
          </div>
        </div>
        <div className="mx-legend">
          <span className="mx-legend-item"><span className="mx-legend-dot mx-dot-bound" /> Bound</span>
          <span className="mx-legend-item"><span className="mx-legend-dot mx-dot-empty" /> Not bound</span>
        </div>
      </div>

      <div className="mx-scroll">
        <table className="mx-table">
          <thead>
            <tr>
              <th className="mx-corner">
                <span className="mx-corner-agent">Agents ↓</span>
                <span className="mx-corner-mcp">MCP Servers →</span>
              </th>
              {allServers.map(s => (
                <th key={s.id} className="mx-col-header">
                  <div className="mx-col-header-inner">
                    <Plug size={12} className="mx-col-icon" />
                    <span className="mx-col-name">{s.name}</span>
                    <span className="mx-col-id">{s.id}</span>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {localAgents.map(agent => (
              <tr key={agent.id}>
                <td className="mx-row-header">
                  <div className="mx-row-header-inner">
                    <Cpu size={13} className="mx-row-icon" />
                    <span className="mx-row-name">{agent.agent.name}</span>
                    <span className="mx-row-count">
                      {(agent.mcpBindings || []).length}
                    </span>
                  </div>
                </td>
                {allServers.map(s => {
                  const key = `${agent.id}::${s.id}`
                  const binding = bindingMap[key]
                  const isHovered = hoveredCell === key
                  return (
                    <td
                      key={s.id}
                      className={`mx-cell ${binding ? 'mx-cell-bound' : 'mx-cell-empty'} ${isHovered ? 'mx-cell-hover' : ''}`}
                      onMouseEnter={() => setHoveredCell(key)}
                      onMouseLeave={() => setHoveredCell(null)}
                    >
                      {binding ? (
                        <div className="mx-cell-content">
                          <Check size={14} className="mx-check" />
                          {isHovered && (
                            <div className="mx-tooltip">
                              <div className="mx-tooltip-title">{agent.agent.name} → {s.name}</div>
                              {binding.purpose && <div className="mx-tooltip-purpose">{binding.purpose}</div>}
                              <div className="mx-tooltip-tools">
                                {(binding.tools || []).map(t => (
                                  <span key={t} className="mcp-tool-chip">{t}</span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="mx-cell-dash">—</span>
                      )}
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default AgentMcpMatrixPanel
