import React, { useState, useEffect } from 'react'
import {
  ArrowLeft, Copy, CheckCircle2, Circle, Clock, Play, User, Bot,
  ChevronDown, ChevronUp, ChevronRight, AlertTriangle, SkipForward, Mail, Shield,
  Pencil, FileText, Workflow, Code, Terminal, Loader, Sparkles,
  FlaskConical, RotateCcw, Diamond, GitFork, CheckSquare2, Square, SquareDot
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
  'Apply Catalog Sync': {
    agents: [{ name: 'Catalog Sync Agent', role: 'Updater' }],
    result: 'Catalog synchronized — Price updated to $24.99 across all channels',
    resultType: 'success',
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
  'Verify Consumer Lag Normal': {
    agents: [{ name: 'Kafka Monitor', role: 'Observer' }],
    result: 'Consumer lag normalized — Current lag: 12 (threshold: 5000)',
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
  'Re-trigger Activation': {
    agents: [{ name: 'Activation Agent', role: 'Executor' }],
    result: 'Activation re-triggered — Order now processing normally',
    resultType: 'success',
  },
  'Verify No Loop Recurrence': {
    agents: [{ name: 'Loop Detector', role: 'Monitor' }],
    result: 'No loop recurrence — Stable for 30 min monitoring window',
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
  'Validate Port Complete': {
    agents: [{ name: 'Port Validator', role: 'Verifier' }],
    result: 'Number port complete — Subscriber migrated to target network',
    resultType: 'success',
  },
  'Check Gateway Status': {
    agents: [{ name: 'SMS Gateway Agent', role: 'Monitor' }],
    result: 'Gateway status: recovering — Expected available within 15 min',
    resultType: 'warning',
  },
  'Retry Batch Dispatch': {
    agents: [{ name: 'Notification Agent', role: 'Dispatcher' }],
    result: 'Batch re-dispatched — 342/342 SMS sent successfully',
    resultType: 'success',
  },
  'Verify Delivery Receipts': {
    agents: [{ name: 'Delivery Monitor', role: 'Tracker' }],
    result: 'All delivery receipts confirmed — 342 delivered, 0 failed',
    resultType: 'success',
  },
  'Identify Conflicting Reservations': {
    agents: [{ name: 'Inventory Agent', role: 'Detector' }, { name: 'Conflict Resolver', role: 'Analyzer' }],
    result: 'Conflict identified — RES-44021 double-booked for ORD-7744-GH and ORD-7740-AB',
    resultType: 'warning',
  },
  'Execute Reservation Fix': {
    agents: [{ name: 'Inventory Agent', role: 'Executor' }],
    result: 'Reservation corrected — ORD-7740-AB released, ORD-7744-GH retained',
    resultType: 'success',
  },
  'Validate Inventory State': {
    agents: [{ name: 'Inventory Validator', role: 'Auditor' }],
    result: 'Inventory clean — No remaining conflicts for RES-44021',
    resultType: 'success',
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
  '87355': 'Provisioning timeout caused by elevated latency on the VoLTE downstream API gateway. Trace data shows P99 response times spiked to 12s (baseline: 80ms) due to a connection pool exhaustion in the downstream service. Infrastructure metrics confirm the pool was not scaled for peak traffic.',
  '87360': 'CRM entity update rejected due to address field exceeding the 50-character validation constraint. The source data from the order portal did not apply truncation rules before submission. Log correlation shows 3 similar rejections in the last 24h from the same integration endpoint.',
  '87365': 'Price mismatch between local catalog ($29.99) and upstream source ($24.99) caused by a failed catalog sync job 48h ago. The sync failure was due to an expired API token on the upstream catalog connector. No retry was triggered because the alert threshold was set too high.',
  '87370': 'DLQ overflow caused by a schema mismatch introduced in the v4.11 order-events producer. Messages with the new schema version were rejected by consumers running the prior version. The 14,502 backlogged messages accumulated over 6 hours before the monitoring alert fired.',
  '87375': 'Payment token expired because the checkout session exceeded the 24h token validity window. The customer started checkout at 16:00 but completed it at 18:05 the next day (26h gap). The payment gateway correctly rejected the stale token per PCI compliance rules.',
  '87380': 'Number portability request rejected by donor network (Carrier-B) due to an active contract on the subscriber line. CRM records show the contract end date was updated but the portability request was submitted before the change propagated to the donor registry.',
  '87385': 'Activation retry loop caused by a stuck configuration flag (activation_flag=false) in the downstream provisioning system. The flag was set during a maintenance window but never reverted. Each retry hit the same false flag, producing 47 identical failure cycles over 3 hours.',
  '87390': 'SMS gateway returned 503 (temporarily unavailable) for the entire notification batch. Gateway health dashboard shows the outage lasted 12 minutes due to a certificate rotation on the upstream SMS provider. All 342 messages in the batch failed simultaneously.',
  '87395': 'Inventory conflict caused by a race condition in the reservation API. Two concurrent order submissions (ORD-7744-GH and ORD-7740-AB) both acquired RES-44021 within a 200ms window before the lock was applied. Distributed tracing confirms overlapping transaction timestamps.',
  '87400': 'Promotional discount not applied due to a missing eligibility rule in the offer configuration. The bundle BDL-8820 was created without linking the 25% promotional campaign. Catalog audit shows the campaign-to-bundle association was dropped during a bulk import last week.',
  '87405': 'Address validation failed because the postal code field contained an alphanumeric value instead of the expected 5-digit format. The source form did not enforce input validation, allowing the malformed data to reach the service qualification engine.',
  '87410': 'Two change requests (CR-4401 and CR-4405) were scheduled for overlapping maintenance windows on the same network element (NE-CORE-07). The scheduling system did not enforce mutual exclusion for same-element changes within overlapping time ranges.',
  '87415': 'Bill run aborted after the tax engine timed out processing the enterprise batch (342 accounts). The timeout (30s) was insufficient for the batch size. Tax engine logs show CPU saturation at 98% during the calculation phase, suggesting the batch needs splitting.',
  '87420': 'API gateway TLS certificate (CN: api-gw.prod.tmo.amdocs.com) expires in 48 hours. The automated renewal job failed 5 days ago due to a DNS validation error. No alert was generated because the certificate monitoring threshold was set to 24h instead of 7 days.',
  'ATT-10001': 'ACBR business error detected for classification BSS-BILL-ACBREVENT-13000015. Error trace shows a data validation failure in the ACBR microservice during event processing. Root cause linked to incorrect RTB (Ready to Bill) data entry requiring manual investigation and potential drop of the error item.',
  'ATT-10002': 'ACBR technical error detected for classifications BSS-BILL-ACBREVENT-13000008, -13000005, -13000001. The service referenced in the error message experienced intermittent connectivity failures. Infrastructure monitoring confirms network-level issues between ACBR components and dependent downstream services.',
  'ATT-10003': 'Access denied error (HTTP 403) received during order fulfillment on endpoint /api/v2/fulfillment/provision. Security configuration mismatch between API gateway and downstream service. Classifications DE-OH-POFULFILLMNT-01403001, ATT-OH-IMDPMT-01403001 indicate a policy enforcement block requiring infrastructure team intervention.',
}

export default function SkyTaskDetail({ task, onBack, hybridMode = false }) {
  const [expandedSteps, setExpandedSteps] = useState(() => {
    const map = {}
    task.steps.forEach(s => { map[s.id] = hybridMode ? false : s.status === 'IN_PROGRESS' })
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
  const [pythonExpanded, setPythonExpanded] = useState({})

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

            {(task.observability || TASK_OBSERVABILITY[task.id]) && (
              <div className="sky-ticket-section sky-observability-section">
                <label>OBSERVABILITY</label>
                <p className="sky-observability-text">{task.observability || TASK_OBSERVABILITY[task.id]}</p>
              </div>
            )}

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
            {(() => {
              const renderStepCard = (step) => {
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
                    className={`sky-step ${isActive ? 'active' : ''} ${isDone ? 'done' : ''} ${isPending ? 'pending' : ''}${hybridMode ? ' sky-step-hybrid-card' : ''}`}
                  >
                    {hybridMode && step.conditionLabel && (
                      <span className="sky-condition-badge"><Diamond size={10} />{step.conditionLabel}</span>
                    )}
                    <div className="sky-step-header" onClick={() => toggleStep(step.id)}>
                      <div className="sky-step-left">
                        <span className={`sky-step-type-badge ${step.type === 'AUTO-AGENT' ? 'auto' : step.type === 'HYBRID' ? 'hybrid' : 'manual'}`}>
                          {step.type === 'AUTO-AGENT' ? <><Bot size={30} /><span>Auto</span></> : step.type === 'HYBRID' ? <><Workflow size={30} /><span>Hybrid</span></> : <><User size={30} /><span>Manual</span></>}
                        </span>
                        <div className="sky-step-label-group">
                          <span className="sky-step-label">{step.label}</span>
                          {step.resolution && <span className="sky-step-subtitle">{step.resolution}</span>}
                          {step.description && <span className="sky-step-desc">{step.description}</span>}
                        </div>
                        {step.skippable && <span className="sky-skippable-badge">SKIPPABLE</span>}
                      </div>
                      <div className="sky-step-right">
                        <span className={`sky-step-status sky-step-status-${isDone ? 'done' : isActive ? 'in-progress' : 'pending'}`}>
                          {isDone && <span className="sky-done-check"><Square size={35} /><svg className="sky-done-tick" width="32" height="32" viewBox="0 0 24 24" fill="none"><path d="M4 13l5 5L20 6" stroke="#16a34a" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"/></svg></span>}
                          {isActive && <SquareDot size={35} />}
                          {isPending && <Square size={35} />}
                        </span>
                        {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                      </div>
                    </div>

                    {expanded && (
                      <div className="sky-step-body">
                        {step.type === 'AUTO-AGENT' && <AutoAgentCards step={{ ...step, status }} />}

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
                              onClick={() => setPythonExpanded(prev => ({ ...prev, [step.id]: !prev[step.id] }))}
                            >
                              <Code size={14} />
                              <span>Python Execution</span>
                              {pythonExpanded[step.id]
                                ? <ChevronDown size={14} className="sky-python-chevron" />
                                : <ChevronRight size={14} className="sky-python-chevron" />}
                            </div>
                            {pythonExpanded[step.id] && (
                              <div className="sky-python-collapse-body">
                                <div className="sky-python-section">
                                  <div className="sky-python-bar">
                                    <Code size={14} />
                                    <span>Handler</span>
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

                                      <textarea
                                        className="sky-python-editor"
                                        value={editedCode[step.id] || ''}
                                        onChange={e => setEditedCode(prev => ({ ...prev, [step.id]: e.target.value }))}
                                        spellCheck={false}
                                      />
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
                              </div>
                            )}
                          </div>
                        )}

                        {step.type !== 'AUTO-AGENT' && (
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
                        )}
                      </div>
                    )}
                  </div>
                )
              }

              if (!hybridMode) {
                return task.steps.map(renderStepCard)
              }

              const branchChildren = {}
              const isBranchChild = new Set()
              task.steps.forEach(step => {
                if (step.conditionParent) {
                  if (!branchChildren[step.conditionParent]) branchChildren[step.conditionParent] = []
                  branchChildren[step.conditionParent].push(step)
                  isBranchChild.add(step.id)
                }
              })

              const rows = []
              task.steps.forEach(step => {
                if (isBranchChild.has(step.id)) return
                rows.push({ parent: step, children: branchChildren[step.id] || [] })
              })

              return rows.map((row) => {
                if (row.children.length === 0) {
                  return renderStepCard(row.parent)
                }
                return (
                  <div key={`row-${row.parent.id}`} className="sky-hybrid-row">
                    {renderStepCard(row.parent)}
                    <div className="sky-hybrid-branches-label">
                      <GitFork size={13} />
                      <span>Parallel Paths</span>
                    </div>
                    <div className="sky-hybrid-branches">
                      {row.children.map(child => renderStepCard(child))}
                    </div>
                  </div>
                )
              })
            })()}
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
