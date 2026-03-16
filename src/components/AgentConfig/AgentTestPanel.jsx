import React, { useState, useMemo, useRef, useEffect } from 'react'
import { Play, Bot, Plug, Monitor, ArrowRight, CheckCircle2, Loader2, ChevronDown, ChevronRight, Clock, Zap, ToggleLeft, ToggleRight, FlaskConical } from 'lucide-react'
import { api } from '../../api'

const STEP_ICONS = {
  request:        { icon: Monitor,  color: '#6366f1', label: 'Request' },
  'agent-call':   { icon: Bot,      color: '#059669', label: 'Agent Call' },
  'agent-response':{ icon: Bot,     color: '#059669', label: 'Agent Response' },
  'mcp-call':     { icon: Plug,     color: '#d97706', label: 'MCP Call' },
  'mcp-response': { icon: Plug,     color: '#d97706', label: 'MCP Response' },
  response:       { icon: CheckCircle2, color: '#6366f1', label: 'Response' },
}

const AgentTestPanel = ({ agents }) => {
  const [selectedSlug, setSelectedSlug] = useState('')
  const [selectedAction, setSelectedAction] = useState('')
  const [paramText, setParamText] = useState('{ "query": "ERROR payment-service", "timeRange": "1h" }')
  const [trace, setTrace] = useState(null)
  const [visibleSteps, setVisibleSteps] = useState(0)
  const [running, setRunning] = useState(false)
  const [expandedSteps, setExpandedSteps] = useState(new Set())
  const [stubMode, setStubMode] = useState(false)
  const traceRef = useRef(null)
  const timerRef = useRef(null)

  const localAgents = useMemo(() =>
    (agents || []).filter(a => a.type === 'local' && a.enabled !== false).sort((a, b) => a.agent.name.localeCompare(b.agent.name)),
    [agents]
  )

  const selectedAgent = useMemo(() =>
    localAgents.find(a => (a.slug || a.agent.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')) === selectedSlug),
    [localAgents, selectedSlug]
  )

  const agentTools = useMemo(() => {
    if (!selectedAgent) return []
    return (selectedAgent.agent.tools || []).map(t => ({ id: t.id || t.name, name: t.name || t.id }))
  }, [selectedAgent])

  useEffect(() => {
    if (agentTools.length > 0 && !selectedAction) setSelectedAction(agentTools[0].id)
  }, [agentTools, selectedAction])

  function toggleStep(seq) {
    setExpandedSteps(prev => {
      const next = new Set(prev)
      next.has(seq) ? next.delete(seq) : next.add(seq)
      return next
    })
  }

  async function handleExecute() {
    if (!selectedSlug || running) return
    setTrace(null)
    setVisibleSteps(0)
    setExpandedSteps(new Set())
    setRunning(true)

    try {
      let params
      try { params = JSON.parse(paramText) } catch { params = { raw: paramText } }
      const result = await api.executeTrace(selectedSlug, selectedAction || undefined, params, stubMode)
      setTrace(result)
      animateSteps(result.steps.length)
    } catch (err) {
      setTrace({ error: err.message })
      setRunning(false)
    }
  }

  function animateSteps(total) {
    let idx = 0
    if (timerRef.current) clearInterval(timerRef.current)
    timerRef.current = setInterval(() => {
      idx++
      setVisibleSteps(idx)
      if (idx >= total) {
        clearInterval(timerRef.current)
        setRunning(false)
      }
    }, 180)
  }

  useEffect(() => () => { if (timerRef.current) clearInterval(timerRef.current) }, [])

  useEffect(() => {
    if (traceRef.current) traceRef.current.scrollTop = traceRef.current.scrollHeight
  }, [visibleSteps])

  const indentLevel = (step) => {
    if (step.type === 'request' || step.type === 'response') return 0
    if (step.type === 'agent-call' || step.type === 'agent-response') return 1
    if (step.type === 'mcp-call' || step.type === 'mcp-response') return 2
    return 0
  }

  return (
    <div className="test-panel">
      <div className="test-header">
        <Zap size={18} style={{ color: '#f59e0b' }} />
        <div>
          <div className="test-title">Agent Test Console</div>
          <div className="test-subtitle">Submit a request and trace the full execution path</div>
        </div>
      </div>

      <div className="test-form">
        <div className="test-form-row">
          <div className="test-field" style={{ flex: 2 }}>
            <label>Target Agent</label>
            <select value={selectedSlug} onChange={e => { setSelectedSlug(e.target.value); setSelectedAction('') }}>
              <option value="">Select an agent...</option>
              {localAgents.map(a => {
                const slug = a.slug || a.agent.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
                return <option key={a.id} value={slug}>{a.agent.name}</option>
              })}
            </select>
          </div>
          <div className="test-field" style={{ flex: 1 }}>
            <label>Action / Tool</label>
            <select value={selectedAction} onChange={e => setSelectedAction(e.target.value)} disabled={agentTools.length === 0}>
              {agentTools.length === 0 && <option value="">—</option>}
              {agentTools.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </div>
        </div>
        <div className="test-field">
          <label>Parameters (JSON)</label>
          <textarea rows={2} value={paramText} onChange={e => setParamText(e.target.value)} spellCheck={false} />
        </div>
        <div className="test-form-actions">
          <button className="test-run-btn" onClick={handleExecute} disabled={!selectedSlug || running}>
            {running ? <><Loader2 size={14} className="test-spinner" /> Tracing...</> : <><Play size={14} /> Execute &amp; Trace</>}
          </button>
          <button
            className={`test-stub-toggle ${stubMode ? 'active' : ''}`}
            onClick={() => setStubMode(v => !v)}
            title={stubMode ? 'Stub Mode ON — all MCP calls routed to STUB MCP' : 'Stub Mode OFF — MCP calls go to real servers'}
          >
            {stubMode ? <ToggleRight size={16} /> : <ToggleLeft size={16} />}
            <FlaskConical size={13} />
            <span>Stub Mode</span>
          </button>
        </div>
      </div>

      {trace && !trace.error && (
        <div className="test-trace" ref={traceRef}>
          <div className="test-trace-header">
            <span className="test-trace-id">{trace.traceId}</span>
            <span className="test-trace-agent"><Bot size={12} /> {trace.agentName}</span>
            <span className="test-trace-time"><Clock size={12} /> {trace.totalMs}ms total</span>
            <span className="test-trace-steps">{trace.steps.length} steps</span>
            {trace.stubMode && (
              <span className="test-trace-stub-badge">
                <FlaskConical size={11} /> STUB MODE
              </span>
            )}
          </div>

          <div className="test-steps">
            {trace.steps.slice(0, visibleSteps).map((step, i) => {
              const meta = STEP_ICONS[step.type] || STEP_ICONS.request
              const Icon = meta.icon
              const indent = indentLevel(step)
              const isExpanded = expandedSteps.has(step.seq)
              const isLast = i === trace.steps.length - 1 && visibleSteps >= trace.steps.length
              return (
                <div key={step.seq} className={`test-step test-step-indent-${indent} ${isLast ? 'test-step-final' : ''}`} onClick={() => toggleStep(step.seq)}>
                  <div className="test-step-line" style={{ borderColor: meta.color + '40' }}>
                    <div className="test-step-dot" style={{ background: meta.color }} />
                  </div>
                  <div className="test-step-content">
                    <div className="test-step-header">
                      <span className="test-step-badge" style={{ background: meta.color + '18', color: meta.color, borderColor: meta.color + '30' }}>
                        <Icon size={11} /> {meta.label}
                      </span>
                      {step.detail?.stubMode && (
                        <span className="test-step-stub-tag"><FlaskConical size={10} /> STUB</span>
                      )}
                      {step.detail?.result?.stub && (
                        <span className="test-step-stub-tag"><FlaskConical size={10} /> STUB</span>
                      )}
                      <span className="test-step-flow">
                        <span className="test-step-node">{step.from}</span>
                        <ArrowRight size={11} className="test-step-arrow" />
                        <span className="test-step-node">{step.to}</span>
                      </span>
                      <span className="test-step-dur">{step.durationMs}ms</span>
                      {isExpanded ? <ChevronDown size={13} className="test-step-chev" /> : <ChevronRight size={13} className="test-step-chev" />}
                    </div>
                    {isExpanded && step.detail && (
                      <pre className="test-step-detail">{JSON.stringify(step.detail, null, 2)}</pre>
                    )}
                  </div>
                </div>
              )
            })}
            {running && visibleSteps < (trace?.steps?.length || 0) && (
              <div className="test-step-loading"><Loader2 size={14} className="test-spinner" /> Executing...</div>
            )}
          </div>
        </div>
      )}

      {trace && trace.error && (
        <div className="test-error">Error: {trace.error}</div>
      )}

      {!trace && !running && (
        <div className="test-empty">
          <Zap size={32} strokeWidth={1.2} style={{ color: '#475569' }} />
          <p>Select an agent and click <strong>Execute &amp; Trace</strong> to simulate a request and see the full execution trace.</p>
        </div>
      )}
    </div>
  )
}

export default AgentTestPanel
