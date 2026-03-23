import React, { useState, useEffect, useMemo } from 'react'
import { X, Activity, Clock, Hash, MessageSquare, Bot, ChevronDown, ChevronUp, FlaskConical, Plug, Monitor, CheckCircle2, ArrowRight, ChevronRight, RefreshCw } from 'lucide-react'
import { api } from '../../api'

const TRACE_STEP_META = {
  request:         { icon: Monitor,      color: '#6366f1', label: 'Request' },
  'agent-call':    { icon: Bot,          color: '#059669', label: 'Agent Call' },
  'agent-response':{ icon: Bot,          color: '#059669', label: 'Agent Resp' },
  'mcp-call':      { icon: Plug,         color: '#d97706', label: 'MCP Call' },
  'mcp-response':  { icon: Plug,         color: '#d97706', label: 'MCP Resp' },
  response:        { icon: CheckCircle2, color: '#6366f1', label: 'Response' },
}

const AgentLogViewer = ({ agentSlug, agentName, onClose }) => {
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedIdx, setSelectedIdx] = useState(null)
  const [sortCol, setSortCol] = useState('timestamp')
  const [sortDir, setSortDir] = useState('desc')
  const [expandedTraceSteps, setExpandedTraceSteps] = useState(new Set())

  const fetchLogs = () => {
    if (!agentSlug) return
    setLoading(true)
    api.getAgentLogs(agentSlug)
      .then(data => { setLogs(data); setLoading(false) })
      .catch(() => setLoading(false))
  }

  useEffect(() => {
    setSelectedIdx(null)
    setExpandedTraceSteps(new Set())
    fetchLogs()
  }, [agentSlug])

  const sorted = useMemo(() => {
    const copy = logs.map((l, i) => ({ ...l, _origIdx: i }))
    copy.sort((a, b) => {
      let va, vb
      if (sortCol === 'timestamp') { va = a.timestamp; vb = b.timestamp }
      else if (sortCol === 'requestId') { va = a.requestId; vb = b.requestId }
      else if (sortCol === 'action') { va = a.request?.action || ''; vb = b.request?.action || '' }
      else if (sortCol === 'reasoning') { va = a.reasoning || ''; vb = b.reasoning || '' }
      else if (sortCol === 'status') { va = a.response?.status || ''; vb = b.response?.status || '' }
      else return 0
      if (typeof va === 'number') return sortDir === 'asc' ? va - vb : vb - va
      return sortDir === 'asc' ? String(va).localeCompare(String(vb)) : String(vb).localeCompare(String(va))
    })
    return copy
  }, [logs, sortCol, sortDir])

  const handleSort = (col) => {
    if (sortCol === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortCol(col); setSortDir('asc') }
  }

  const fmtTime = (ts) => {
    try { return new Date(ts).toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' }) }
    catch { return ts }
  }

  const fmtDate = (ts) => {
    try { return new Date(ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) }
    catch { return '' }
  }

  const selected = selectedIdx != null ? sorted[selectedIdx] : null

  return (
    <div className="logv-panel">
      <div className="logv-header">
        <div className="logv-header-left">
          <Activity size={15} className="logv-header-icon" />
          <span className="logv-title">Traffic Log</span>
          <span className="logv-agent-name">{agentName}</span>
          <span className="logv-count">{logs.length} entries</span>
        </div>
        <div className="logv-header-actions">
          <button className="logv-refresh" onClick={fetchLogs} title="Refresh"><RefreshCw size={13} /></button>
          <button className="logv-close" onClick={onClose} title="Close"><X size={15} /></button>
        </div>
      </div>

      <div className="logv-split">
        {/* Left: Table */}
        <div className="logv-left">
          {loading ? (
            <div className="logv-loading">Loading logs...</div>
          ) : logs.length === 0 ? (
            <div className="logv-empty">
              <Activity size={24} />
              <h4>No traffic recorded</h4>
              <p>No log entries found for this agent.</p>
            </div>
          ) : (
            <div className="logv-table-wrap">
              <table className="logv-table">
                <thead>
                  <tr>
                    {[
                      { key: 'requestId', label: 'Request ID' },
                      { key: 'timestamp', label: 'Timestamp' },
                      { key: 'action', label: 'Request Object' },
                      { key: 'reasoning', label: 'Reasoning' },
                      { key: 'status', label: 'Response' },
                    ].map(col => (
                      <th key={col.key} onClick={() => handleSort(col.key)} className="logv-sortable">
                        <span>{col.label}</span>
                        {sortCol === col.key && (
                          sortDir === 'asc' ? <ChevronUp size={10} /> : <ChevronDown size={10} />
                        )}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {sorted.map((log, i) => (
                    <tr
                      key={log.requestId || i}
                      className={`logv-row ${selectedIdx === i ? 'active' : ''}`}
                      onClick={() => setSelectedIdx(selectedIdx === i ? null : i)}
                    >
                      <td className="logv-cell-reqid">
                        {log.source === 'test' && <span className="logv-source-badge">TEST</span>}
                        {log.requestId}
                      </td>
                      <td className="logv-cell-ts">
                        <span className="logv-ts-date">{fmtDate(log.timestamp)}</span>
                        <span className="logv-ts-time">{fmtTime(log.timestamp)}</span>
                      </td>
                      <td>
                        <span className="logv-action-badge">{log.request?.action || '—'}</span>
                      </td>
                      <td className="logv-cell-reasoning">{log.reasoning}</td>
                      <td>
                        <span className={`logv-status logv-status-${log.response?.status || 'unknown'}`}>
                          {log.response?.status || '—'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Right: Detail */}
        <div className="logv-right">
          {selected ? (
            <div className="logv-detail">
              <div className="logv-detail-block">
                <div className="logv-detail-label"><Hash size={11} /> Request ID</div>
                <div className="logv-detail-value logv-mono">
                  {selected.source === 'test' && <span className="logv-source-badge">TEST</span>}
                  {selected.requestId}
                </div>
              </div>
              <div className="logv-detail-block">
                <div className="logv-detail-label"><Clock size={11} /> Timestamp</div>
                <div className="logv-detail-value logv-mono">{selected.timestamp}</div>
              </div>
              <div className="logv-detail-block">
                <div className="logv-detail-label"><MessageSquare size={11} /> Reasoning</div>
                <div className="logv-detail-reasoning">{selected.reasoning}</div>
              </div>
              <div className="logv-detail-block">
                <div className="logv-detail-label"><Bot size={11} /> Request Object</div>
                <pre className="logv-detail-json">{JSON.stringify(selected.request, null, 2)}</pre>
              </div>
              <div className="logv-detail-block">
                <div className="logv-detail-label"><Activity size={11} /> Response Object</div>
                <pre className="logv-detail-json">{JSON.stringify(selected.response, null, 2)}</pre>
              </div>

              {/* Trace Steps — only for test entries */}
              {selected.traceSteps && selected.traceSteps.length > 0 && (
                <div className="logv-detail-block logv-trace-block">
                  <div className="logv-detail-label"><FlaskConical size={11} /> Execution Trace ({selected.traceSteps.length} steps)</div>
                  <div className="logv-trace-steps">
                    {selected.traceSteps.map(step => {
                      const meta = TRACE_STEP_META[step.type] || TRACE_STEP_META.request
                      const Icon = meta.icon
                      const isOpen = expandedTraceSteps.has(step.seq)
                      const indent = step.type === 'request' || step.type === 'response' ? 0
                        : step.type === 'agent-call' || step.type === 'agent-response' ? 1 : 2
                      return (
                        <div key={step.seq} className={`logv-ts-row logv-ts-indent-${indent}`}>
                          <div
                            className="logv-ts-header"
                            onClick={() => setExpandedTraceSteps(prev => {
                              const next = new Set(prev)
                              next.has(step.seq) ? next.delete(step.seq) : next.add(step.seq)
                              return next
                            })}
                          >
                            <span className="logv-ts-dot" style={{ background: meta.color }} />
                            <span className="logv-ts-badge" style={{ background: meta.color + '18', color: meta.color }}><Icon size={10} /> {meta.label}</span>
                            <span className="logv-ts-flow">
                              <span className="logv-ts-node">{step.from}</span>
                              <ArrowRight size={10} className="logv-ts-arrow" />
                              <span className="logv-ts-node">{step.to}</span>
                            </span>
                            <span className="logv-ts-dur">{step.durationMs}ms</span>
                            {isOpen ? <ChevronDown size={11} className="logv-ts-chev" /> : <ChevronRight size={11} className="logv-ts-chev" />}
                          </div>
                          {isOpen && step.detail && (
                            <pre className="logv-ts-detail">{JSON.stringify(step.detail, null, 2)}</pre>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="logv-detail-empty">
              <Activity size={20} />
              <span>Select a row to view details</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default AgentLogViewer
