import React, { useState, useEffect, useMemo, useCallback } from 'react'
import {
  ReactFlow, Background, MiniMap, Handle, Position, BaseEdge,
  useNodesState, useEdgesState, EdgeLabelRenderer, getSmoothStepPath
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import {
  ArrowLeft, Copy, CheckCircle2, Circle, Clock, Play, User, Bot,
  ChevronDown, ChevronUp, AlertTriangle, SkipForward, Pencil,
  Workflow, Code, Terminal, Loader, X
} from 'lucide-react'

const PRIORITY_COLORS = {
  CRITICAL: { bg: '#fef2f2', color: '#dc2626' },
  HIGH: { bg: '#fff7ed', color: '#ea580c' },
  MEDIUM: { bg: '#fefce8', color: '#ca8a04' },
  LOW: { bg: '#f0fdf4', color: '#16a34a' },
}

const STATUS_STYLE = {
  DONE: { bg: '#dcfce7', border: '#22c55e', color: '#15803d', label: 'Done' },
  IN_PROGRESS: { bg: '#dbeafe', border: '#3b82f6', color: '#1d4ed8', label: 'In Progress' },
  PENDING: { bg: '#fafafa', border: '#e5e5e5', color: '#b0b0b0', label: 'Pending' },
}

const TYPE_META = {
  'AUTO-AGENT': { icon: Bot, label: 'Auto', cls: 'auto', color: '#2563eb' },
  'HYBRID': { icon: Workflow, label: 'Hybrid', cls: 'hybrid', color: '#7c3aed' },
  'MANUAL': { icon: User, label: 'Manual', cls: 'manual', color: '#ea580c' },
}

function StepNode({ data }) {
  const ss = STATUS_STYLE[data.status] || STATUS_STYLE.PENDING
  const tm = TYPE_META[data.type] || TYPE_META.MANUAL
  const TypeIcon = tm.icon
  const isActive = data.status === 'IN_PROGRESS'
  const isDone = data.status === 'DONE'

  return (
    <div
      className={`td2-node ${isActive ? 'td2-node-active' : ''} ${isDone ? 'td2-node-done' : ''}`}
      style={{ borderColor: ss.border, background: ss.bg }}
    >
      <Handle type="target" position={Position.Top} className="td2-handle" />
      <div className="td2-node-header">
        <span className="td2-node-step">Step {data.stepNum}</span>
        <span className={`td2-node-type td2-type-${tm.cls}`}>
          <TypeIcon size={16} /> {tm.label}
        </span>
      </div>
      <div className="td2-node-label">{data.label}</div>
      <div className="td2-node-footer">
        {isDone && <CheckCircle2 size={13} color="#16a34a" />}
        {isActive && <Play size={13} color="#2563eb" />}
        {!isDone && !isActive && <Circle size={13} color="#cbd5e1" />}
        <span className="td2-node-status" style={{ color: ss.color }}>{ss.label}</span>
      </div>
      <Handle type="source" position={Position.Bottom} className="td2-handle" />
    </div>
  )
}

function LabeledEdge(props) {
  const { sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition, style, markerEnd, data } = props
  const [edgePath, labelX, labelY] = getSmoothStepPath({ sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition })
  return (
    <>
      <BaseEdge path={edgePath} markerEnd={markerEnd} style={{ ...style, strokeWidth: 2.5 }} />
      {data?.label && (
        <EdgeLabelRenderer>
          <div
            className="td2-edge-label"
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
              pointerEvents: 'all',
            }}
          >
            {data.label}
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  )
}

const nodeTypes = { stepNode: StepNode }
const edgeTypes = { labeled: LabeledEdge }

function normalizeSteps(task) {
  const idx = (task.currentStep || 1) - 1
  return task.steps.map((s, i) => {
    if (i < idx) return { ...s, status: 'DONE' }
    if (i === idx) return { ...s, status: 'IN_PROGRESS' }
    return { ...s, status: 'PENDING' }
  })
}

export default function TicketDetails2() {
  const [task, setTask] = useState(null)
  const [selectedStep, setSelectedStep] = useState(null)
  const [notes, setNotes] = useState({})
  const [copied, setCopied] = useState(false)
  const [handlers, setHandlers] = useState([])
  const [selectedHandler, setSelectedHandler] = useState({})
  const [handlerCode, setHandlerCode] = useState({})
  const [execState, setExecState] = useState({})

  useEffect(() => {
    fetch('/api/sky-tasks')
      .then(r => r.json())
      .then(data => {
        const list = data.tasks || data
        const t = list.find(t => t.id === '87342')
        if (t) {
          setTask({ ...t, steps: normalizeSteps(t) })
        }
      })
      .catch(() => {
        import('../../config/common/sky-tasks.json').then(m => {
          const t = m.default.tasks.find(t => t.id === '87342')
          if (t) setTask({ ...t, steps: normalizeSteps(t) })
        })
      })
    fetch('/api/agent-handlers').then(r => r.json()).then(setHandlers).catch(() => {})
  }, [])

  const { flowNodes, flowEdges } = useMemo(() => {
    if (!task) return { flowNodes: [], flowEdges: [] }
    const NODE_W = 290
    const NODE_H = 120
    const GAP_Y = 70
    const GAP_X = 60
    const startX = 60
    const startY = 40

    // Steps 2 & 3 are parallel (side by side after step 1, merging into step 4)
    const PARALLEL = [2, 3]
    let curY = startY
    const positions = {}

    task.steps.forEach((step, i) => {
      if (PARALLEL.includes(step.id)) {
        const isLeft = step.id === PARALLEL[0]
        positions[step.id] = {
          x: isLeft ? startX : startX + NODE_W + GAP_X,
          y: curY,
        }
        if (!isLeft) curY += NODE_H + GAP_Y
      } else {
        const centerX = startX + (NODE_W + GAP_X) / 2 - NODE_W / 2
        positions[step.id] = { x: centerX, y: curY }
        curY += NODE_H + GAP_Y
      }
    })

    const fNodes = task.steps.map((step, i) => ({
      id: `step-${step.id}`,
      type: 'stepNode',
      position: positions[step.id],
      draggable: false,
      data: { ...step, stepNum: i + 1 },
    }))

    const edgeStyle = (step) => {
      const isDone = step.status === 'DONE'
      return {
        stroke: isDone ? '#22c55e' : step.status === 'IN_PROGRESS' ? '#3b82f6' : '#d4d4d4',
        strokeWidth: 2.5,
      }
    }

    const fEdges = []
    const step1 = task.steps[0]
    const step2 = task.steps[1]
    const step3 = task.steps[2]
    // Fork: Step 1 -> Step 2 (conflict found), Step 1 -> Step 3 (no conflict)
    fEdges.push({
      id: 'e-1-2', source: 'step-1', target: 'step-2', type: 'labeled',
      animated: step1.status === 'IN_PROGRESS', style: edgeStyle(step1),
      data: { label: 'Conflict found', animated: step1.status === 'IN_PROGRESS' },
    })
    fEdges.push({
      id: 'e-1-3', source: 'step-1', target: 'step-3', type: 'labeled',
      animated: step1.status === 'IN_PROGRESS', style: edgeStyle(step1),
      data: { label: 'No conflict', animated: step1.status === 'IN_PROGRESS' },
    })
    // Merge: Step 2 -> Step 4, Step 3 -> Step 4
    fEdges.push({
      id: 'e-2-4', source: 'step-2', target: 'step-4', type: 'labeled',
      animated: step2.status === 'IN_PROGRESS', style: edgeStyle(step2),
      data: { animated: step2.status === 'IN_PROGRESS' },
    })
    fEdges.push({
      id: 'e-3-4', source: 'step-3', target: 'step-4', type: 'labeled',
      animated: step3.status === 'IN_PROGRESS', style: edgeStyle(step3),
      data: { animated: step3.status === 'IN_PROGRESS' },
    })

    return { flowNodes: fNodes, flowEdges: fEdges }
  }, [task])

  const [nodes, setNodes, onNodesChange] = useNodesState(flowNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(flowEdges)

  useEffect(() => {
    setNodes(flowNodes)
    setEdges(flowEdges)
  }, [flowNodes, flowEdges, setNodes, setEdges])

  const onNodeClick = useCallback((_, node) => {
    if (!task) return
    const step = task.steps.find(s => `step-${s.id}` === node.id)
    if (step) setSelectedStep(step)
  }, [task])

  const loadHandler = (stepId, slug) => {
    setSelectedHandler(prev => ({ ...prev, [stepId]: slug }))
    if (!slug) { setHandlerCode(prev => ({ ...prev, [stepId]: null })); return }
    fetch(`/api/agents/${slug}/handler`).then(r => r.json()).then(d => {
      setHandlerCode(prev => ({ ...prev, [stepId]: d.content }))
    }).catch(() => {})
  }

  const executeHandler = (stepId) => {
    setExecState(prev => ({ ...prev, [stepId]: 'running' }))
    setTimeout(() => {
      setExecState(prev => ({ ...prev, [stepId]: 'done' }))
      setTimeout(() => setExecState(prev => ({ ...prev, [stepId]: null })), 3000)
    }, 2000)
  }

  const copySnippet = () => {
    if (!task) return
    navigator.clipboard.writeText(task.errorSnippet)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (!task) {
    return <div className="td2-loading"><Loader size={20} className="sky-spin" /> Loading ticket...</div>
  }

  const pc = PRIORITY_COLORS[task.priority] || PRIORITY_COLORS.MEDIUM
  const totalSteps = task.steps.length
  const currentStepNum = task.steps.findIndex(s => s.status === 'IN_PROGRESS') + 1 || task.currentStep

  return (
    <div className="td2-page">
      <div className="td2-topbar">
        <div className="td2-breadcrumb">
          Sky &rsaquo; Fallouts &rsaquo; Ticket #{task.id} &rsaquo; Workflow View
        </div>
        <div className="td2-wf-badge">
          WF: {task.workflowName.toUpperCase()} — Step {currentStepNum}/{totalSteps}
        </div>
      </div>

      <div className="td2-layout">
        {/* LEFT — Ticket Info */}
        <div className="td2-left">
          <div className="td2-card">
            <div className="td2-ticket-header">
              <h2>Fallout Ticket #{task.id}</h2>
              <span className="sky-priority-pill" style={{ background: pc.bg, color: pc.color }}>
                {task.priority}
              </span>
            </div>

            <div className="td2-section">
              <label>SUMMARY</label>
              <p>{task.summary}</p>
            </div>

            <div className="td2-row">
              <div><label>ACCOUNT</label><strong>{task.account}</strong></div>
              <div><label>ORDER ID</label><strong>{task.orderId}</strong></div>
            </div>

            <div className="td2-section">
              <label>SLA DEADLINE</label>
              <div className="sky-sla-badge"><Clock size={14} /><span>Expires in {formatSla(task.slaDeadline)}</span></div>
            </div>

            <div className="td2-section">
              <div className="sky-snippet-header">
                <label>ERROR SNIPPET</label>
                <button className="sky-copy-btn" onClick={copySnippet}>
                  <Copy size={12} /> {copied ? 'Copied!' : 'COPY'}
                </button>
              </div>
              <pre className="sky-snippet">{task.errorSnippet}</pre>
            </div>

            {task.relatedTickets.length > 0 && (
              <div className="td2-section">
                <label>RELATED TICKETS</label>
                <div className="sky-related">
                  {task.relatedTickets.map(t => (
                    <span key={t} className="sky-related-chip">#{t}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT — React Flow Workflow */}
        <div className="td2-right">
          <div className="td2-flow-container">
            <ReactFlow
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onNodeClick={onNodeClick}
              nodeTypes={nodeTypes}
              edgeTypes={edgeTypes}
              fitView
              fitViewOptions={{ padding: 0.15 }}
              proOptions={{ hideAttribution: true }}
              nodesDraggable={false}
              nodesConnectable={false}
              elementsSelectable={true}
              zoomOnScroll={false}
              zoomOnPinch={false}
              zoomOnDoubleClick={false}
              preventScrolling={false}
              minZoom={1}
              maxZoom={1}
            >
              <Background color="#e2e8f0" gap={20} size={1} />
              <MiniMap
                nodeColor={node => {
                  const s = node.data?.status
                  if (s === 'DONE') return '#86efac'
                  if (s === 'IN_PROGRESS') return '#93c5fd'
                  return '#e2e8f0'
                }}
                maskColor="rgba(0,0,0,0.08)"
                style={{ bottom: 10, right: 10 }}
              />
            </ReactFlow>
          </div>
        </div>
      </div>

      {/* Step Edit Drawer */}
      {selectedStep && (
        <div className="td2-drawer-overlay" onClick={() => setSelectedStep(null)}>
          <div className="td2-drawer" onClick={e => e.stopPropagation()}>
            <div className="td2-drawer-header">
              <h3>Step {task.steps.indexOf(selectedStep) + 1}: {selectedStep.label}</h3>
              <button className="td2-drawer-close" onClick={() => setSelectedStep(null)}><X size={18} /></button>
            </div>
            <div className="td2-drawer-body">
              {renderStepCard(selectedStep, {
                notes, setNotes, handlers, selectedHandler, handlerCode,
                execState, loadHandler, executeHandler
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function renderStepCard(step, ctx) {
  const ss = STATUS_STYLE[step.status] || STATUS_STYLE.PENDING
  const tm = TYPE_META[step.type] || TYPE_META.MANUAL
  const TypeIcon = tm.icon
  const isActive = step.status === 'IN_PROGRESS'
  const isDone = step.status === 'DONE'

  return (
    <div className="td2-step-card">
      <div className="td2-step-card-top">
        <span className={`sky-step-type-badge ${tm.cls}`}>
          <TypeIcon size={12} /> {tm.label}
        </span>
        <span className="td2-step-card-status" style={{ color: ss.color, background: ss.bg, borderColor: ss.border }}>
          {isDone && <CheckCircle2 size={13} />}
          {isActive && <Play size={13} />}
          {!isDone && !isActive && <Circle size={13} />}
          {ss.label}
        </span>
      </div>

      {(step.agentLog || (isActive && (step.type === 'HYBRID' || step.type === 'AUTO-AGENT'))) && (
        <div className="sky-agent-section">
          <div className="sky-agent-bar">
            <Bot size={14} /> Auto
            {isActive && (step.type === 'HYBRID' || step.type === 'AUTO-AGENT') && (
              <button className="sky-btn sky-btn-green sky-btn-sm"><Play size={12} /> Run Agent</button>
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
            value={ctx.notes[step.id] || ''}
            onChange={e => ctx.setNotes(prev => ({ ...prev, [step.id]: e.target.value }))}
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
            value={ctx.selectedHandler[step.id] || ''}
            onChange={e => ctx.loadHandler(step.id, e.target.value)}
          >
            <option value="">Select handler…</option>
            {ctx.handlers.map(h => (
              <option key={h.slug} value={h.slug}>{h.label}</option>
            ))}
          </select>
          {ctx.selectedHandler[step.id] && (
            <button
              className={`sky-btn sky-btn-sm ${ctx.execState[step.id] === 'running' ? 'sky-btn-outline' : 'sky-btn-green'}`}
              onClick={() => ctx.executeHandler(step.id)}
              disabled={ctx.execState[step.id] === 'running'}
            >
              {ctx.execState[step.id] === 'running' ? <><Loader size={12} className="sky-spin" /> Running…</> :
               ctx.execState[step.id] === 'done' ? <><CheckCircle2 size={12} /> Done</> :
               <><Terminal size={12} /> Execute</>}
            </button>
          )}
        </div>
        {ctx.handlerCode[step.id] && (
          <pre className="sky-python-code">{ctx.handlerCode[step.id]}</pre>
        )}
        {ctx.execState[step.id] === 'done' && (
          <div className="sky-python-output">
            <div className="sky-console-line highlight">[OK] Handler executed — result: {`{ "status": "completed", "agent": "${ctx.selectedHandler[step.id]}" }`}</div>
          </div>
        )}
      </div>

      <div className="sky-step-footer">
        <button className="sky-btn sky-btn-outline sky-btn-sm">Save Draft</button>
        {isActive && <button className="sky-btn sky-btn-red sky-btn-sm">Mark as Done</button>}
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
