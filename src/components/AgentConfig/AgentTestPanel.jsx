import React, { useState, useMemo, useRef, useEffect } from 'react'
import { Play, Bot, Plug, Monitor, ArrowRight, CheckCircle2, Loader2, ChevronDown, ChevronRight, Clock, Zap, ToggleLeft, ToggleRight, FlaskConical, Globe, Send, FileJson, Code, CreditCard, AlertCircle, Tag, TestTube2 } from 'lucide-react'
import { api } from '../../api'

const STEP_ICONS = {
  request:        { icon: Monitor,  color: '#6366f1', label: 'Request' },
  'agent-call':   { icon: Bot,      color: '#059669', label: 'Agent Call' },
  'agent-response':{ icon: Bot,     color: '#059669', label: 'Agent Response' },
  'mcp-call':     { icon: Plug,     color: '#d97706', label: 'MCP Call' },
  'mcp-response': { icon: Plug,     color: '#d97706', label: 'MCP Response' },
  response:       { icon: CheckCircle2, color: '#6366f1', label: 'Response' },
}

/* ═══════════════════════ Tracing Tab (existing) ═══════════════════════ */

const TracingTab = ({ agents }) => {
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
    setExpandedSteps(prev => { const n = new Set(prev); n.has(seq) ? n.delete(seq) : n.add(seq); return n })
  }

  async function handleExecute() {
    if (!selectedSlug || running) return
    setTrace(null); setVisibleSteps(0); setExpandedSteps(new Set()); setRunning(true)
    try {
      let params
      try { params = JSON.parse(paramText) } catch { params = { raw: paramText } }
      const result = await api.executeTrace(selectedSlug, selectedAction || undefined, params, stubMode)
      setTrace(result)
      let idx = 0
      if (timerRef.current) clearInterval(timerRef.current)
      timerRef.current = setInterval(() => {
        idx++; setVisibleSteps(idx)
        if (idx >= result.steps.length) { clearInterval(timerRef.current); setRunning(false) }
      }, 180)
    } catch (err) { setTrace({ error: err.message }); setRunning(false) }
  }

  useEffect(() => () => { if (timerRef.current) clearInterval(timerRef.current) }, [])
  useEffect(() => { if (traceRef.current) traceRef.current.scrollTop = traceRef.current.scrollHeight }, [visibleSteps])

  const indentLevel = (step) => {
    if (step.type === 'request' || step.type === 'response') return 0
    if (step.type === 'agent-call' || step.type === 'agent-response') return 1
    return 2
  }

  return (
    <>
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
          <button className={`test-stub-toggle ${stubMode ? 'active' : ''}`} onClick={() => setStubMode(v => !v)}
            title={stubMode ? 'Stub Mode ON' : 'Stub Mode OFF'}>
            {stubMode ? <ToggleRight size={16} /> : <ToggleLeft size={16} />}
            <FlaskConical size={13} /><span>Stub Mode</span>
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
            {trace.stubMode && <span className="test-trace-stub-badge"><FlaskConical size={11} /> STUB MODE</span>}
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
                      {step.detail?.stubMode && <span className="test-step-stub-tag"><FlaskConical size={10} /> STUB</span>}
                      {step.detail?.result?.stub && <span className="test-step-stub-tag"><FlaskConical size={10} /> STUB</span>}
                      <span className="test-step-flow">
                        <span className="test-step-node">{step.from}</span>
                        <ArrowRight size={11} className="test-step-arrow" />
                        <span className="test-step-node">{step.to}</span>
                      </span>
                      <span className="test-step-dur">{step.durationMs}ms</span>
                      {isExpanded ? <ChevronDown size={13} className="test-step-chev" /> : <ChevronRight size={13} className="test-step-chev" />}
                    </div>
                    {isExpanded && step.detail && <pre className="test-step-detail">{JSON.stringify(step.detail, null, 2)}</pre>}
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
      {trace && trace.error && <div className="test-error">Error: {trace.error}</div>}
      {!trace && !running && (
        <div className="test-empty">
          <Zap size={32} strokeWidth={1.2} style={{ color: '#475569' }} />
          <p>Select an agent and click <strong>Execute &amp; Trace</strong> to simulate a request and see the full execution trace.</p>
        </div>
      )}
    </>
  )
}

/* ═══════════════════════ Tester Tab (A2A) ═══════════════════════ */

const TesterTab = () => {
  const [cardUrl, setCardUrl] = useState('')
  const [card, setCard] = useState(null)
  const [cardError, setCardError] = useState(null)
  const [cardLoading, setCardLoading] = useState(false)

  const [selectedSkill, setSelectedSkill] = useState('')
  const [userMessage, setUserMessage] = useState('')
  const [paramsJson, setParamsJson] = useState('{}')

  const [result, setResult] = useState(null)
  const [invoking, setInvoking] = useState(false)
  const [resultTab, setResultTab] = useState('response')

  const isDemoMode = cardUrl.trim().toLowerCase() === 'test'

  const skills = useMemo(() => card?.skills || [], [card])
  const activeSkill = useMemo(() => skills.find(s => s.id === selectedSkill || s.name === selectedSkill), [skills, selectedSkill])
  const paramFields = useMemo(() => {
    if (!activeSkill) return []
    const schema = activeSkill.inputSchema || activeSkill.parameters
    if (!schema || !schema.properties) return []
    return Object.entries(schema.properties).map(([key, def]) => ({
      key,
      type: def.type || 'string',
      description: def.description || '',
      required: (schema.required || []).includes(key)
    }))
  }, [activeSkill])

  const [paramValues, setParamValues] = useState({})

  useEffect(() => {
    if (skills.length > 0 && !selectedSkill) setSelectedSkill(skills[0].id || skills[0].name)
  }, [skills, selectedSkill])

  useEffect(() => {
    setParamValues({})
    if (activeSkill) {
      const defaults = {}
      paramFields.forEach(f => { defaults[f.key] = '' })
      setParamValues(defaults)
      setParamsJson(JSON.stringify(defaults, null, 2))
    }
  }, [activeSkill])

  async function handleFetchCard() {
    if (!cardUrl.trim()) return
    setCardLoading(true); setCardError(null); setCard(null); setResult(null)
    try {
      const c = await api.fetchAgentCard(cardUrl.trim())
      setCard(c)
    } catch (err) {
      setCardError(err.message)
    }
    setCardLoading(false)
  }

  function handleFormatJson() {
    try {
      const obj = JSON.parse(paramsJson)
      setParamsJson(JSON.stringify(obj, null, 2))
    } catch {}
  }

  function handleResetFromForm() {
    setParamsJson(JSON.stringify(paramValues, null, 2))
  }

  function syncFormFromJson() {
    try {
      const obj = JSON.parse(paramsJson)
      setParamValues(prev => ({ ...prev, ...obj }))
    } catch {}
  }

  async function handleInvoke() {
    if (!card || invoking) return
    setInvoking(true); setResult(null)
    try {
      let params
      try { params = JSON.parse(paramsJson) } catch { params = paramValues }
      const agentUrl = isDemoMode ? 'test' : (card.url || cardUrl.replace(/\/.well-known\/agent-card\.json.*/, ''))
      const res = await api.invokeA2A(agentUrl, selectedSkill || undefined, params, userMessage || undefined)
      setResult(res)
      setResultTab('response')
    } catch (err) {
      setResult({ error: err.message })
    }
    setInvoking(false)
  }

  const responseParts = useMemo(() => {
    if (!result?.parsed?.result) return null
    const r = result.parsed.result
    return r.parts || r.message?.parts || (r.content ? [{ kind: 'text', text: r.content }] : null)
  }, [result])

  return (
    <div className="a2a-tester">
      {/* Card URL bar */}
      <div className="a2a-url-bar">
        <label className="a2a-url-label">
          AGENT CARD URL
          {isDemoMode && <span className="a2a-demo-badge"><TestTube2 size={11} /> DEMO MODE</span>}
        </label>
        <div className="a2a-url-row">
          <input
            type="text"
            className={`a2a-url-input ${isDemoMode ? 'a2a-url-demo' : ''}`}
            value={cardUrl}
            onChange={e => setCardUrl(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleFetchCard()}
            placeholder='Enter URL or type "test" for demo mode'
          />
          <button className="a2a-url-btn" onClick={handleFetchCard} disabled={cardLoading || !cardUrl.trim()}>
            {cardLoading ? <Loader2 size={14} className="test-spinner" /> : isDemoMode ? <TestTube2 size={14} /> : <Globe size={14} />}
            <span>{isDemoMode ? 'Demo' : 'Fetch'}</span>
          </button>
        </div>
        {cardError && <div className="a2a-url-error"><AlertCircle size={12} /> {cardError}</div>}
      </div>

      {card && (
        <div className="a2a-body">
          {/* Left: form */}
          <div className="a2a-left">
            {/* Agent info badge */}
            <div className="a2a-agent-info">
              {result && !result.error && (
                <span className="a2a-completed">● Completed in {result.elapsedMs}ms</span>
              )}
              {isDemoMode
                ? <span className="a2a-badge a2a-badge-demo"><TestTube2 size={11} /> DEMO</span>
                : <span className="a2a-badge">A2A</span>
              }
              <span className="a2a-agent-name">{card.name || 'Agent'}</span>
              <span className="a2a-agent-ver">v{card.version || '?'}</span>
            </div>

            {/* Skill selector */}
            <div className="a2a-section">
              <label className="a2a-label">SKILL</label>
              <select className="a2a-select" value={selectedSkill} onChange={e => setSelectedSkill(e.target.value)}>
                {skills.map((sk, i) => (
                  <option key={sk.id || sk.name || i} value={sk.id || sk.name}>
                    {sk.name || sk.id} — {(sk.description || '').slice(0, 50)}
                  </option>
                ))}
                {skills.length === 0 && <option value="">No skills found</option>}
              </select>
              {activeSkill && (
                <div className="a2a-skill-desc">
                  <p>{activeSkill.description}</p>
                  {(activeSkill.tags || []).length > 0 && (
                    <div className="a2a-skill-tags">
                      {activeSkill.tags.map((t, i) => <span key={i} className="a2a-skill-tag"><Tag size={9} /> {t}</span>)}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Parameter fields */}
            {paramFields.length > 0 && (
              <div className="a2a-section">
                <label className="a2a-label">PARAMETERS <span className="a2a-field-count">{paramFields.length} field{paramFields.length !== 1 ? 's' : ''}</span></label>
                {paramFields.map(f => (
                  <div key={f.key} className="a2a-param-field">
                    <div className="a2a-param-head">
                      <span className="a2a-param-name">{f.key}</span>
                      <span className="a2a-param-type">{f.type}</span>
                      {f.required && <span className="a2a-param-req">required</span>}
                    </div>
                    {f.description && <span className="a2a-param-desc">{f.description}</span>}
                    <input
                      type="text"
                      className="a2a-param-input"
                      value={paramValues[f.key] || ''}
                      onChange={e => {
                        const v = { ...paramValues, [f.key]: e.target.value }
                        setParamValues(v)
                        setParamsJson(JSON.stringify(v, null, 2))
                      }}
                    />
                  </div>
                ))}
              </div>
            )}

            {/* User message */}
            <div className="a2a-section">
              <label className="a2a-label">USER MESSAGE <span className="a2a-field-hint">guides AI tool selection</span></label>
              <textarea
                className="a2a-textarea"
                rows={2}
                value={userMessage}
                onChange={e => setUserMessage(e.target.value)}
                placeholder="e.g. subtract 4 from 10 · say hello · look up notification 123"
              />
              <span className="a2a-field-hint">Optional — natural-language override for AI tool selection (equivalent to <code>userMessage=...</code> in CLI).</span>
            </div>

            {/* Parameters JSON */}
            <div className="a2a-section">
              <div className="a2a-json-header">
                <label className="a2a-label">PARAMETERS JSON</label>
                <button className="a2a-json-btn" onClick={handleFormatJson}>FORMAT</button>
                <button className="a2a-json-btn" onClick={handleResetFromForm}>RESET FROM FORM</button>
              </div>
              <textarea
                className="a2a-json-editor"
                rows={4}
                value={paramsJson}
                onChange={e => setParamsJson(e.target.value)}
                onBlur={syncFormFromJson}
                spellCheck={false}
              />
            </div>

            {/* Invoke button */}
            <button className="a2a-invoke-btn" onClick={handleInvoke} disabled={invoking}>
              {invoking ? <><Loader2 size={14} className="test-spinner" /> Sending...</> : <><Send size={14} /> Send Request</>}
            </button>
          </div>

          {/* Right: response viewer */}
          <div className="a2a-right">
            <div className="a2a-result-tabs">
              {['response', 'request', 'raw', 'card'].map(t => (
                <button
                  key={t}
                  className={`a2a-result-tab ${resultTab === t ? 'active' : ''}`}
                  onClick={() => setResultTab(t)}
                >
                  {t === 'response' ? 'Response' : t === 'request' ? 'Request' : t === 'raw' ? 'Raw JSON' : 'Agent Card'}
                </button>
              ))}
            </div>
            <div className="a2a-result-body">
              {resultTab === 'response' && (
                result ? (
                  result.error ? (
                    <div className="a2a-result-error"><AlertCircle size={14} /> {result.error}</div>
                  ) : (
                    <div className="a2a-result-content">
                      <div className="a2a-result-status">
                        <span className={`a2a-status-badge ${result.status >= 200 && result.status < 300 ? 'ok' : 'err'}`}>
                          HTTP {result.status}
                        </span>
                        <span className="a2a-result-time">{result.elapsedMs}ms</span>
                      </div>
                      {responseParts ? (
                        <div className="a2a-parts">
                          {responseParts.map((p, i) => (
                            <div key={i} className="a2a-part">
                              <span className="a2a-part-kind">{p.kind || 'text'}</span>
                              <pre className="a2a-part-text">{typeof p.text === 'string' ? p.text : JSON.stringify(p, null, 2)}</pre>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <pre className="a2a-result-json">{JSON.stringify(result.parsed, null, 2)}</pre>
                      )}
                    </div>
                  )
                ) : (
                  <div className="a2a-result-empty"><Send size={24} strokeWidth={1.2} /><p>Send a request to see the response</p></div>
                )
              )}
              {resultTab === 'request' && (
                result?.request ? (
                  <pre className="a2a-result-json">{JSON.stringify(result.request, null, 2)}</pre>
                ) : (
                  <div className="a2a-result-empty"><Code size={24} strokeWidth={1.2} /><p>No request sent yet</p></div>
                )
              )}
              {resultTab === 'raw' && (
                result?.raw ? (
                  <>
                    <div className="a2a-raw-label">Full server response</div>
                    <pre className="a2a-result-json a2a-raw">{(() => {
                      try { return JSON.stringify(JSON.parse(result.raw), null, 2) } catch { return result.raw }
                    })()}</pre>
                  </>
                ) : (
                  <div className="a2a-result-empty"><FileJson size={24} strokeWidth={1.2} /><p>No response data yet</p></div>
                )
              )}
              {resultTab === 'card' && (
                card ? (
                  <pre className="a2a-result-json">{JSON.stringify(card, null, 2)}</pre>
                ) : (
                  <div className="a2a-result-empty"><CreditCard size={24} strokeWidth={1.2} /><p>No agent card loaded</p></div>
                )
              )}
            </div>
          </div>
        </div>
      )}

      {!card && !cardLoading && !cardError && (
        <div className="test-empty">
          <Globe size={32} strokeWidth={1.2} style={{ color: '#475569' }} />
          <p>Enter an Agent Card URL and click <strong>Fetch</strong> to load the agent's capabilities and start testing.</p>
        </div>
      )}
    </div>
  )
}

/* ═══════════════════════ Main Panel with Tabs ═══════════════════════ */

const AgentTestPanel = ({ agents }) => {
  const [activeTab, setActiveTab] = useState('tracing')

  return (
    <div className="test-panel">
      <div className="test-header">
        <Zap size={18} style={{ color: '#f59e0b' }} />
        <div>
          <div className="test-title">Agent Test Console</div>
          <div className="test-subtitle">{activeTab === 'tracing' ? 'Submit a request and trace the full execution path' : 'Test A2A agents by sending JSON-RPC requests'}</div>
        </div>
        <div className="test-top-tabs">
          <button className={`test-top-tab ${activeTab === 'tracing' ? 'active' : ''}`} onClick={() => setActiveTab('tracing')}>
            <Play size={13} /> Tracing
          </button>
          <button className={`test-top-tab ${activeTab === 'tester' ? 'active' : ''}`} onClick={() => setActiveTab('tester')}>
            <Globe size={13} /> Tester
          </button>
        </div>
      </div>

      {activeTab === 'tracing' && <TracingTab agents={agents} />}
      {activeTab === 'tester' && <TesterTab />}
    </div>
  )
}

export default AgentTestPanel
