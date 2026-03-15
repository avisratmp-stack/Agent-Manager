import React, { useState } from 'react'
import {
  Save, RotateCcw, List, Map, Server, Grid3x3, Zap, Settings,
  Eye, EyeOff, ChevronDown, ChevronUp, Gauge, Tag, Columns, Layout, Bot, Plug
} from 'lucide-react'

const SECTION_ICONS = {
  general: Layout,
  list: List,
  defaults: Bot,
  stages: Gauge,
  map: Map,
  columns: Columns,
}

const VIEW_OPTIONS = [
  { value: 'list', label: 'Agents & Local MCPs' },
  { value: 'map', label: 'Operation Map' },
  { value: 'mcp', label: 'External MCP' },
  { value: 'matrix', label: 'Agent to MCPs' },
  { value: 'test', label: 'Test' },
]

const ALL_COLUMN_KEYS = [
  { key: 'icon', label: 'Icon', alwaysOn: true },
  { key: 'origin', label: 'Origin' },
  { key: 'name', label: 'Name', alwaysOn: true },
  { key: 'description', label: 'Description' },
  { key: 'version', label: 'Version' },
  { key: 'url', label: 'URL' },
  { key: 'stage', label: 'Stage' },
  { key: 'public', label: 'Public' },
  { key: 'live', label: 'Live' },
]

const SORT_OPTIONS = [
  { value: '', label: 'None' },
  { value: 'name', label: 'Name' },
  { value: 'origin', label: 'Origin' },
  { value: 'stage', label: 'Stage' },
  { value: 'version', label: 'Version' },
  { value: 'live', label: 'Live' },
]

const DEFAULT_CONFIG = {
  appTitle: 'IT Operation',
  defaultView: 'list',
  sidebarOpen: true,
  pageSize: 50,
  visibleColumns: ['icon', 'origin', 'name', 'description', 'version', 'url', 'stage', 'public', 'live'],
  defaultSortColumn: '',
  defaultSortDirection: 'asc',
  defaultAgentStage: 'Draft',
  defaultMcpStage: 'Draft',
  defaultAgentRole: 'public',
  defaultAgentOrigin: 'local',
  defaultMcpOrigin: 'external',
  stagePipeline: ['Draft', 'Design', 'Dev', 'Released'],
  mapShowConnections: true,
  mapLayout: 'horizontal',
}

export function getDefaultConfig() {
  try {
    const saved = localStorage.getItem('obs-agents-config')
    if (saved) {
      return { ...DEFAULT_CONFIG, ...JSON.parse(saved) }
    }
  } catch {}
  return { ...DEFAULT_CONFIG }
}

export default function ConfigurationPanel({ config, onConfigChange }) {
  const [local, setLocal] = useState({ ...config })
  const [expandedSections, setExpandedSections] = useState({
    general: true, list: true, defaults: true, stages: true, map: true, columns: true
  })
  const [dirty, setDirty] = useState(false)

  const update = (key, value) => {
    setLocal(prev => ({ ...prev, [key]: value }))
    setDirty(true)
  }

  const toggleSection = (section) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }))
  }

  const handleSave = () => {
    localStorage.setItem('obs-agents-config', JSON.stringify(local))
    onConfigChange(local)
    setDirty(false)
  }

  const handleReset = () => {
    const defaults = { ...DEFAULT_CONFIG }
    setLocal(defaults)
    localStorage.removeItem('obs-agents-config')
    onConfigChange(defaults)
    setDirty(false)
  }

  const toggleColumn = (key) => {
    const cols = local.visibleColumns.includes(key)
      ? local.visibleColumns.filter(c => c !== key)
      : [...local.visibleColumns, key]
    update('visibleColumns', cols)
  }

  const renderSection = (id, title, children) => {
    const Icon = SECTION_ICONS[id] || Settings
    const open = expandedSections[id]
    return (
      <div className="cfg-section" key={id}>
        <div className="cfg-section-header" onClick={() => toggleSection(id)}>
          <Icon size={16} />
          <span>{title}</span>
          {open ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </div>
        {open && <div className="cfg-section-body">{children}</div>}
      </div>
    )
  }

  return (
    <div className="cfg-panel">
      <div className="cfg-header">
        <h2><Settings size={20} /> Configuration</h2>
        <div className="cfg-header-actions">
          <button className="ac-btn cfg-btn-reset" onClick={handleReset} title="Reset to defaults">
            <RotateCcw size={14} /> Reset Defaults
          </button>
          <button
            className={`ac-btn ac-btn-create cfg-btn-save ${dirty ? 'dirty' : ''}`}
            onClick={handleSave}
            disabled={!dirty}
          >
            <Save size={14} /> Save Changes
          </button>
        </div>
      </div>

      <div className="cfg-body">
        <div className="cfg-grid">
          {/* General Settings */}
          {renderSection('general', 'General', (
            <>
              <div className="cfg-field">
                <label>Application Title</label>
                <input
                  type="text"
                  value={local.appTitle}
                  onChange={e => update('appTitle', e.target.value)}
                  placeholder="IT Operation"
                />
                <span className="cfg-hint">Displayed in the header breadcrumb</span>
              </div>
              <div className="cfg-field">
                <label>Default View</label>
                <select value={local.defaultView} onChange={e => update('defaultView', e.target.value)}>
                  {VIEW_OPTIONS.map(v => <option key={v.value} value={v.value}>{v.label}</option>)}
                </select>
                <span className="cfg-hint">Which page loads when the app starts</span>
              </div>
              <div className="cfg-field">
                <label>Sidebar Default State</label>
                <div className="cfg-toggle-row">
                  <label className="cfg-toggle">
                    <input
                      type="checkbox"
                      checked={local.sidebarOpen}
                      onChange={e => update('sidebarOpen', e.target.checked)}
                    />
                    <span className="cfg-toggle-track" />
                  </label>
                  <span className="cfg-toggle-label">{local.sidebarOpen ? 'Expanded' : 'Collapsed'}</span>
                </div>
              </div>
            </>
          ))}

          {/* List View Settings */}
          {renderSection('list', 'List View', (
            <>
              <div className="cfg-field">
                <label>Default Page Size</label>
                <select value={local.pageSize} onChange={e => update('pageSize', Number(e.target.value))}>
                  {[10, 20, 50, 100].map(n => <option key={n} value={n}>{n}</option>)}
                </select>
              </div>
              <div className="cfg-field">
                <label>Default Sort Column</label>
                <div className="cfg-row">
                  <select value={local.defaultSortColumn} onChange={e => update('defaultSortColumn', e.target.value)}>
                    {SORT_OPTIONS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                  </select>
                  <select value={local.defaultSortDirection} onChange={e => update('defaultSortDirection', e.target.value)}>
                    <option value="asc">Ascending</option>
                    <option value="desc">Descending</option>
                  </select>
                </div>
              </div>
            </>
          ))}

          {/* Visible Columns */}
          {renderSection('columns', 'Visible Columns', (
            <div className="cfg-columns-grid">
              {ALL_COLUMN_KEYS.map(col => (
                <label key={col.key} className={`cfg-col-option ${col.alwaysOn ? 'locked' : ''}`}>
                  <input
                    type="checkbox"
                    checked={local.visibleColumns.includes(col.key)}
                    disabled={col.alwaysOn}
                    onChange={() => toggleColumn(col.key)}
                  />
                  <span>{col.label}</span>
                  {col.alwaysOn && <span className="cfg-locked-badge">Required</span>}
                </label>
              ))}
            </div>
          ))}

          {/* Agent/MCP Defaults */}
          {renderSection('defaults', 'Agent & MCP Defaults', (
            <>
              <div className="cfg-field-group">
                <h4><Bot size={14} /> New Agent Defaults</h4>
                <div className="cfg-field">
                  <label>Default Stage</label>
                  <select value={local.defaultAgentStage} onChange={e => update('defaultAgentStage', e.target.value)}>
                    {local.stagePipeline.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div className="cfg-field">
                  <label>Default Role</label>
                  <select value={local.defaultAgentRole} onChange={e => update('defaultAgentRole', e.target.value)}>
                    <option value="public">Public</option>
                    <option value="sub-agent">Sub-Agent (Private)</option>
                  </select>
                </div>
                <div className="cfg-field">
                  <label>Default Origin</label>
                  <select value={local.defaultAgentOrigin} onChange={e => update('defaultAgentOrigin', e.target.value)}>
                    <option value="local">Local</option>
                    <option value="external">External</option>
                  </select>
                </div>
              </div>
              <div className="cfg-field-group">
                <h4><Plug size={14} /> New MCP Defaults</h4>
                <div className="cfg-field">
                  <label>Default Stage</label>
                  <select value={local.defaultMcpStage} onChange={e => update('defaultMcpStage', e.target.value)}>
                    {local.stagePipeline.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div className="cfg-field">
                  <label>Default Origin</label>
                  <select value={local.defaultMcpOrigin} onChange={e => update('defaultMcpOrigin', e.target.value)}>
                    <option value="local">Local</option>
                    <option value="external">External</option>
                  </select>
                </div>
              </div>
            </>
          ))}

          {/* Stage Pipeline */}
          {renderSection('stages', 'Stage Pipeline', (
            <>
              <div className="cfg-pipeline">
                {local.stagePipeline.map((stage, i) => (
                  <div key={i} className="cfg-pipeline-step">
                    <div className="cfg-pipeline-dot" />
                    <input
                      type="text"
                      value={stage}
                      onChange={e => {
                        const updated = [...local.stagePipeline]
                        updated[i] = e.target.value
                        update('stagePipeline', updated)
                      }}
                    />
                    {local.stagePipeline.length > 2 && (
                      <button
                        className="cfg-pipeline-remove"
                        onClick={() => update('stagePipeline', local.stagePipeline.filter((_, j) => j !== i))}
                        title="Remove stage"
                      >×</button>
                    )}
                    {i < local.stagePipeline.length - 1 && <div className="cfg-pipeline-arrow">→</div>}
                  </div>
                ))}
              </div>
              <button
                className="ac-btn cfg-btn-add-stage"
                onClick={() => update('stagePipeline', [...local.stagePipeline, 'New Stage'])}
              >
                + Add Stage
              </button>
              <span className="cfg-hint">Define the lifecycle stages for agents and MCPs. Order matters (left = earliest).</span>
            </>
          ))}

          {/* Map Settings */}
          {renderSection('map', 'Operation Map', (
            <>
              <div className="cfg-field">
                <label>Show Connections by Default</label>
                <div className="cfg-toggle-row">
                  <label className="cfg-toggle">
                    <input
                      type="checkbox"
                      checked={local.mapShowConnections}
                      onChange={e => update('mapShowConnections', e.target.checked)}
                    />
                    <span className="cfg-toggle-track" />
                  </label>
                  <span className="cfg-toggle-label">{local.mapShowConnections ? 'Visible' : 'Hidden'}</span>
                </div>
              </div>
              <div className="cfg-field">
                <label>Default Map Layout</label>
                <select value={local.mapLayout} onChange={e => update('mapLayout', e.target.value)}>
                  <option value="horizontal">Horizontal (Left → Right)</option>
                  <option value="vertical">Vertical (Top → Bottom)</option>
                </select>
              </div>
            </>
          ))}
        </div>
      </div>
    </div>
  )
}
