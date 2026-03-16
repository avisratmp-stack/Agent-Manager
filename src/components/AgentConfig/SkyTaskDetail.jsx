import React, { useState } from 'react'
import {
  ArrowLeft, Copy, CheckCircle2, Circle, Clock, Play, User, Bot,
  ChevronDown, ChevronUp, AlertTriangle, SkipForward, Mail, Shield,
  Pencil, FileText
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
}

function getStepMeta(step) {
  const base = step.type === 'AUTO-AGENT' ? 'AUTO' : 'MANUAL'
  const state = step.status === 'DONE' ? 'DONE' : step.status === 'IN_PROGRESS' ? 'ACTIVE' : 'PENDING'
  return STEP_ICONS[`${base}_${state}`] || STEP_ICONS.AUTO_PENDING
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
                      <span className={`sky-step-type-badge ${step.type === 'AUTO-AGENT' ? 'auto' : 'manual'}`}>
                        {step.type === 'AUTO-AGENT' ? <><Bot size={11} /> AUTO-AGENT</> : <><User size={11} /> MANUAL</>}
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
                      {(step.agentLog || (isActive && step.hasAgent)) && (
                        <div className="sky-agent-section">
                          <div className="sky-agent-bar">
                            <Bot size={14} /> AUTO-AGENT
                            {isActive && step.hasAgent && (
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
