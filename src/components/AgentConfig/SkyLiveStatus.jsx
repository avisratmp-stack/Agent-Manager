import React, { useState, useEffect, useMemo } from 'react'
import {
  Activity, Users, Bot, ExternalLink, AlertTriangle,
  CheckCircle2, Clock, TrendingUp, BarChart3, PieChart
} from 'lucide-react'

const INTERNAL_GROUPS = new Set([
  'DLQ Team', 'OH Fallout Team', 'Provisioning Team', 'Billing Team',
  'Order Mgmt Team', 'Agents', 'Support Team'
])

const EXTERNAL_CONTACT_GROUPS = new Set([
  'ACE', 'ACS', 'OTS', 'RTB', 'CG', 'L2 / U-verse',
  'Brite Bill / BB', 'iPaaS Support', 'application / source system'
])

function classifyGroup(group, steps) {
  const hasAutoOnly = steps && steps.every(s => s.type === 'AUTO-AGENT')
  if (hasAutoOnly || group === 'Agents') return 'auto'
  if (EXTERNAL_CONTACT_GROUPS.has(group)) return 'external'
  return 'internal'
}

export default function SkyLiveStatus() {
  const [tasks, setTasks] = useState([])
  const [matrixView, setMatrixView] = useState('status')

  useEffect(() => {
    fetch('/api/sky-tasks-att')
      .then(r => r.json())
      .then(data => setTasks(data.tasks || []))
      .catch(() => {
        import('../../config/common/sky-tasks-att.json').then(m => setTasks(m.default.tasks || []))
      })
  }, [])

  const stats = useMemo(() => {
    if (!tasks.length) return null

    let done = 0, inProgress = 0, pending = 0
    const byPriority = {}
    const byGroup = {}
    const byWorkflow = {}

    tasks.forEach(t => {
      const status = t.status || 'OPEN'
      const allDone = t.steps.every(s => s.status === 'DONE')
      const hasActive = t.steps.some(s => s.status === 'IN_PROGRESS')
      if (allDone) done++
      else if (hasActive) inProgress++
      else pending++

      const p = t.priority || 'MEDIUM'
      byPriority[p] = (byPriority[p] || 0) + 1

      const group = t.assigneeGroup || 'Unassigned'
      const area = classifyGroup(group, t.steps)
      if (!byGroup[group]) byGroup[group] = { internal: 0, external: 0, auto: 0, total: 0, area, done: 0, active: 0, pending: 0, typeManual: 0, typeHybrid: 0, typeAuto: 0 }
      byGroup[group].total++
      byGroup[group][area]++
      if (allDone) byGroup[group].done++
      else if (hasActive) byGroup[group].active++
      else byGroup[group].pending++
      t.steps.forEach(s => {
        if (s.type === 'MANUAL') byGroup[group].typeManual++
        else if (s.type === 'HYBRID') byGroup[group].typeHybrid++
        else if (s.type === 'AUTO-AGENT') byGroup[group].typeAuto++
      })

      const wf = t.workflowName || 'Unknown'
      if (!byWorkflow[wf]) byWorkflow[wf] = { total: 0, done: 0, active: 0 }
      byWorkflow[wf].total++
      if (allDone) byWorkflow[wf].done++
      else if (hasActive) byWorkflow[wf].active++
    })

    return { total: tasks.length, done, inProgress, pending, byPriority, byGroup, byWorkflow }
  }, [tasks])

  if (!stats) return <div className="sky-live-loading">Loading live status...</div>

  const groupEntries = Object.entries(stats.byGroup).sort((a, b) => b[1].total - a[1].total)
  const internalGroups = groupEntries.filter(([, v]) => v.area === 'internal')
  const externalGroups = groupEntries.filter(([, v]) => v.area === 'external')
  const autoGroups = groupEntries.filter(([, v]) => v.area === 'auto')

  const topWorkflows = Object.entries(stats.byWorkflow)
    .sort((a, b) => b[1].total - a[1].total)
    .slice(0, 8)

  return (
    <div className="sky-live-status">
      <div className="sky-live-header">
        <Activity size={20} />
        <h2>Live Status Dashboard</h2>
        <span className="sky-live-badge">{stats.total} tickets</span>
      </div>

      {/* Row 1: Summary cards */}
      <div className="sky-live-summary">
        <div className="sky-live-card sky-live-card-total">
          <div className="sky-live-card-icon"><BarChart3 size={24} /></div>
          <div className="sky-live-card-body">
            <span className="sky-live-card-num">{stats.total}</span>
            <span className="sky-live-card-label">Total Tickets</span>
          </div>
        </div>
        <div className="sky-live-card sky-live-card-active">
          <div className="sky-live-card-icon"><Clock size={24} /></div>
          <div className="sky-live-card-body">
            <span className="sky-live-card-num">{stats.inProgress}</span>
            <span className="sky-live-card-label">In Progress</span>
          </div>
        </div>
        <div className="sky-live-card sky-live-card-done">
          <div className="sky-live-card-icon"><CheckCircle2 size={24} /></div>
          <div className="sky-live-card-body">
            <span className="sky-live-card-num">{stats.done}</span>
            <span className="sky-live-card-label">Completed</span>
          </div>
        </div>
        <div className="sky-live-card sky-live-card-pending">
          <div className="sky-live-card-icon"><AlertTriangle size={24} /></div>
          <div className="sky-live-card-body">
            <span className="sky-live-card-num">{stats.pending}</span>
            <span className="sky-live-card-label">Pending</span>
          </div>
        </div>
      </div>

      {/* Row 2: Matrix + Priority */}
      <div className="sky-live-row">
        {/* Widget 1: Assignee Group Matrix */}
        <div className="sky-live-widget sky-live-widget-wide">
          <div className="sky-live-widget-header">
            <PieChart size={16} />
            <h3>Ticket Distribution by Assignee Group</h3>
            <div className="sky-live-matrix-toggle">
              <button className={`sky-mode-btn ${matrixView === 'status' ? 'active' : ''}`} onClick={() => setMatrixView('status')}>By Status</button>
              <button className={`sky-mode-btn ${matrixView === 'type' ? 'active' : ''}`} onClick={() => setMatrixView('type')}>By Type</button>
            </div>
          </div>
          <div className="sky-live-matrix">
            <table>
              <colgroup>
                <col style={{ width: '200px' }} />
                <col style={{ width: '90px' }} />
                <col style={{ width: '90px' }} />
                <col style={{ width: '90px' }} />
                <col style={{ width: '90px' }} />
              </colgroup>
              <thead>
                <tr>
                  <th className="sky-live-matrix-hdr-group">Group</th>
                  {matrixView === 'status' ? (<>
                    <th className="sky-live-matrix-hdr"><span className="sky-live-dot sky-live-dot-active" /> Active</th>
                    <th className="sky-live-matrix-hdr"><span className="sky-live-dot sky-live-dot-done" /> Done</th>
                    <th className="sky-live-matrix-hdr"><span className="sky-live-dot sky-live-dot-pending" /> Pending</th>
                  </>) : (<>
                    <th className="sky-live-matrix-hdr"><Bot size={13} /> Auto</th>
                    <th className="sky-live-matrix-hdr"><Users size={13} /> Hybrid</th>
                    <th className="sky-live-matrix-hdr"><Users size={13} /> Manual</th>
                  </>)}
                  <th className="sky-live-matrix-hdr">Total</th>
                </tr>
              </thead>
              <tbody>
                {internalGroups.length > 0 && (
                  <tr className="sky-live-matrix-section-row">
                    <td colSpan={5} className="sky-live-area-internal"><Users size={13} /> Internal</td>
                  </tr>
                )}
                {internalGroups.map(([g, v]) => (
                  <tr key={g}>
                    <td className="sky-live-matrix-label">{g}</td>
                    {matrixView === 'status' ? (<>
                      <td className="sky-live-matrix-cell">{v.active || '–'}</td>
                      <td className="sky-live-matrix-cell">{v.done || '–'}</td>
                      <td className="sky-live-matrix-cell">{v.pending || '–'}</td>
                    </>) : (<>
                      <td className="sky-live-matrix-cell">{v.typeAuto || '–'}</td>
                      <td className="sky-live-matrix-cell">{v.typeHybrid || '–'}</td>
                      <td className="sky-live-matrix-cell">{v.typeManual || '–'}</td>
                    </>)}
                    <td className="sky-live-matrix-cell"><strong>{matrixView === 'status' ? v.total : v.typeAuto + v.typeHybrid + v.typeManual}</strong></td>
                  </tr>
                ))}
                {externalGroups.length > 0 && (
                  <tr className="sky-live-matrix-section-row">
                    <td colSpan={5} className="sky-live-area-external"><ExternalLink size={13} /> External</td>
                  </tr>
                )}
                {externalGroups.map(([g, v]) => (
                  <tr key={g}>
                    <td className="sky-live-matrix-label">{g}</td>
                    {matrixView === 'status' ? (<>
                      <td className="sky-live-matrix-cell">{v.active || '–'}</td>
                      <td className="sky-live-matrix-cell">{v.done || '–'}</td>
                      <td className="sky-live-matrix-cell">{v.pending || '–'}</td>
                    </>) : (<>
                      <td className="sky-live-matrix-cell">{v.typeAuto || '–'}</td>
                      <td className="sky-live-matrix-cell">{v.typeHybrid || '–'}</td>
                      <td className="sky-live-matrix-cell">{v.typeManual || '–'}</td>
                    </>)}
                    <td className="sky-live-matrix-cell"><strong>{matrixView === 'status' ? v.total : v.typeAuto + v.typeHybrid + v.typeManual}</strong></td>
                  </tr>
                ))}
                {autoGroups.length > 0 && (
                  <tr className="sky-live-matrix-section-row">
                    <td colSpan={5} className="sky-live-area-auto"><Bot size={13} /> Auto</td>
                  </tr>
                )}
                {autoGroups.map(([g, v]) => (
                  <tr key={g}>
                    <td className="sky-live-matrix-label">{g}</td>
                    {matrixView === 'status' ? (<>
                      <td className="sky-live-matrix-cell">{v.active || '–'}</td>
                      <td className="sky-live-matrix-cell">{v.done || '–'}</td>
                      <td className="sky-live-matrix-cell">{v.pending || '–'}</td>
                    </>) : (<>
                      <td className="sky-live-matrix-cell">{v.typeAuto || '–'}</td>
                      <td className="sky-live-matrix-cell">{v.typeHybrid || '–'}</td>
                      <td className="sky-live-matrix-cell">{v.typeManual || '–'}</td>
                    </>)}
                    <td className="sky-live-matrix-cell"><strong>{matrixView === 'status' ? v.total : v.typeAuto + v.typeHybrid + v.typeManual}</strong></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Row 3: Area breakdown */}
      <div className="sky-live-row">
        {/* Widget 2: Area Summary */}
        <div className="sky-live-widget">
          <div className="sky-live-widget-header">
            <PieChart size={16} />
            <h3>Area Breakdown</h3>
          </div>
          <div className="sky-live-area-cards">
            {[
              { label: 'Internal', icon: Users, groups: internalGroups, color: '#3b82f6' },
              { label: 'External', icon: ExternalLink, groups: externalGroups, color: '#f59e0b' },
              { label: 'Auto', icon: Bot, groups: autoGroups, color: '#10b981' },
            ].map(a => {
              const total = a.groups.reduce((s, [, v]) => s + v.total, 0)
              const pct = stats.total ? Math.round((total / stats.total) * 100) : 0
              return (
                <div key={a.label} className="sky-live-area-card">
                  <div className="sky-live-area-icon" style={{ color: a.color }}><a.icon size={28} /></div>
                  <span className="sky-live-area-num">{total}</span>
                  <span className="sky-live-area-label">{a.label}</span>
                  <span className="sky-live-area-pct">{pct}%</span>
                  <div className="sky-live-area-bar">
                    <div style={{ width: `${pct}%`, background: a.color }} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
