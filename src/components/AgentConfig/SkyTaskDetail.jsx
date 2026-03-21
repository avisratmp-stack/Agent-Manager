import React, { useState, useEffect } from 'react'
import {
  ArrowLeft, Copy, CheckCircle2, Circle, Clock, Play, User, Bot,
  ChevronDown, ChevronUp, AlertTriangle, SkipForward, Mail, Shield,
  Pencil, FileText, Workflow, Code, Terminal, Loader, Sparkles,
  FlaskConical, RotateCcw
} from 'lucide-react'

const PRIORITY_COLORS = {
  CRITICAL: { bg: '#fef2f2', color: '#dc2626' },
  HIGH: { bg: '#fff7ed', color: '#ea580c' },
  MEDIUM: { bg: '#fefce8', color: '#ca8a04' },
  LOW: { bg: '#f0fdf4', color: '#16a34a' },
}

const STEP_ICONS = {
  AUTO_DONE: { icon: CheckCircle2, color: '#16a34a' },
  AUTO_ACTIVE: { icon: Bot, color: '#2563eb' },
  AUTO_PENDING: { icon: Circle, color: '#cbd5e1' },
  MANUAL_DONE: { icon: CheckCircle2, color: '#16a34a' },
  MANUAL_ACTIVE: { icon: Pencil, color: '#ea580c' },
  MANUAL_PENDING: { icon: Circle, color: '#cbd5e1' },
  HYBRID_DONE: { icon: CheckCircle2, color: '#16a34a' },
  HYBRID_ACTIVE: { icon: Workflow, color: '#7c3aed' },
  HYBRID_PENDING: { icon: Circle, color: '#cbd5e1' },
}

function getStepMeta(step) {
  const base = step.type === 'HYBRID' ? 'HYBRID' : step.type === 'AUTO-AGENT' ? 'AUTO' : 'MANUAL'
  const state = step.status === 'DONE' ? 'DONE' : step.status === 'IN_PROGRESS' ? 'ACTIVE' : 'PENDING'
  return STEP_ICONS[`${base}_${state}`] || STEP_ICONS.AUTO_PENDING
}

const STEP_HANDLER_SUGGESTIONS = {
  'Validate Order Integrity': 'obs-troubleshooting-agent',
  'Edit Order & Review Conflicts': 'log-agent',
  'Notify Customer of Delay': 'servicenow-l1-agent',
  'Resubmit Provisioning': 'k8s-troubleshooting-agent',
  'Analyze Duplicate Charges': 'log-agent',
  'Apply Billing Correction': 'obs-troubleshooting-agent',
  'Check System Health': 'k8s-troubleshooting-agent',
  'Validate Entity Structure': 'obs-troubleshooting-agent',
  'Review & Fix Address Data': 'log-agent',
  'Retry CRM Update': 'obs-troubleshooting-agent',
  'Compare Catalog Entries': 'log-agent',
  'Analyze DLQ Messages': 'log-agent',
  'Execute Reprocess': 'k8s-troubleshooting-agent',
  'Detect Loop Pattern': 'log-agent',
  'Execute State Reset': 'k8s-troubleshooting-agent',
  'Validate Payment Data': 'obs-troubleshooting-agent',
  'Execute Payment Retry': 'obs-troubleshooting-agent',
  'Analyze Rejection Reason': 'log-agent',
  'Resubmit Port Request': 'obs-troubleshooting-agent',
}

export default function SkyTaskDetail({ task, onBack }) {
  const [expandedSteps, setExpandedSteps] = useState(() => {
    const map = {}
    task.steps.forEach(s => { map[s.id] = s.status === 'IN_PROGRESS' })
    return map
  })
  const [notes, setNotes] = useState({})
  const [copied, setCopied] = useState(false)
  const [stepStatuses, setStepStatuses] = useState(() => {
    const map = {}
    task.steps.forEach(s => { map[s.id] = s.status })
    return map
  })
  const [handlers, setHandlers] = useState([])
  const [selectedHandler, setSelectedHandler] = useState({})
  const [handlerCode, setHandlerCode] = useState({})
  const [editedCode, setEditedCode] = useState({})
  const [sandboxMode, setSandboxMode] = useState({})
  const [sandboxOutput, setSandboxOutput] = useState({})
  const [execState, setExecState] = useState({})

  useEffect(() => {
    fetch('/api/agent-handlers').then(r => r.json()).then(h => {
      setHandlers(h)
      const initial = {}
      task.steps.forEach(s => {
        const suggested = STEP_HANDLER_SUGGESTIONS[s.label]
        if (suggested && h.find(hh => hh.slug === suggested)) {
          initial[s.id] = suggested
        }
      })
      if (Object.keys(initial).length > 0) {
        setSelectedHandler(initial)
        Object.entries(initial).forEach(([stepId, slug]) => {
          fetch(`/api/agents/${slug}/handler`).then(r => r.json()).then(d => {
            setHandlerCode(prev => ({ ...prev, [stepId]: d.content }))
            setEditedCode(prev => ({ ...prev, [stepId]: d.content }))
          }).catch(() => {})
        })
      }
    }).catch(() => {})
  }, [])

  const loadHandler = (stepId, slug) => {
    setSelectedHandler(prev => ({ ...prev, [stepId]: slug }))
    setSandboxMode(prev => ({ ...prev, [stepId]: false }))
    setSandboxOutput(prev => ({ ...prev, [stepId]: null }))
    if (!slug) {
      setHandlerCode(prev => ({ ...prev, [stepId]: null }))
      setEditedCode(prev => ({ ...prev, [stepId]: null }))
      return
    }
    fetch(`/api/agents/${slug}/handler`).then(r => r.json()).then(d => {
      setHandlerCode(prev => ({ ...prev, [stepId]: d.content }))
      setEditedCode(prev => ({ ...prev, [stepId]: d.content }))
    }).catch(() => {})
  }

  const executeHandler = (stepId) => {
    setExecState(prev => ({ ...prev, [stepId]: 'running' }))
    setTimeout(() => {
      setExecState(prev => ({ ...prev, [stepId]: 'done' }))
      setTimeout(() => setExecState(prev => ({ ...prev, [stepId]: null })), 3000)
    }, 2000)
  }

  const executeSandbox = (stepId) => {
    setExecState(prev => ({ ...prev, [stepId]: 'running' }))
    setSandboxOutput(prev => ({ ...prev, [stepId]: null }))
    setTimeout(() => {
      const lines = (editedCode[stepId] || '').split('\n').length
      setSandboxOutput(prev => ({
        ...prev,
        [stepId]: [
          `[sandbox] Executing ${lines} lines of Python...`,
          `[sandbox] Agent: ${selectedHandler[stepId]}`,
          `[sandbox] ✓ Syntax OK`,
          `[sandbox] ✓ Execution completed — no errors`,
          `[sandbox] Result: { "status": "success", "sandbox": true }`,
        ]
      }))
      setExecState(prev => ({ ...prev, [stepId]: 'sandbox-done' }))
      setTimeout(() => setExecState(prev => ({ ...prev, [stepId]: null })), 5000)
    }, 2500)
  }

  const resetCode = (stepId) => {
    setEditedCode(prev => ({ ...prev, [stepId]: handlerCode[stepId] }))
    setSandboxOutput(prev => ({ ...prev, [stepId]: null }))
  }

  const toggleStep = (id) => setExpandedSteps(prev => ({ ...prev, [id]: !prev[id] }))

  const copySnippet = () => {
    navigator.clipboard.writeText(task.errorSnippet)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const markDone = (stepId) => {
    setStepStatuses(prev => {
      const updated = { ...prev, [stepId]: 'DONE' }
      const stepIds = task.steps.map(s => s.id)
      const idx = stepIds.indexOf(stepId)
      if (idx < stepIds.length - 1) {
        updated[stepIds[idx + 1]] = 'IN_PROGRESS'
      }
      return updated
    })
    setExpandedSteps(prev => {
      const updated = { ...prev, [stepId]: false }
      const stepIds = task.steps.map(s => s.id)
      const idx = stepIds.indexOf(stepId)
      if (idx < stepIds.length - 1) updated[stepIds[idx + 1]] = true
      return updated
    })
  }

  const pc = PRIORITY_COLORS[task.priority] || PRIORITY_COLORS.MEDIUM
  const totalSteps = task.steps.length
  const currentStepNum = task.steps.findIndex(s => stepStatuses[s.id] === 'IN_PROGRESS') + 1 || task.currentStep

  return (
    <div className="sky-detail">
      <div className="sky-detail-topbar">
        <button className="sky-detail-back" onClick={onBack}>
          <ArrowLeft size={16} /> Back to Tasks
        </button>
        <div className="sky-detail-breadcrumb">
          Sky &rsaquo; Fallouts &rsaquo; Ticket #{task.id} &rsaquo; Task Details
        </div>
        <div className="sky-detail-wf-badge">
          WF: {task.workflowName.toUpperCase()} — {task.status}
        </div>
      </div>

      <div className="sky-detail-layout">
        {/* LEFT — Ticket Info */}
        <div className="sky-detail-left">
          <div className="sky-detail-card">
            <div className="sky-ticket-header">
              <h2>Fallout Ticket #{task.id}</h2>
              <span className="sky-priority-pill" style={{ background: pc.bg, color: pc.color }}>
                {task.priority}
              </span>
            </div>

            <div className="sky-ticket-section">
              <label>SUMMARY</label>
              <p>{task.summary}</p>
            </div>

            <div className="sky-ticket-row">
              <div>
                <label>ACCOUNT</label>
                <strong>{task.account}</strong>
              </div>
              <div>
                <label>ORDER ID</label>
                <strong>{task.orderId}</strong>
              </div>
            </div>

            <div className="sky-ticket-section">
              <label>SLA DEADLINE</label>
              <div className="sky-sla-badge">
                <Clock size={14} />
                <span>Expires in {formatSla(task.slaDeadline)}</span>
              </div>
            </div>

            <div className="sky-ticket-section sky-ticket-details-grid">
              <label>DETAILS</label>
              <div className="sky-detail-row"><span>Created:</span><span>{task.created}</span></div>
              <div className="sky-detail-row"><span>Reporter:</span><span>{task.reporter}</span></div>
              <div className="sky-detail-row"><span>Assignee:</span><span>{task.assignee}</span></div>
            </div>

            <div className="sky-ticket-section">
              <div className="sky-snippet-header">
                <label>ERROR SNIPPET</label>
                <button className="sky-copy-btn" onClick={copySnippet}>
                  <Copy size={12} /> {copied ? 'Copied!' : 'COPY'}
                </button>
              </div>
              <pre className="sky-snippet">{task.errorSnippet}</pre>
            </div>

            {task.relatedTickets.length > 0 && (
              <div className="sky-ticket-section">
                <label>RELATED TICKETS</label>
                <div className="sky-related">
                  {task.relatedTickets.map(t => (
                    <span key={t} className="sky-related-chip">#{t}</span>
                  ))}
                </div>
              </div>
            )}

            <div className="sky-ticket-section">
              <label>HISTORY</label>
              <div className="sky-history">
                {task.history.map((h, i) => (
                  <div key={i} className={`sky-history-item ${h.active ? 'active' : ''}`}>
                    <span className="sky-history-dot" />
                    <span className="sky-history-date">{h.date}</span>
                    <span> — {h.text}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="sky-ticket-actions">
              <button className="sky-btn sky-btn-outline">View Full Ticket</button>
              <button className="sky-btn-link">Add Note</button>
            </div>
          </div>
        </div>

        {/* RIGHT — Workflow Steps */}
        <div className="sky-detail-right">
          <div className="sky-wf-header">
            <div>
              <h2>Workflow Steps — {task.workflowName}</h2>
              <p className="sky-wf-desc">{task.workflowDesc}</p>
            </div>
            <div className="sky-wf-controls">
              <button className="sky-btn sky-btn-outline">
                <ArrowLeft size={13} /> Return Ticket to Pool
              </button>
              <span className="sky-step-indicator">
                Step <strong>{currentStepNum}</strong> of {totalSteps}
              </span>
            </div>
          </div>

          <div className="sky-steps-list">
            {task.steps.map((step, idx) => {
              const status = stepStatuses[step.id] || step.status
              const meta = getStepMeta({ ...step, status })
              const Icon = meta.icon
              const expanded = expandedSteps[step.id]
              const isActive = status === 'IN_PROGRESS'
              const isDone = status === 'DONE'
              const isPending = status === 'PENDING'

              return (
                <div
                  key={step.id}
                  className={`sky-step ${isActive ? 'active' : ''} ${isDone ? 'done' : ''} ${isPending ? 'pending' : ''}`}
                >
                  <div className="sky-step-header" onClick={() => toggleStep(step.id)}>
                    <div className="sky-step-left">
                      <Icon size={20} color={meta.color} />
                      <span className={`sky-step-type-badge ${step.type === 'AUTO-AGENT' ? 'auto' : step.type === 'HYBRID' ? 'hybrid' : 'manual'}`}>
                        {step.type === 'AUTO-AGENT' ? <><Bot size={11} /> Auto</> : step.type === 'HYBRID' ? <><Workflow size={11} /> Hybrid</> : <><User size={11} /> Manual</>}
                      </span>
                      <span className="sky-step-label">{step.label}</span>
                      {step.skippable && <span className="sky-skippable-badge">SKIPPABLE</span>}
                    </div>
                    <div className="sky-step-right">
                      <span className={`sky-step-status sky-step-status-${status.toLowerCase().replace('_', '-')}`}>
                        {status.replace('_', ' ')}
                      </span>
                      {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </div>
                  </div>

                  {expanded && (
                    <div className="sky-step-body">
                      {(step.agentLog || (isActive && step.type === 'HYBRID') || step.type === 'AUTO-AGENT') && (
                        <div className="sky-agent-section">
                          <div className="sky-agent-bar">
                            <Bot size={14} /> Auto
                            {isActive && (step.type === 'HYBRID' || step.type === 'AUTO-AGENT') && (
                              <button className="sky-btn sky-btn-green sky-btn-sm">
                                <Play size={12} /> Run Agent
                              </button>
                            )}
                          </div>
                          {step.agentLog && (
                            <div className="sky-agent-console">
                              {step.agentLog.map((line, i) => (
                                <div key={i} className={`sky-console-line ${line.includes('PROPOSAL') ? 'highlight' : ''}`}>{line}</div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}

                      {step.manualReview && isActive && (
                        <div className="sky-manual-section">
                          <h4>MANUAL REVIEW</h4>
                          <div className="sky-review-box">
                            <span className="sky-review-type">{step.manualReview.type.replace(/_/g, ' ')}</span>
                            <div className="sky-review-values">
                              <span className="sky-val-from">{step.manualReview.fromValue}</span>
                              <span className="sky-val-arrow">→</span>
                              <span className="sky-val-to">{step.manualReview.toValue}</span>
                            </div>
                          </div>

                          <label className="sky-notes-label">Notes to Auditor</label>
                          <textarea
                            className="sky-notes-input"
                            placeholder={step.manualReview.notesPlaceholder}
                            value={notes[step.id] || ''}
                            onChange={e => setNotes(prev => ({ ...prev, [step.id]: e.target.value }))}
                            rows={3}
                          />

                          <div className="sky-review-actions">
                            <button className="sky-btn sky-btn-green">Approve Proposal</button>
                            <button className="sky-btn sky-btn-outline">Reject</button>
                            <button className="sky-btn sky-btn-outline">Edit</button>
                          </div>
                        </div>
                      )}

                      {isDone && !step.agentLog && (
                        <div className="sky-done-message">
                          <CheckCircle2 size={16} color="#16a34a" /> Step completed successfully.
                        </div>
                      )}

                      <div className="sky-python-section">
                        <div className="sky-python-bar">
                          <Code size={14} />
                          <span>Python Execution</span>
                          <select
                            className="sky-python-select"
                            value={selectedHandler[step.id] || ''}
                            onChange={e => loadHandler(step.id, e.target.value)}
                          >
                            <option value="">Select handler…</option>
                            {handlers.map(h => {
                              const isSuggested = STEP_HANDLER_SUGGESTIONS[step.label] === h.slug
                              return (
                                <option key={h.slug} value={h.slug}>
                                  {h.label}{isSuggested ? ' ★ Suggested' : ''}
                                </option>
                              )
                            })}
                          </select>
                          {selectedHandler[step.id] && STEP_HANDLER_SUGGESTIONS[step.label] === selectedHandler[step.id] && (
                            <span className="sky-suggested-badge"><Sparkles size={11} /> Suggested</span>
                          )}
                        </div>

                        {selectedHandler[step.id] && handlerCode[step.id] && (
                          <>
                            <div className="sky-python-toolbar">
                              <div className="sky-python-toolbar-left">
                                <button
                                  className={`sky-python-mode-btn ${!sandboxMode[step.id] ? 'active' : ''}`}
                                  onClick={() => setSandboxMode(prev => ({ ...prev, [step.id]: false }))}
                                >
                                  <Terminal size={12} /> Execute
                                </button>
                                <button
                                  className={`sky-python-mode-btn ${sandboxMode[step.id] ? 'active' : ''}`}
                                  onClick={() => setSandboxMode(prev => ({ ...prev, [step.id]: true }))}
                                >
                                  <FlaskConical size={12} /> Sandbox
                                </button>
                              </div>
                              <div className="sky-python-toolbar-right">
                                {sandboxMode[step.id] && editedCode[step.id] !== handlerCode[step.id] && (
                                  <button className="sky-btn sky-btn-outline sky-btn-xs" onClick={() => resetCode(step.id)}>
                                    <RotateCcw size={11} /> Reset
                                  </button>
                                )}
                                {!sandboxMode[step.id] ? (
                                  <button
                                    className={`sky-btn sky-btn-sm ${execState[step.id] === 'running' ? 'sky-btn-outline' : 'sky-btn-green'}`}
                                    onClick={() => executeHandler(step.id)}
                                    disabled={execState[step.id] === 'running'}
                                  >
                                    {execState[step.id] === 'running' ? <><Loader size={12} className="sky-spin" /> Running…</> :
                                     execState[step.id] === 'done' ? <><CheckCircle2 size={12} /> Done</> :
                                     <><Play size={12} /> Run</>}
                                  </button>
                                ) : (
                                  <button
                                    className={`sky-btn sky-btn-sm ${execState[step.id] === 'running' ? 'sky-btn-outline' : 'sky-btn-sandbox'}`}
                                    onClick={() => executeSandbox(step.id)}
                                    disabled={execState[step.id] === 'running'}
                                  >
                                    {execState[step.id] === 'running' ? <><Loader size={12} className="sky-spin" /> Running…</> :
                                     execState[step.id] === 'sandbox-done' ? <><CheckCircle2 size={12} /> Done</> :
                                     <><FlaskConical size={12} /> Run in Sandbox</>}
                                  </button>
                                )}
                              </div>
                            </div>

                            {sandboxMode[step.id] ? (
                              <textarea
                                className="sky-python-editor"
                                value={editedCode[step.id] || ''}
                                onChange={e => setEditedCode(prev => ({ ...prev, [step.id]: e.target.value }))}
                                spellCheck={false}
                              />
                            ) : (
                              <pre className="sky-python-code">{handlerCode[step.id]}</pre>
                            )}
                          </>
                        )}

                        {execState[step.id] === 'done' && (
                          <div className="sky-python-output">
                            <div className="sky-console-line highlight">[OK] Handler executed — result: {`{ "status": "completed", "agent": "${selectedHandler[step.id]}" }`}</div>
                          </div>
                        )}
                        {sandboxOutput[step.id] && (
                          <div className="sky-python-output sky-sandbox-output">
                            {sandboxOutput[step.id].map((line, i) => (
                              <div key={i} className={`sky-console-line ${line.includes('✓') ? 'highlight' : ''}`}>{line}</div>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="sky-step-footer">
                        <button className="sky-btn sky-btn-outline sky-btn-sm">Save Draft</button>
                        {isActive && (
                          <button className="sky-btn sky-btn-red sky-btn-sm" onClick={() => markDone(step.id)}>
                            Mark as Done
                          </button>
                        )}
                        {step.skippable && isPending && (
                          <button className="sky-btn sky-btn-outline sky-btn-sm">
                            <SkipForward size={12} /> Skip
                          </button>
                        )}
                        {isPending && !step.skippable && (
                          <span className="sky-na-label">N/A</span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>

      <div className="sky-detail-footer">
        <span>© 2026 Sky Systems Inc.  Version 4.12.0-stable</span>
        <div className="sky-footer-links">
          <a href="#">Help Center</a>
          <a href="#">Workflow Docs</a>
          <a href="#">API Status</a>
        </div>
      </div>
    </div>
  )
}

function formatSla(deadline) {
  const diff = new Date(deadline) - new Date()
  if (diff <= 0) return 'Expired'
  const h = Math.floor(diff / 3600000)
  const m = Math.floor((diff % 3600000) / 60000)
  if (h > 24) return `${Math.floor(h / 24)}d ${h % 24}h`
  return `${h}h ${m}m`
}
