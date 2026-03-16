import React, { useState, useMemo } from 'react'
import { BarChart3, TrendingUp, Clock, CheckCircle2, AlertTriangle, Users, Bot, ArrowUp, ArrowDown, Minus } from 'lucide-react'

const GROUPS = ['Support Team', 'OH Fallouts Team', 'DLQ Team', 'Agents']

const DAYS = (() => {
  const d = []
  for (let i = 6; i >= 0; i--) {
    const dt = new Date()
    dt.setDate(dt.getDate() - i)
    d.push({
      key: dt.toISOString().slice(0, 10),
      short: dt.toLocaleDateString('en-US', { weekday: 'short' }),
      label: dt.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    })
  }
  return d
})()

function seed(s) {
  return function () { s = (s * 16807 + 0) % 2147483647; return (s - 1) / 2147483646 }
}

const DATA = (() => {
  const rng = seed(42)
  const r = (min, max) => Math.floor(rng() * (max - min + 1)) + min
  return GROUPS.map(group => {
    const isAgents = group === 'Agents'
    const daily = DAYS.map(day => {
      const baseResolved = r(500, 600)
      const baseOpened = r(500, 700)
      const resolved = isAgents ? baseResolved * 20 : baseResolved
      const opened = isAgents ? baseOpened * 20 : baseOpened
      const baseAvg = r(25, 90)
      const avgMinutes = isAgents ? Math.max(1, Math.round(baseAvg * 0.05)) : baseAvg
      const slaHit = isAgents ? 100 : r(65, 95)
      const escalated = isAgents ? r(0, 2) : r(5, 25)
      return { day: day.key, resolved, opened, avgMinutes, slaHit, escalated }
    })
    const totalResolved = daily.reduce((s, d) => s + d.resolved, 0)
    const totalOpened = daily.reduce((s, d) => s + d.opened, 0)
    const avgTime = Math.round(daily.reduce((s, d) => s + d.avgMinutes, 0) / daily.length)
    const avgSla = Math.round(daily.reduce((s, d) => s + d.slaHit, 0) / daily.length)
    const totalEscalated = daily.reduce((s, d) => s + d.escalated, 0)
    return { group, daily, totalResolved, totalOpened, avgTime, avgSla, totalEscalated }
  })
})()

const MAX_RESOLVED = Math.max(...DATA.flatMap(g => g.daily.map(d => d.resolved)))

function trend(daily, field) {
  const first3 = daily.slice(0, 3).reduce((s, d) => s + d[field], 0) / 3
  const last3 = daily.slice(-3).reduce((s, d) => s + d[field], 0) / 3
  const diff = last3 - first3
  if (Math.abs(diff) < 5) return { icon: Minus, color: '#94a3b8', label: 'Flat' }
  if (diff > 0) return { icon: ArrowUp, color: '#16a34a', label: `+${Math.round(diff)}` }
  return { icon: ArrowDown, color: '#dc2626', label: `${Math.round(diff)}` }
}

const fmt = n => n.toLocaleString()

export default function SkyTrackingReport() {
  const [selectedGroup, setSelectedGroup] = useState(null)

  const totals = useMemo(() => ({
    resolved: DATA.reduce((s, g) => s + g.totalResolved, 0),
    opened: DATA.reduce((s, g) => s + g.totalOpened, 0),
    avgTime: Math.round(DATA.reduce((s, g) => s + g.avgTime, 0) / DATA.length),
    avgSla: Math.round(DATA.reduce((s, g) => s + g.avgSla, 0) / DATA.length),
    escalated: DATA.reduce((s, g) => s + g.totalEscalated, 0),
  }), [])

  const detail = selectedGroup ? DATA.find(g => g.group === selectedGroup) : null

  return (
    <div className="sky-report">
      <div className="sky-report-header">
        <h2><BarChart3 size={20} /> Tracking Report</h2>
        <span className="sky-report-range">{DAYS[0].label} — {DAYS[6].label}</span>
      </div>

      {/* Summary Cards */}
      <div className="sky-report-cards">
        <div className="sky-rcard">
          <div className="sky-rcard-icon green"><CheckCircle2 size={18} /></div>
          <div><div className="sky-rcard-value">{fmt(totals.resolved)}</div><div className="sky-rcard-label">Resolved</div></div>
        </div>
        <div className="sky-rcard">
          <div className="sky-rcard-icon blue"><AlertTriangle size={18} /></div>
          <div><div className="sky-rcard-value">{fmt(totals.opened)}</div><div className="sky-rcard-label">Opened</div></div>
        </div>
        <div className="sky-rcard">
          <div className="sky-rcard-icon amber"><Clock size={18} /></div>
          <div><div className="sky-rcard-value">{totals.avgTime}<span className="sky-rcard-unit">min</span></div><div className="sky-rcard-label">Avg Resolution</div></div>
        </div>
        <div className="sky-rcard">
          <div className="sky-rcard-icon purple"><TrendingUp size={18} /></div>
          <div><div className="sky-rcard-value">{totals.avgSla}<span className="sky-rcard-unit">%</span></div><div className="sky-rcard-label">SLA Compliance</div></div>
        </div>
      </div>

      {/* Comparison Table */}
      <div className="sky-report-section">
        <h3><Users size={16} /> Group Comparison — Last 7 Days</h3>
        <table className="sky-report-table">
          <thead>
            <tr>
              <th>Assignee Group</th>
              <th>Resolved</th>
              <th>Opened</th>
              <th>Net</th>
              <th>Avg Time</th>
              <th>SLA %</th>
              <th>Escalated</th>
              <th>Trend (Resolved)</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {DATA.map(g => {
              const net = g.totalResolved - g.totalOpened
              const t = trend(g.daily, 'resolved')
              const TrendIcon = t.icon
              const isAgents = g.group === 'Agents'
              return (
                <tr
                  key={g.group}
                  className={`sky-report-row ${selectedGroup === g.group ? 'selected' : ''}`}
                  onClick={() => setSelectedGroup(selectedGroup === g.group ? null : g.group)}
                >
                  <td className="sky-rg-name">
                    {isAgents ? <Bot size={14} className="sky-rg-icon-agent" /> : <Users size={14} className="sky-rg-icon-team" />}
                    {g.group}
                  </td>
                  <td className="sky-rg-num green">{fmt(g.totalResolved)}</td>
                  <td className="sky-rg-num">{fmt(g.totalOpened)}</td>
                  <td className={`sky-rg-num ${net > 0 ? 'green' : net < 0 ? 'red' : ''}`}>
                    {net > 0 ? '+' : ''}{fmt(net)}
                  </td>
                  <td className="sky-rg-num">{g.avgTime} min</td>
                  <td className="sky-rg-num">
                    <span className={`sky-sla-pill ${g.avgSla >= 90 ? 'good' : g.avgSla >= 75 ? 'warn' : 'bad'}`}>
                      {g.avgSla}%
                    </span>
                  </td>
                  <td className="sky-rg-num">{fmt(g.totalEscalated)}</td>
                  <td>
                    <span className="sky-trend" style={{ color: t.color }}>
                      <TrendIcon size={13} /> {t.label}
                    </span>
                  </td>
                  <td className="sky-rg-expand">{selectedGroup === g.group ? '▾' : '▸'}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Daily Breakdown */}
      {detail && (
        <div className="sky-report-section">
          <h3>
            {detail.group === 'Agents' ? <Bot size={16} /> : <Users size={16} />}
            {detail.group} — Daily Breakdown
          </h3>
          <div className="sky-report-chart">
            <div className="sky-chart-labels">
              {DAYS.map(d => (
                <div key={d.key} className="sky-chart-day">
                  <span className="sky-chart-short">{d.short}</span>
                  <span className="sky-chart-date">{d.label}</span>
                </div>
              ))}
            </div>
            <div className="sky-chart-bars">
              {detail.daily.map((d, i) => (
                <div key={DAYS[i].key} className="sky-chart-col">
                  <div className="sky-bar-pair">
                    <div className="sky-bar resolved" style={{ height: `${(d.resolved / MAX_RESOLVED) * 100}%` }}>
                      <span className="sky-bar-val">{fmt(d.resolved)}</span>
                    </div>
                    <div className="sky-bar opened" style={{ height: `${(d.opened / MAX_RESOLVED) * 100}%` }}>
                      <span className="sky-bar-val">{fmt(d.opened)}</span>
                    </div>
                  </div>
                  <div className="sky-chart-meta">
                    <span className="sky-meta-time">{d.avgMinutes}m</span>
                    <span className={`sky-meta-sla ${d.slaHit >= 90 ? 'good' : d.slaHit >= 75 ? 'warn' : 'bad'}`}>{d.slaHit}%</span>
                  </div>
                </div>
              ))}
            </div>
            <div className="sky-chart-legend">
              <span><span className="sky-legend-dot resolved" /> Resolved</span>
              <span><span className="sky-legend-dot opened" /> Opened</span>
              <span className="sky-legend-sep">|</span>
              <span>Time = avg resolution</span>
              <span>% = SLA compliance</span>
            </div>
          </div>
        </div>
      )}

      {/* Per-group daily table */}
      {detail && (
        <div className="sky-report-section">
          <h3>Daily Details</h3>
          <table className="sky-report-table sky-report-detail-table">
            <thead>
              <tr>
                <th>Day</th>
                <th>Resolved</th>
                <th>Opened</th>
                <th>Net</th>
                <th>Avg Time</th>
                <th>SLA %</th>
                <th>Escalated</th>
              </tr>
            </thead>
            <tbody>
              {detail.daily.map((d, i) => {
                const net = d.resolved - d.opened
                return (
                  <tr key={DAYS[i].key}>
                    <td className="sky-rg-name">{DAYS[i].short} {DAYS[i].label}</td>
                    <td className="sky-rg-num green">{fmt(d.resolved)}</td>
                    <td className="sky-rg-num">{fmt(d.opened)}</td>
                    <td className={`sky-rg-num ${net > 0 ? 'green' : net < 0 ? 'red' : ''}`}>{net > 0 ? '+' : ''}{fmt(net)}</td>
                    <td className="sky-rg-num">{d.avgMinutes} min</td>
                    <td className="sky-rg-num">
                      <span className={`sky-sla-pill ${d.slaHit >= 90 ? 'good' : d.slaHit >= 75 ? 'warn' : 'bad'}`}>{d.slaHit}%</span>
                    </td>
                    <td className="sky-rg-num">{fmt(d.escalated)}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
