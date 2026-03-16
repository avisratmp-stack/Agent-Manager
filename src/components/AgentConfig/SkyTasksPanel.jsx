import React, { useState, useEffect } from 'react'
import {
  AlertTriangle, Clock, ChevronRight, Search, User, Bot,
  CheckCircle2, Circle, Play, Filter, Workflow
} from 'lucide-react'
import SkyTaskDetail from './SkyTaskDetail'

const PRIORITY_COLORS = {
  CRITICAL: { bg: '#fef2f2', color: '#dc2626', border: '#fecaca' },
  HIGH: { bg: '#fff7ed', color: '#ea580c', border: '#fed7aa' },
  MEDIUM: { bg: '#fefce8', color: '#ca8a04', border: '#fef08a' },
  LOW: { bg: '#f0fdf4', color: '#16a34a', border: '#bbf7d0' },
}

const STATUS_COLORS = {
  'IN PROGRESS': { bg: '#dbeafe', color: '#1d4ed8' },
  'OPEN': { bg: '#f0fdf4', color: '#16a34a' },
  'DONE': { bg: '#f1f5f9', color: '#64748b' },
}

function normalizeSteps(task) {
  const idx = (task.currentStep || 1) - 1
  return task.steps.map((s, i) => {
    if (i < idx) return { ...s, status: 'DONE' }
    if (i === idx) return { ...s, status: 'IN_PROGRESS' }
    return { ...s, status: 'PENDING' }
  })
}

export default function SkyTasksPanel() {
  const [tasks, setTasks] = useState([])
  const [selectedTaskId, setSelectedTaskId] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [priorityFilter, setPriorityFilter] = useState('')

  useEffect(() => {
    const normalize = list => list.map(t => ({ ...t, steps: normalizeSteps(t) }))
    fetch('/api/sky-tasks')
      .then(r => r.json())
      .then(data => setTasks(normalize(data.tasks || data)))
      .catch(() => {
        import('../../config/common/sky-tasks.json').then(m => setTasks(normalize(m.default.tasks)))
      })
  }, [])

  const selectedTask = tasks.find(t => t.id === selectedTaskId)

  const filtered = tasks.filter(t => {
    if (priorityFilter && t.priority !== priorityFilter) return false
    if (!searchQuery) return true
    const q = searchQuery.toLowerCase()
    return (
      t.id.includes(q) ||
      t.orderId.toLowerCase().includes(q) ||
      (t.assigneeGroup || '').toLowerCase().includes(q) ||
      (t.assignee || '').toLowerCase().includes(q) ||
      (t.workflowName || '').toLowerCase().includes(q)
    )
  })

  if (selectedTask) {
    return <SkyTaskDetail task={selectedTask} onBack={() => setSelectedTaskId(null)} />
  }

  const activeStepLabel = (task) => {
    const active = task.steps.find(s => s.status === 'IN_PROGRESS')
    if (active) return active.label
    const pending = task.steps.find(s => s.status === 'PENDING')
    return pending ? pending.label : 'All done'
  }

  const doneCount = (task) => task.steps.filter(s => s.status === 'DONE').length

  return (
    <div className="sky-tasks-panel">
      <div className="sky-tasks-header">
        <h2>
          <AlertTriangle size={20} />
          Sky — Fallout Tasks
        </h2>
        <span className="sky-tasks-count">{filtered.length} task{filtered.length !== 1 ? 's' : ''}</span>
      </div>

      <div className="sky-tasks-toolbar">
        <div className="sky-tasks-search">
          <Search size={15} />
          <input
            type="text"
            placeholder="Search tickets, accounts, orders..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="sky-tasks-filters">
          <Filter size={14} />
          <select value={priorityFilter} onChange={e => setPriorityFilter(e.target.value)}>
            <option value="">All Priorities</option>
            <option value="CRITICAL">Critical</option>
            <option value="HIGH">High</option>
            <option value="MEDIUM">Medium</option>
            <option value="LOW">Low</option>
          </select>
        </div>
      </div>

      <div className="sky-tasks-grid">
        <table className="sky-tasks-table">
          <thead>
            <tr>
              <th style={{ width: 80 }}>Ticket</th>
              <th style={{ width: 180 }}>Current Step</th>
              <th style={{ width: 75 }}>Priority</th>
              <th style={{ width: 110 }}>Order</th>
              <th style={{ width: 100 }}>Status</th>
              <th style={{ width: 120 }}>Workflow (M&P)</th>
              <th style={{ width: 60 }}>Steps</th>
              <th style={{ width: 110 }}>Assignee Group</th>
              <th style={{ width: 180 }}>Assignee</th>
              <th style={{ width: 30 }}></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(task => {
              const pc = PRIORITY_COLORS[task.priority] || PRIORITY_COLORS.MEDIUM
              const sc = STATUS_COLORS[task.status] || STATUS_COLORS.OPEN
              const isAgentAssignee = (task.assigneeGroup || '').toLowerCase() === 'agents'
              return (
                <tr
                  key={task.id}
                  className="sky-task-row"
                  onClick={() => setSelectedTaskId(task.id)}
                >
                  <td className="sky-task-id">#{task.id}</td>
                  <td className="sky-task-current">
                    {(() => {
                      const active = task.steps.find(s => s.status === 'IN_PROGRESS')
                      if (!active) return <span className="sky-step-pending">{activeStepLabel(task)}</span>
                      let effectiveType, typeClass, TypeIcon, typeLabel
                      if (isAgentAssignee) {
                        effectiveType = 'AUTO-AGENT'
                      } else {
                        effectiveType = (active.type === 'HYBRID' || active.hasAgent) ? 'HYBRID' : 'MANUAL'
                      }
                      if (effectiveType === 'AUTO-AGENT') {
                        typeClass = 'auto'; TypeIcon = Bot; typeLabel = 'Auto'
                      } else if (effectiveType === 'HYBRID') {
                        typeClass = 'hybrid'; TypeIcon = Workflow; typeLabel = 'Hybrid'
                      } else {
                        typeClass = 'manual'; TypeIcon = User; typeLabel = 'Manual'
                      }
                      return (
                        <span className="sky-step-active">
                          <span className={`sky-step-type-mini ${typeClass}`}><TypeIcon size={10} /> {typeLabel}</span>
                          {active.label}
                        </span>
                      )
                    })()}
                  </td>
                  <td>
                    <span className="sky-priority-badge" style={{ background: pc.bg, color: pc.color, borderColor: pc.border }}>
                      {task.priority}
                    </span>
                  </td>
                  <td className="sky-task-order">{task.orderId}</td>
                  <td>
                    <span className="sky-status-badge" style={{ background: sc.bg, color: sc.color }}>
                      {task.status}
                    </span>
                  </td>
                  <td className="sky-task-wf">{task.workflowName}</td>
                  <td className="sky-task-steps">
                    <span className="sky-step-progress">
                      {doneCount(task)}/{task.steps.length}
                    </span>
                  </td>
                  <td className="sky-task-assignee-group">
                    {isAgentAssignee
                      ? <span className="sky-agent-group-badge"><Bot size={11} /> Agents</span>
                      : task.assigneeGroup || task.assignee}
                  </td>
                  <td className="sky-task-assignee">
                    {isAgentAssignee
                      ? <span className="sky-agent-name"><Bot size={12} className="sky-agent-icon-green" /> {task.assignee}</span>
                      : task.assignee}
                  </td>
                  <td><ChevronRight size={14} className="sky-row-arrow" /></td>
                </tr>
              )
            })}
            {filtered.length === 0 && (
              <tr><td colSpan={10} className="sky-tasks-empty">No tasks found</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
