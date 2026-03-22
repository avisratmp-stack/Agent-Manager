import React, { useState, useEffect, useMemo, useCallback } from 'react'
import {
  ReactFlow, Background, Handle, Position, BaseEdge,
  useNodesState, useEdgesState, EdgeLabelRenderer, getSmoothStepPath
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import {
  ArrowLeft, Copy, CheckCircle2, Circle, Clock, Play, User, Bot,
  ChevronDown, ChevronUp, ChevronRight, AlertTriangle, SkipForward, Pencil,
  Workflow, Code, Terminal, Loader, X, Sparkles, FlaskConical, RotateCcw
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
      className={`td2-node ${isActive ? 'td2-node-active' : ''} ${isDone ? 'td2-node-done' : ''} ${data.selected ? 'td2-node-selected' : ''}`}
      style={{ borderColor: ss.border, background: ss.bg }}
    >
      <Handle type="target" position={Position.Top} className="td2-handle" />
      <div className="td2-node-header">
        <span className="td2-node-step">Step {data.stepNum}</span>
        <span className={`td2-node-type td2-type-${tm.cls}`}>
          <TypeIcon size={12} /> {tm.label}
        </span>
      </div>
      <div className="td2-node-label">{data.label}</div>
      {data.description && <div className="td2-node-desc">{data.description}</div>}
      <div className="td2-node-footer">
        {isDone && <CheckCircle2 size={11} color="#22c55e" />}
        {isActive && <Play size={11} color="#2563eb" />}
        {!isDone && !isActive && <Circle size={11} color="#cbd5e1" />}
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

const STEP_HANDLER_SUGGESTIONS = {
  'Validate Order Integrity': 'obs-troubleshooting-agent',
  'Edit Order & Review Conflicts': 'log-agent',
  'Notify Customer of Delay': 'servicenow-l1-agent',
  'Resubmit Provisioning': 'k8s-troubleshooting-agent',
}

const STEP_AGENT_CARDS = {
  'Validate Order Integrity': {
    agents: [{ name: 'Triage Agent', role: 'Classifier' }, { name: 'Order Validator', role: 'Checker' }],
    result: 'Order validated — Having issue with attribute deliveryDate (expected 2026-03-01, got 2026-02-15)',
    resultType: 'warning',
  },
  'Analyze Duplicate Charges': {
    agents: [{ name: 'Billing Analyzer', role: 'Detector' }],
    result: 'Duplicate charge detected — Same period billed twice for Jan 2026 ($49.99)',
    resultType: 'warning',
  },
  'Apply Billing Correction': {
    agents: [{ name: 'Billing Corrector', role: 'Resolver' }, { name: 'Audit Trail Agent', role: 'Logger' }],
    result: 'Credit note CN-20260220-001 issued — $49.99 refunded to customer account',
    resultType: 'success',
  },
  'Check System Health': {
    agents: [{ name: 'K8s Health Agent', role: 'Monitor' }],
    result: 'Downstream VoLTE service timeout — Network latency spike detected (avg 1200ms vs baseline 80ms)',
    resultType: 'warning',
  },
  'Re-trigger Provisioning': {
    agents: [{ name: 'Provisioning Agent', role: 'Executor' }],
    result: 'Provisioning request re-submitted — Awaiting downstream confirmation',
    resultType: 'success',
  },
  'Validate Service Active': {
    agents: [{ name: 'Service Monitor', role: 'Validator' }],
    result: 'Service activation confirmed — VoLTE active on subscriber line',
    resultType: 'success',
  },
  'Validate Entity Structure': {
    agents: [{ name: 'CRM Validator', role: 'Schema Check' }],
    result: 'Entity validation failed — street_line_2 exceeds max length (73 > 50 chars)',
    resultType: 'error',
  },
  'Retry CRM Update': {
    agents: [{ name: 'CRM Update Agent', role: 'Executor' }, { name: 'Data Integrity Agent', role: 'Verifier' }],
    result: 'CRM entity updated successfully — Address fields corrected and synced',
    resultType: 'success',
  },
  'Compare Catalog Entries': {
    agents: [{ name: 'Catalog Sync Agent', role: 'Comparator' }],
    result: 'Price mismatch found — Local $29.99 vs upstream $24.99 for offer OFR-8820',
    resultType: 'warning',
  },
  'Analyze DLQ Messages': {
    agents: [{ name: 'DLQ Analyzer', role: 'Classifier' }, { name: 'Log Agent', role: 'Inspector' }],
    result: 'DLQ classified — 12,340 retryable | 2,102 fixable | 60 poison pills',
    resultType: 'warning',
  },
  'Execute Reprocess': {
    agents: [{ name: 'DLQ Reprocessor', role: 'Executor' }],
    result: 'Reprocessing complete — 14,442 messages drained, 60 discarded',
    resultType: 'success',
  },
  'Detect Loop Pattern': {
    agents: [{ name: 'Loop Detector', role: 'Analyzer' }, { name: 'Log Agent', role: 'Tracer' }],
    result: 'Activation loop identified — 47 retry cycles, root cause: config flag stuck to false',
    resultType: 'error',
  },
  'Execute State Reset': {
    agents: [{ name: 'State Reset Agent', role: 'Executor' }],
    result: 'State reset applied — activation_flag=true, retry counter cleared',
    resultType: 'success',
  },
  'Validate Payment Data': {
    agents: [{ name: 'Payment Validator', role: 'Checker' }],
    result: 'Token expired (26h > 24h max) — Card **4582 requires re-tokenization',
    resultType: 'warning',
  },
  'Execute Payment Retry': {
    agents: [{ name: 'Payment Gateway Agent', role: 'Executor' }, { name: 'Fraud Check Agent', role: 'Validator' }],
    result: 'Payment authorized — $89.99 charged successfully with new token',
    resultType: 'success',
  },
  'Analyze Rejection Reason': {
    agents: [{ name: 'Port Analyzer', role: 'Investigator' }],
    result: 'Donor rejection — Active contract with Carrier-B prevents porting',
    resultType: 'warning',
  },
  'Resubmit Port Request': {
    agents: [{ name: 'Port Executor', role: 'Submitter' }],
    result: 'Port request re-submitted — Awaiting donor acknowledgment',
    resultType: 'success',
  },
  'Identify Conflicting Reservations': {
    agents: [{ name: 'Inventory Agent', role: 'Detector' }, { name: 'Conflict Resolver', role: 'Analyzer' }],
    result: 'Conflict identified — RES-44021 double-booked for ORD-7744-GH and ORD-7740-AB',
    resultType: 'warning',
  },
  'Reprocess / Retrigger / Re-run': {
    agents: [{ name: 'Reprocessor Agent', role: 'Executor' }],
    result: 'ErrorItem marked as Ready to Recycle — reprocessing queued successfully',
    resultType: 'success',
  },
  'Cancel order': {
    agents: [{ name: 'Order Cancellation Agent', role: 'Executor' }],
    result: 'Order cancellation request submitted — awaiting confirmation',
    resultType: 'success',
  },
  'Handle cancel failure': {
    agents: [{ name: 'Order Cancellation Agent', role: 'Executor' }, { name: 'Escalation Agent', role: 'Router' }],
    result: 'Cancel failed — PONR reached, escalated to operations team',
    resultType: 'warning',
  },
  'Agent / Automated': {
    agents: [{ name: 'Automation Agent', role: 'Executor' }],
    result: 'Automated action executed successfully',
    resultType: 'success',
  },
  'Click UI action': {
    agents: [{ name: 'RPA Agent', role: 'UI Automation' }],
    result: 'UI action completed via automated click sequence',
    resultType: 'success',
  },
  'Complete without activity / Close ticket': {
    agents: [{ name: 'Ticket Closer Agent', role: 'Finalizer' }],
    result: 'Ticket closed — no further action required',
    resultType: 'success',
  },
  'Complete without activity': {
    agents: [{ name: 'Ticket Closer Agent', role: 'Finalizer' }],
    result: 'Task completed without activity — issue resolved by operations',
    resultType: 'success',
  },
}

function AutoAgentCards({ step }) {
  const cardData = STEP_AGENT_CARDS[step.label]
  if (!cardData) return null
  const { agents: agentList, result, resultType } = cardData
  const isDone = step.status === 'DONE'
  const isActive = step.status === 'IN_PROGRESS'
  const ResultIcon = resultType === 'success' ? CheckCircle2 : AlertTriangle

  return (
    <div className="sky-auto-agents">
      <div className="sky-auto-agents-handled">
        <Bot size={14} />
        <span>{isDone ? 'Handled by ' : 'To be Handled by '}</span>
        <span className="sky-agent-name-badge">{agentList[0].name}</span>
        {agentList.length > 1 && (
          <>
            <span className="sky-auto-agents-arrow">&#8594;</span>
            <span className="sky-agent-name-badge">{agentList[1].name}</span>
          </>
        )}
      </div>
      {(isDone || isActive) && (
        <div className={`sky-auto-agents-result ${resultType || ''}`}>
          <span className="sky-auto-agents-result-icon"><ResultIcon size={14} /></span>
          <span className="sky-auto-agents-result-text">{result}</span>
        </div>
      )}
    </div>
  )
}

const STEP_MANUAL_FORMS = {
  'Notify Customer of Delay': [
    { type: 'select', label: 'Channel', options: ['Email', 'SMS', 'Phone Call'] },
    { type: 'action', label: 'Send Notification', variant: 'blue' },
  ],
  'Final Approval Fix': [
    { type: 'select', label: 'Decision', options: ['Approve', 'Reject', 'Escalate'] },
  ],
  'Approve Credit Note': [
    { type: 'input', label: 'Credit Amount', value: '$49.99', readonly: true },
    { type: 'action', label: 'Approve Credit', variant: 'green' },
  ],
  'Verify Configuration': [
    { type: 'input', label: 'Config Parameter', placeholder: 'Enter parameter key…' },
    { type: 'action', label: 'Validate', variant: 'blue' },
  ],
  'Approve Price Update': [
    { type: 'input', label: 'New Price', value: '$24.99', readonly: true },
    { type: 'action', label: 'Approve Update', variant: 'green' },
  ],
  'Contact Donor Network': [
    { type: 'select', label: 'Contact Method', options: ['Portal API', 'Email', 'Phone'] },
    { type: 'input', label: 'Reference ID', placeholder: 'PORT-REF-…' },
  ],
  'Review Offer Configuration': [
    { type: 'input', label: 'Bundle ID', value: 'BDL-8820', readonly: true },
    { type: 'action', label: 'Open Catalog', variant: 'blue' },
  ],
  'Apply Promotional Discount Fix': [
    { type: 'input', label: 'Discount %', placeholder: '25' },
    { type: 'action', label: 'Apply Discount', variant: 'green' },
  ],
  'Validate Checkout Flow': [
    { type: 'input', label: 'Test Order ID', placeholder: 'ORD-TEST-…' },
    { type: 'action', label: 'Run Validation', variant: 'blue' },
  ],
  'Verify Address Format': [
    { type: 'input', label: 'Address Preview', value: '123 Enterprise Blvd, Suite 400', readonly: true },
    { type: 'action', label: 'Validate Format', variant: 'blue' },
  ],
  'Correct Postal Code': [
    { type: 'input', label: 'Postal Code', placeholder: 'Enter 5-digit code…' },
    { type: 'action', label: 'Apply Fix', variant: 'green' },
  ],
  'Re-run Service Qualification': [
    { type: 'select', label: 'Region', options: ['US-East', 'US-West', 'EU', 'APAC'] },
    { type: 'action', label: 'Run SQ Engine', variant: 'green' },
  ],
  'Review Overlapping Windows': [
    { type: 'input', label: 'Window A', value: '02:00–04:00 UTC', readonly: true },
    { type: 'input', label: 'Window B', value: '03:00–05:00 UTC', readonly: true },
  ],
  'Reschedule Change Request': [
    { type: 'input', label: 'New Window', placeholder: 'e.g. 05:00–07:00 UTC' },
    { type: 'action', label: 'Reschedule', variant: 'blue' },
  ],
  'Confirm Updated Schedule': [
    { type: 'action', label: 'Confirm Schedule', variant: 'green' },
  ],
  'Investigate Tax Engine Timeout': [
    { type: 'input', label: 'Timeout (ms)', value: '30000', readonly: true },
    { type: 'action', label: 'View Engine Logs', variant: 'blue' },
  ],
  'Adjust Batch Size or Timeout': [
    { type: 'input', label: 'Batch Size', placeholder: '100' },
    { type: 'input', label: 'Timeout (ms)', placeholder: '60000' },
  ],
  'Re-trigger Bill Run': [
    { type: 'input', label: 'Batch ID', value: 'BATCH-ENT-2026-02', readonly: true },
    { type: 'action', label: 'Trigger Bill Run', variant: 'green' },
  ],
  'Validate Invoices Generated': [
    { type: 'input', label: 'Expected Count', value: '342', readonly: true },
    { type: 'action', label: 'Verify Invoices', variant: 'blue' },
  ],
  'Review Certificate Status': [
    { type: 'input', label: 'CN', value: 'api-gw.prod.tmo.amdocs.com', readonly: true },
    { type: 'action', label: 'Check Expiry', variant: 'blue' },
  ],
  'Generate & Sign New Certificate': [
    { type: 'select', label: 'Key Size', options: ['2048', '4096'] },
    { type: 'action', label: 'Generate Certificate', variant: 'green' },
  ],
  'Apply Security Config': [
    { type: 'input', label: 'Config Path', placeholder: '/etc/ssl/certs/…' },
    { type: 'action', label: 'Apply Config', variant: 'green' },
  ],
  'Validate Secure Connectivity': [
    { type: 'input', label: 'Endpoint', placeholder: 'https://api-gw.prod…' },
    { type: 'action', label: 'Test Connection', variant: 'blue' },
  ],
  'Infra / Security config': [
    { type: 'select', label: 'Config Type', options: ['SSL/TLS Certificate', 'Firewall Rule', 'Access Policy', 'Service Account'] },
    { type: 'input', label: 'Change Request ID', placeholder: 'CR-ATT-…' },
    { type: 'input', label: 'Target Endpoint', placeholder: '/api/v2/fulfillment/…' },
    { type: 'action', label: 'Submit Change Request', variant: 'blue' },
  ],
  'Other': [
    { type: 'input', label: 'Notes', placeholder: 'Describe resolution approach…' },
    { type: 'action', label: 'Submit Resolution', variant: 'blue' },
  ],
  'Manual update / Set wait / DB': [
    { type: 'select', label: 'Action', options: ['DB Update', 'Set Wait Timer', 'Manual Patch', 'Config Change'] },
    { type: 'input', label: 'Target', placeholder: 'Table/field or timer value…' },
    { type: 'action', label: 'Apply Update', variant: 'green' },
  ],
  'Migration / DRAIN': [
    { type: 'select', label: 'Operation', options: ['Drain Queue', 'Migrate Data', 'Flush Cache', 'Rebalance'] },
    { type: 'input', label: 'Source', placeholder: 'Queue/topic name…' },
    { type: 'action', label: 'Execute Migration', variant: 'green' },
  ],
  'Drop from RTB': [
    { type: 'input', label: 'Reason Code', placeholder: 'Enter reason code…' },
    { type: 'action', label: 'Drop from RTB', variant: 'green' },
  ],
  'Test Resolution - all in Sandbox': [
    { type: 'input', label: 'Test Scenario', placeholder: 'Describe test case…' },
    { type: 'action', label: 'Run in Sandbox', variant: 'blue' },
  ],
}

function ManualStepForm({ step }) {
  const fields = STEP_MANUAL_FORMS[step.label]
  if (!fields) return null
  return (
    <div className="sky-manual-form">
      {fields.map((f, i) => {
        if (f.type === 'action') {
          return (
            <div key={i} className="sky-manual-form-action">
              <button className={`sky-btn sky-btn-sm ${f.variant === 'green' ? 'sky-btn-green' : 'sky-btn-outline'}`}>
                <Play size={12} /> {f.label}
              </button>
            </div>
          )
        }
        return (
          <div key={i} className="sky-manual-form-field">
            <label>{f.label}</label>
            {f.type === 'select' ? (
              <select className="sky-manual-form-select" defaultValue={f.options[0]}>
                {f.options.map(o => <option key={o} value={o}>{o}</option>)}
              </select>
            ) : (
              <input
                className="sky-manual-form-input"
                type="text"
                placeholder={f.placeholder || ''}
                defaultValue={f.value || ''}
                readOnly={!!f.readonly}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}

const STEP_HYBRID_AGENTS = {
  'Edit Order & Review Conflicts': 'Order Resolution Agent',
  'Review & Fix Address Data': 'CRM Data Agent',
  'Approve Reprocess Plan': 'DLQ Recovery Agent',
  'Approve State Reset': 'State Management Agent',
  'Approve Re-tokenization': 'Payment Security Agent',
  'Approve Release & Reallocate': 'Inventory Agent',
  'Check / Verify / Investigate': 'ACBR Health Agent',
  'Verify Service Health': 'Service Health Agent',
  'Verify Error Trace': 'Log Analysis Agent',
  'Identify and fix issue': 'Issue Resolution Agent',
  'Contact OTS': 'OTS Liaison Agent',
  'Contact RTB': 'RTB Support Agent',
  'Contact ACE': 'ACE Integration Agent',
  'Contact ACS': 'ACS Support Agent',
  'Contact Brite Bill / BB': 'BriteBill Agent',
  'Contact CG': 'CG Coordination Agent',
  'Contact L2 / U-verse': 'L2 Escalation Agent',
  'Contact application / source system': 'Source System Agent',
  'Contact iPaaS Support': 'iPaaS Support Agent',
  'Guided Task / Decide action': 'Decision Support Agent',
}

function HybridAgentLine({ step }) {
  const agentName = STEP_HYBRID_AGENTS[step.label]
  if (!agentName) return null
  return (
    <div className="sky-hybrid-agent-line">
      <Bot size={14} />
      <span>Agent:</span>
      <span className="sky-agent-name-badge">{agentName}</span>
      <button className="sky-btn sky-btn-green sky-btn-sm"><Play size={12} /> Execute</button>
    </div>
  )
}

const TASK_OBSERVABILITY = {
  '87342': 'Root cause traced to a delivery date conflict in the downstream provisioning system. The expected activation date (2026-03-01) was overridden by a stale cached value (2026-02-15) from a prior failed attempt. APM traces show the conflict originated in the order-enrichment microservice during field mapping.',
  '87350': 'Duplicate billing event triggered by a Kafka consumer rebalance during the January bill cycle. Two consumer instances processed the same offset range, resulting in double charge insertion. Log analysis confirms the rebalance was caused by a GC pause exceeding the session timeout.',
  '87355': 'Provisioning timeout caused by elevated latency on the VoLTE downstream API gateway. Trace data shows P99 response times spiked to 12s (baseline: 80ms) due to a connection pool exhaustion in the downstream service.',
  '87360': 'CRM entity update rejected due to address field exceeding the 50-character validation constraint. The source data from the order portal did not apply truncation rules before submission. Log correlation shows 3 similar rejections in the last 24h.',
  '87365': 'Price mismatch between local catalog ($29.99) and upstream source ($24.99) caused by a failed catalog sync job 48h ago. The sync failure was due to an expired API token on the upstream catalog connector.',
  '87370': 'DLQ overflow caused by a schema mismatch introduced in the v4.11 order-events producer. Messages with the new schema version were rejected by consumers running the prior version. 14,502 messages accumulated over 6 hours.',
  '87375': 'Payment token expired because the checkout session exceeded the 24h token validity window. The customer started checkout at 16:00 but completed it 26h later. The payment gateway correctly rejected the stale token per PCI compliance rules.',
  '87380': 'Number portability request rejected by donor network (Carrier-B) due to an active contract on the subscriber line. CRM records show the contract end date was updated but not yet propagated to the donor registry.',
  '87385': 'Activation retry loop caused by a stuck configuration flag (activation_flag=false) in the downstream provisioning system. The flag was set during a maintenance window but never reverted, producing 47 identical failure cycles.',
  '87390': 'SMS gateway returned 503 for the entire notification batch. Gateway health dashboard shows a 12-minute outage due to certificate rotation on the upstream SMS provider. All 342 messages failed simultaneously.',
  '87395': 'Inventory conflict caused by a race condition in the reservation API. Two concurrent orders acquired RES-44021 within a 200ms window before the distributed lock was applied.',
  'ATT-10001': 'ACBR business error detected for classification BSS-BILL-ACBREVENT-13000015. Error trace shows a data validation failure in the ACBR microservice during event processing. Root cause linked to incorrect RTB (Ready to Bill) data entry requiring manual investigation and potential drop of the error item.',
  'ATT-10002': 'ACBR technical error detected for classifications BSS-BILL-ACBREVENT-13000008, -13000005, -13000001. The service referenced in the error message experienced intermittent connectivity failures. Infrastructure monitoring confirms network-level issues between ACBR components and dependent downstream services.',
  'ATT-10003': 'Access denied error (HTTP 403) received during order fulfillment on endpoint /api/v2/fulfillment/provision. Security configuration mismatch between API gateway and downstream service. Classifications DE-OH-POFULFILLMNT-01403001, ATT-OH-IMDPMT-01403001 indicate a policy enforcement block requiring infrastructure team intervention.',
}

export default function TicketDetails2({ task: taskProp, onBack }) {
  const [task, setTask] = useState(taskProp ? { ...taskProp, steps: normalizeSteps(taskProp) } : null)
  const [selectedStep, setSelectedStep] = useState(null)
  const [notes, setNotes] = useState({})
  const [copied, setCopied] = useState(false)
  const [handlers, setHandlers] = useState([])
  const [selectedHandler, setSelectedHandler] = useState({})
  const [handlerCode, setHandlerCode] = useState({})
  const [editedCode, setEditedCode] = useState({})
  const [sandboxMode, setSandboxMode] = useState({})
  const [sandboxOutput, setSandboxOutput] = useState({})
  const [execState, setExecState] = useState({})
  const [pythonExpanded, setPythonExpanded] = useState({})

  useEffect(() => {
    if (taskProp) {
      setTask({ ...taskProp, steps: normalizeSteps(taskProp) })
    } else {
      fetch('/api/sky-tasks')
        .then(r => r.json())
        .then(data => {
          const list = data.tasks || data
          const t = list.find(t => t.id === '87342')
          if (t) setTask({ ...t, steps: normalizeSteps(t) })
        })
        .catch(() => {
          import('../../config/common/sky-tasks.json').then(m => {
            const t = m.default.tasks.find(t => t.id === '87342')
            if (t) setTask({ ...t, steps: normalizeSteps(t) })
          })
        })
    }
    fetch('/api/agent-handlers').then(r => r.json()).then(setHandlers).catch(() => {})
  }, [taskProp])

  const { flowNodes, flowEdges } = useMemo(() => {
    if (!task) return { flowNodes: [], flowEdges: [] }
    const NODE_W = 260
    const NODE_H = 120
    const GAP_Y = 12
    const GAP_X = 30
    const startX = 20
    const startY = 24

    const selectedId = selectedStep?.id

    const edgeStyle = (step) => ({
      stroke: step.status === 'DONE' ? '#22c55e' : step.status === 'IN_PROGRESS' ? '#3b82f6' : '#d4d4d4',
      strokeWidth: 2.5,
    })

    const branchChildren = {}
    const isBranchChild = new Set()
    task.steps.forEach(step => {
      if (step.conditionParent) {
        const parentId = step.conditionParent
        if (!branchChildren[parentId]) branchChildren[parentId] = []
        branchChildren[parentId].push(step)
        isBranchChild.add(step.id)
      }
    })

    const fNodes = []
    const fEdges = []
    let curY = startY
    let stepNum = 0
    let prevMainStepId = null

    for (let i = 0; i < task.steps.length; i++) {
      const step = task.steps[i]
      if (isBranchChild.has(step.id)) continue

      stepNum++
      const nodeId = `step-${step.id}`
      fNodes.push({
        id: nodeId,
        type: 'stepNode',
        position: { x: startX, y: curY },
        draggable: false,
        data: { ...step, stepNum, selected: step.id === selectedId },
      })

      if (prevMainStepId !== null) {
        const prevStep = task.steps.find(s => s.id === prevMainStepId)
        fEdges.push({
          id: `e-${prevMainStepId}-${step.id}`,
          source: `step-${prevMainStepId}`,
          target: nodeId,
          type: 'labeled',
          animated: prevStep?.status === 'IN_PROGRESS',
          style: edgeStyle(prevStep || step),
          data: { animated: prevStep?.status === 'IN_PROGRESS' },
        })
      }

      const children = branchChildren[step.id]
      if (children && children.length > 0) {
        const branchY = curY + NODE_H + GAP_Y
        children.forEach((child, ci) => {
          const branchX = startX + (ci + 1) * (NODE_W + GAP_X)
          stepNum++
          const childNodeId = `step-${child.id}`
          fNodes.push({
            id: childNodeId,
            type: 'stepNode',
            position: { x: branchX, y: branchY },
            draggable: false,
            data: { ...child, stepNum, selected: child.id === selectedId },
          })
          fEdges.push({
            id: `e-${step.id}-${child.id}`,
            source: nodeId,
            target: childNodeId,
            type: 'labeled',
            animated: step.status === 'IN_PROGRESS',
            style: { ...edgeStyle(step), strokeDasharray: '6 3' },
            data: { label: child.conditionLabel || '', animated: step.status === 'IN_PROGRESS' },
          })
        })
        curY = branchY + NODE_H + GAP_Y
      } else {
        curY += NODE_H + GAP_Y
      }

      prevMainStepId = step.id
    }

    return { flowNodes: fNodes, flowEdges: fEdges }
  }, [task, selectedStep])

  const [nodes, setNodes, onNodesChange] = useNodesState(flowNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(flowEdges)

  useEffect(() => {
    setNodes(flowNodes)
    setEdges(flowEdges)
  }, [flowNodes, flowEdges, setNodes, setEdges])

  const onNodeClick = useCallback((_, node) => {
    if (!task) return
    const step = task.steps.find(s => `step-${s.id}` === node.id)
    if (step) {
      if (selectedStep && selectedStep.id === step.id) {
        setSelectedStep(null)
      } else {
        setSelectedStep(step)
        if (!selectedHandler[step.id] && handlers.length > 0) {
          const suggested = STEP_HANDLER_SUGGESTIONS[step.label]
          if (suggested && handlers.find(h => h.slug === suggested)) {
            loadHandler(step.id, suggested)
          }
        }
      }
    }
  }, [task, handlers, selectedHandler, selectedStep])

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
        {onBack && (
          <button className="sky-detail-back" onClick={onBack}>
            <ArrowLeft size={16} /> Back to Tasks
          </button>
        )}
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

            {(task.observability || TASK_OBSERVABILITY[task.id]) && (
              <div className="td2-section sky-observability-section">
                <label>OBSERVABILITY</label>
                <p className="sky-observability-text">{task.observability || TASK_OBSERVABILITY[task.id]}</p>
              </div>
            )}

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
              proOptions={{ hideAttribution: true }}
              nodesDraggable={false}
              nodesConnectable={false}
              elementsSelectable={true}
              panOnDrag={false}
              panOnScroll={true}
              zoomOnScroll={false}
              zoomOnPinch={false}
              zoomOnDoubleClick={false}
              preventScrolling={false}
              minZoom={0.3}
              maxZoom={1.5}
            >
              <Background color="#e2e8f0" gap={20} size={1} />
            </ReactFlow>
          </div>
        </div>
      </div>

      {/* Step Edit Drawer */}
      {selectedStep && (
        <div className="td2-drawer-overlay">
          <div className="td2-drawer">
            <div className="td2-drawer-header">
              <div className="td2-drawer-title-group">
                <h3>Step {task.steps.indexOf(selectedStep) + 1}: {selectedStep.label}</h3>
                {selectedStep.resolution && <p className="td2-drawer-step-subtitle">{selectedStep.resolution}</p>}
                {selectedStep.description && <p className="td2-drawer-step-desc">{selectedStep.description}</p>}
              </div>
              <button className="td2-drawer-close" onClick={() => setSelectedStep(null)}><X size={18} /></button>
            </div>
            <div className="td2-drawer-body">
              {renderStepCard(selectedStep, {
                notes, setNotes, handlers, selectedHandler, handlerCode,
                editedCode, setEditedCode, sandboxMode, setSandboxMode,
                sandboxOutput, execState, loadHandler, executeHandler,
                executeSandbox, resetCode, pythonExpanded, setPythonExpanded
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

      {step.resolution && (
        <div className="sky-step-subtitle">{step.resolution}</div>
      )}

      {step.type === 'AUTO-AGENT' && <AutoAgentCards step={step} />}

      {step.type === 'HYBRID' && step.agentLog && (
        <div className="sky-agent-section">
          <div className="sky-agent-console">
            {step.agentLog.map((line, i) => (
              <div key={i} className={`sky-console-line ${line.includes('PROPOSAL') ? 'highlight' : ''}`}>{line}</div>
            ))}
          </div>
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

      {step.type === 'HYBRID' && <HybridAgentLine step={step} />}

      {step.type === 'MANUAL' && <ManualStepForm step={step} />}

      {isDone && !step.agentLog && step.type !== 'AUTO-AGENT' && (
        <div className="sky-done-message">
          <CheckCircle2 size={16} color="#16a34a" /> Step completed successfully.
        </div>
      )}

      {step.type !== 'AUTO-AGENT' && (
        <div className="sky-python-collapsible">
          <div
            className="sky-python-collapse-header"
            onClick={() => ctx.setPythonExpanded(prev => ({ ...prev, [step.id]: !prev[step.id] }))}
          >
            <Code size={14} />
            <span>Python Execution</span>
            {ctx.pythonExpanded[step.id]
              ? <ChevronDown size={14} className="sky-python-chevron" />
              : <ChevronRight size={14} className="sky-python-chevron" />}
          </div>
          {ctx.pythonExpanded[step.id] && (
            <div className="sky-python-collapse-body">
              <div className="sky-python-section">
                <div className="sky-python-bar">
                  <Code size={14} />
                  <span>Handler</span>
                  <select
                    className="sky-python-select"
                    value={ctx.selectedHandler[step.id] || ''}
                    onChange={e => ctx.loadHandler(step.id, e.target.value)}
                  >
                    <option value="">Select handler…</option>
                    {ctx.handlers.map(h => {
                      const isSuggested = STEP_HANDLER_SUGGESTIONS[step.label] === h.slug
                      return (
                        <option key={h.slug} value={h.slug}>
                          {h.label}{isSuggested ? ' ★ Suggested' : ''}
                        </option>
                      )
                    })}
                  </select>
                  {ctx.selectedHandler[step.id] && STEP_HANDLER_SUGGESTIONS[step.label] === ctx.selectedHandler[step.id] && (
                    <span className="sky-suggested-badge"><Sparkles size={11} /> Suggested</span>
                  )}
                </div>

                {ctx.selectedHandler[step.id] && ctx.handlerCode[step.id] && (
                  <>
                    <div className="sky-python-toolbar">
                      <div className="sky-python-toolbar-left">
                        <button
                          className={`sky-python-mode-btn ${!ctx.sandboxMode[step.id] ? 'active' : ''}`}
                          onClick={() => ctx.setSandboxMode(prev => ({ ...prev, [step.id]: false }))}
                        >
                          <Terminal size={12} /> Execute
                        </button>
                        <button
                          className={`sky-python-mode-btn ${ctx.sandboxMode[step.id] ? 'active' : ''}`}
                          onClick={() => ctx.setSandboxMode(prev => ({ ...prev, [step.id]: true }))}
                        >
                          <FlaskConical size={12} /> Sandbox
                        </button>
                      </div>
                      <div className="sky-python-toolbar-right">
                        {ctx.sandboxMode[step.id] && ctx.editedCode[step.id] !== ctx.handlerCode[step.id] && (
                          <button className="sky-btn sky-btn-outline sky-btn-xs" onClick={() => ctx.resetCode(step.id)}>
                            <RotateCcw size={11} /> Reset
                          </button>
                        )}
                        {!ctx.sandboxMode[step.id] ? (
                          <button
                            className={`sky-btn sky-btn-sm ${ctx.execState[step.id] === 'running' ? 'sky-btn-outline' : 'sky-btn-green'}`}
                            onClick={() => ctx.executeHandler(step.id)}
                            disabled={ctx.execState[step.id] === 'running'}
                          >
                            {ctx.execState[step.id] === 'running' ? <><Loader size={12} className="sky-spin" /> Running…</> :
                             ctx.execState[step.id] === 'done' ? <><CheckCircle2 size={12} /> Done</> :
                             <><Play size={12} /> Run</>}
                          </button>
                        ) : (
                          <button
                            className={`sky-btn sky-btn-sm ${ctx.execState[step.id] === 'running' ? 'sky-btn-outline' : 'sky-btn-sandbox'}`}
                            onClick={() => ctx.executeSandbox(step.id)}
                            disabled={ctx.execState[step.id] === 'running'}
                          >
                            {ctx.execState[step.id] === 'running' ? <><Loader size={12} className="sky-spin" /> Running…</> :
                             ctx.execState[step.id] === 'sandbox-done' ? <><CheckCircle2 size={12} /> Done</> :
                             <><FlaskConical size={12} /> Run in Sandbox</>}
                          </button>
                        )}
                      </div>
                    </div>

                    <textarea
                      className="sky-python-editor"
                      value={ctx.editedCode[step.id] || ''}
                      onChange={e => ctx.setEditedCode(prev => ({ ...prev, [step.id]: e.target.value }))}
                      spellCheck={false}
                    />
                  </>
                )}

                {ctx.execState[step.id] === 'done' && (
                  <div className="sky-python-output">
                    <div className="sky-console-line highlight">[OK] Handler executed — result: {`{ "status": "completed", "agent": "${ctx.selectedHandler[step.id]}" }`}</div>
                  </div>
                )}
                {ctx.sandboxOutput[step.id] && (
                  <div className="sky-python-output sky-sandbox-output">
                    {ctx.sandboxOutput[step.id].map((line, i) => (
                      <div key={i} className={`sky-console-line ${line.includes('✓') ? 'highlight' : ''}`}>{line}</div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {step.type !== 'AUTO-AGENT' && (
        <div className="sky-step-footer">
          <button className="sky-btn sky-btn-outline sky-btn-sm">Save Draft</button>
          {isActive && <button className="sky-btn sky-btn-red sky-btn-sm">Mark as Done</button>}
        </div>
      )}
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
