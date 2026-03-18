import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react'
import {
  Plus, Pencil, Trash2, Search, Upload, ChevronLeft, ChevronRight,
  Menu, LayoutDashboard, ListTodo, Inbox, Activity, FileText, Settings,
  Cloud, Bot, Workflow, Gauge, Rocket, Wrench, ChevronDown, ChevronUp,
  ChevronRightIcon, Copy, Map, List, Server, Eye, Grid3x3, Tag, X,
  Plug, Zap, LayoutGrid, GitBranchPlus, User, Shield
} from 'lucide-react'
import AgentFormDialog from './AgentFormDialog'
import AgentDetailPanel from './AgentDetailPanel'
import AgentMapPanel from './AgentMapPanel'
import McpServersPanel, { McpServerDialog } from './McpServersPanel'
import AgentMcpMatrixPanel from './AgentMcpMatrixPanel'
import AgentLogViewer from './AgentLogViewer'
import AgentTestPanel from './AgentTestPanel'
import AgentCardsPanel from './AgentCardsPanel'
import AgentMapVerticalPanel from './AgentMapVerticalPanel'
import ConfigurationPanel, { getDefaultConfig } from './ConfigurationPanel'
import SkyTasksPanel from './SkyTasksPanel'
import SkyTrackingReport from './SkyTrackingReport'
import TicketDetails2 from './TicketDetails2'
import { api } from '../../api'
import './AgentConfig.css'
import './SkyTasks.css'

const SIDEBAR_ITEMS_BASE = [
  { icon: Bot, label: '__SECTION__', highlight: true, section: true },
  { icon: List, label: 'Agents & Local MCPs', view: 'list', sub: true },
  { icon: Map, label: 'Operation Graph', view: 'map', sub: true },
  { icon: Server, label: 'External MCP', view: 'mcp', sub: true },
  { icon: Grid3x3, label: 'Agent to MCPs', view: 'matrix', sub: true },
  { icon: Zap, label: 'Test', view: 'test', sub: true },
  { icon: Cloud, label: 'Resolver: Sky', highlight: true, section: true, sky: true },
  { icon: ListTodo, label: 'Tasks List', view: 'sky-tasks', sub: true, sky: true },
  { icon: Workflow, label: 'Ticket Details 2', view: 'sky-ticket2', sub: true, sky: true },
  { icon: Activity, label: 'Tracking Report', view: 'sky-report', sub: true, sky: true },
  { icon: Settings, label: 'Configuration', view: 'config' },
]

const COLUMNS = [
  { key: 'icon', label: '', width: '36px' },
  { key: 'origin', label: 'Origin', width: '90px' },
  { key: 'name', label: 'Name', width: '1fr' },
  { key: 'description', label: 'Description', width: '1.5fr' },
  { key: 'version', label: 'Version', width: '100px' },
  { key: 'url', label: 'URL', width: '1.2fr' },
  { key: 'stage', label: 'Stage', width: '90px' },
  { key: 'public', label: 'Public', width: '80px' },
  { key: 'live', label: 'Live', width: '64px' },
]

const AgentConfig = () => {
  const [appConfig, setAppConfig] = useState(() => getDefaultConfig())
  const [agents, setAgents] = useState([])
  const [consumers, setConsumers] = useState([])
  const [mcpServers, setMcpServers] = useState([])
  const [activeView, setActiveView] = useState(() => getDefaultConfig().defaultView || 'list')

  const [selectedId, setSelectedId] = useState(null)
  const [previewId, setPreviewId] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [dialogMode, setDialogMode] = useState('create')
  const [sortColumn, setSortColumn] = useState(() => getDefaultConfig().defaultSortColumn || null)
  const [sortDirection, setSortDirection] = useState(() => getDefaultConfig().defaultSortDirection || 'asc')
  const [pageSize, setPageSize] = useState(() => getDefaultConfig().pageSize || 50)
  const [currentPage, setCurrentPage] = useState(1)
  const [sidebarOpen, setSidebarOpen] = useState(() => getDefaultConfig().sidebarOpen !== false)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [mcpAddTrigger, setMcpAddTrigger] = useState(0)
  const [mcpEditTarget, setMcpEditTarget] = useState(null)
  const [selectedMcpId, setSelectedMcpId] = useState(null)
  const [logViewer, setLogViewer] = useState(null)
  const [importing, setImporting] = useState(false)
  const [importPendingFile, setImportPendingFile] = useState(null)
  const [importPartialData, setImportPartialData] = useState(null)
  const [selectedTags, setSelectedTags] = useState([])
  const [tagDropdownOpen, setTagDropdownOpen] = useState(false)
  const [selectedStages, setSelectedStages] = useState([])
  const [stageDropdownOpen, setStageDropdownOpen] = useState(false)
  const [loggedIn, setLoggedIn] = useState(true)
  const [loginError, setLoginError] = useState('')
  const [configPwOpen, setConfigPwOpen] = useState(false)
  const [configPwValue, setConfigPwValue] = useState('')
  const [configPwError, setConfigPwError] = useState(false)
  const importInputRef = useRef(null)
  const tagDropdownRef = useRef(null)
  const stageDropdownRef = useRef(null)

  const refreshAgents = useCallback(async () => {
    try {
      const data = await api.getAgents()
      setAgents(data)
    } catch (err) { console.error('Failed to load agents', err) }
  }, [])

  useEffect(() => {
    refreshAgents()
    api.getConsumers().then(setConsumers).catch(err => console.error('Failed to load consumers', err))
    api.getMcpServers().then(setMcpServers).catch(err => console.error('Failed to load MCP servers', err))
  }, [refreshAgents])

  useEffect(() => {
    if (!tagDropdownOpen) return
    const handler = (e) => {
      if (tagDropdownRef.current && !tagDropdownRef.current.contains(e.target)) setTagDropdownOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [tagDropdownOpen])

  useEffect(() => {
    if (!stageDropdownOpen) return
    const handler = (e) => {
      if (stageDropdownRef.current && !stageDropdownRef.current.contains(e.target)) setStageDropdownOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [stageDropdownOpen])

  const handleConfigChange = useCallback((newConfig) => {
    setAppConfig(newConfig)
    setPageSize(newConfig.pageSize || 50)
    setSidebarOpen(newConfig.sidebarOpen !== false)
    if (newConfig.defaultSortColumn !== undefined) setSortColumn(newConfig.defaultSortColumn || null)
    if (newConfig.defaultSortDirection) setSortDirection(newConfig.defaultSortDirection)
  }, [])

  const SIDEBAR_ITEMS = useMemo(() =>
    SIDEBAR_ITEMS_BASE
      .filter(item => !item.sky || appConfig.showSkyMenu !== false)
      .map(item =>
        item.label === '__SECTION__'
          ? { ...item, label: appConfig.sectionTitle || 'Observability' }
          : item
      ), [appConfig.sectionTitle, appConfig.showSkyMenu])

  const visibleColumns = useMemo(() => {
    const visible = appConfig.visibleColumns || ['icon', 'origin', 'name', 'description', 'version', 'url', 'stage', 'public', 'live']
    return COLUMNS.filter(col => visible.includes(col.key))
  }, [appConfig.visibleColumns])

  const ALL_STAGES = appConfig.stagePipeline || ['Draft', 'Design', 'Dev', 'Released']

  const toggleStage = (stage) => {
    setSelectedStages(prev => prev.includes(stage) ? prev.filter(s => s !== stage) : [...prev, stage])
    setCurrentPage(1)
  }

  const allTags = useMemo(() => {
    const set = new Set()
    agents.forEach(a => (a.tags || []).forEach(t => set.add(t)))
    mcpServers.forEach(s => (s.tags || []).forEach(t => set.add(t)))
    return [...set].sort()
  }, [agents, mcpServers])

  const toggleTag = (tag) => {
    setSelectedTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag])
    setCurrentPage(1)
  }

  const filteredMcpServers = useMemo(() => {
    let result = mcpServers
    const envFilter = appConfig.activeEnvironment
    if (envFilter) {
      result = result.filter(s => (s.environment || 'AOC') === envFilter)
    }
    if (selectedTags.length > 0) {
      result = result.filter(s => selectedTags.some(t => (s.tags || []).includes(t)))
    }
    if (selectedStages.length > 0) {
      result = result.filter(s => selectedStages.includes(s.stage || 'Draft'))
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      result = result.filter(s =>
        (s.name || '').toLowerCase().includes(q) ||
        (s.id || '').toLowerCase().includes(q) ||
        (s.description || '').toLowerCase().includes(q) ||
        (s.tags || []).some(t => t.toLowerCase().includes(q)) ||
        (s.tools || []).some(t => (typeof t === 'string' ? t : t.name || '').toLowerCase().includes(q))
      )
    }
    return result
  }, [mcpServers, selectedTags, selectedStages, searchQuery, appConfig.activeEnvironment])

  const filteredAgents = useMemo(() => {
    return agents.filter(a => {
      const envFilter = appConfig.activeEnvironment
      if (envFilter && (a.environment || 'AOC') !== envFilter) return false
      if (selectedTags.length > 0) {
        if (!selectedTags.some(t => (a.tags || []).includes(t))) return false
      }
      if (selectedStages.length > 0) {
        if (!selectedStages.includes(a.stage || 'Draft')) return false
      }
      if (!searchQuery) return true
      const q = searchQuery.toLowerCase()
      return (
        (a.agent.name || '').toLowerCase().includes(q) ||
        (a.agent.description || '').toLowerCase().includes(q) ||
        (a.agent.url || '').toLowerCase().includes(q) ||
        (a.agent.version || '').toLowerCase().includes(q) ||
        (a.type || '').toLowerCase().includes(q) ||
        (a.tags || []).some(t => t.toLowerCase().includes(q)) ||
        String(a.id).includes(q)
      )
    })
  }, [agents, searchQuery, selectedTags, selectedStages, appConfig.activeEnvironment])

  const localMcpServers = useMemo(() => mcpServers.filter(s => s.type === 'local'), [mcpServers])

  const listItems = useMemo(() => {
    const agentRows = agents.map(a => ({
      _kind: 'agent',
      _uid: `a-${a.id}`,
      _sortId: a.id,
      _name: a.agent.name || '',
      _desc: a.agent.description || '',
      _version: a.agent.version || '',
      _url: a.agent.url || '',
      _type: a.type || 'external',
      _stage: a.stage || 'Draft',
      _role: a.role,
      _enabled: a.enabled !== false,
      _tags: a.tags || [],
      _env: a.environment || 'AOC',
      raw: a,
    }))

    const mcpRows = localMcpServers.map((s, idx) => ({
      _kind: 'mcp',
      _uid: `m-${s.id}`,
      _sortId: 10000 + idx,
      _name: s.name || '',
      _desc: s.description || '',
      _version: s.version || '',
      _url: '',
      _type: s.type || 'local',
      _stage: s.stage || 'Draft',
      _role: s.role || 'public',
      _enabled: s.enabled !== false,
      _tags: s.tags || [],
      _env: s.environment || 'AOC',
      raw: s,
    }))

    let result = [...agentRows, ...mcpRows]

    const envFilter = appConfig.activeEnvironment
    if (envFilter) {
      result = result.filter(r => r._env === envFilter)
    }

    if (selectedTags.length > 0) {
      result = result.filter(r => selectedTags.some(t => r._tags.includes(t)))
    }

    if (selectedStages.length > 0) {
      result = result.filter(r => selectedStages.includes(r._stage))
    }

    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      result = result.filter(r =>
        r._name.toLowerCase().includes(q) ||
        r._desc.toLowerCase().includes(q) ||
        r._url.toLowerCase().includes(q) ||
        r._type.toLowerCase().includes(q) ||
        r._tags.some(t => t.toLowerCase().includes(q)) ||
        String(r._sortId).includes(q)
      )
    }

    if (sortColumn) {
      result = [...result].sort((a, b) => {
        let valA, valB
        switch (sortColumn) {
          case 'id': valA = a._sortId; valB = b._sortId; break
          case 'origin': valA = a._type; valB = b._type; break
          case 'name': valA = a._name; valB = b._name; break
          case 'description': valA = a._desc; valB = b._desc; break
          case 'version': valA = a._version; valB = b._version; break
          case 'url': valA = a._url; valB = b._url; break
          case 'stage': valA = a._stage; valB = b._stage; break
          case 'public': valA = a._role === 'sub-agent' || a._role === 'private' ? 1 : 0; valB = b._role === 'sub-agent' || b._role === 'private' ? 1 : 0; break
          case 'live': valA = a._enabled ? 1 : 0; valB = b._enabled ? 1 : 0; break
          case 'icon': valA = a._kind; valB = b._kind; break
          default: return 0
        }
        if (typeof valA === 'string') {
          return sortDirection === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA)
        }
        return sortDirection === 'asc' ? valA - valB : valB - valA
      })
    }

    return result
  }, [agents, localMcpServers, selectedTags, selectedStages, searchQuery, sortColumn, sortDirection, appConfig.activeEnvironment])

  const totalPages = Math.max(1, Math.ceil(listItems.length / pageSize))
  const pagedItems = listItems.slice((currentPage - 1) * pageSize, currentPage * pageSize)

  const handleSort = (key) => {
    if (sortColumn === key) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc')
    } else {
      setSortColumn(key)
      setSortDirection('asc')
    }
  }

  const handleCreate = () => {
    setDialogMode('create')
    setDialogOpen(true)
  }

  const handleUpdate = () => {
    if (mcpEditTarget) {
      return
    }
    if (selectedMcpId) {
      const srv = mcpServers.find(s => s.id === selectedMcpId)
      if (srv) setMcpEditTarget(srv)
      return
    }
    if (!selectedId) return
    setDialogMode('edit')
    setDialogOpen(true)
  }

  const handleDelete = () => {
    if (selectedMcpId) {
      setDeleteConfirmOpen(true)
      return
    }
    if (!selectedId) return
    setDeleteConfirmOpen(true)
  }

  const confirmDelete = async () => {
    try {
      if (selectedMcpId) {
        const updated = await api.deleteMcpServer(selectedMcpId)
        setMcpServers(updated)
        setSelectedMcpId(null)
      } else {
        await api.deleteAgent(selectedId)
        setAgents(prev => prev.filter(a => a.id !== selectedId))
        setSelectedId(null)
        setPreviewId(null)
      }
    } catch (err) { console.error('Delete failed', err) }
    setDeleteConfirmOpen(false)
  }

  const handleMcpEditSave = async (formData) => {
    try {
      if (!formData.environment) formData.environment = appConfig.defaultEnvironment || 'AOC'
      const updated = mcpEditTarget?.id
        ? await api.updateMcpServer(mcpEditTarget.id, formData)
        : await api.createMcpServer(formData)
      setMcpServers(updated)
    } catch (err) { console.error('MCP save failed', err) }
    setMcpEditTarget(null)
  }

  const handleSave = async (formData) => {
    try {
      if (dialogMode === 'create') {
        const record = await api.createAgent({
          type: formData.type || appConfig.defaultAgentOrigin || 'local',
          slug: formData.slug || null,
          stage: formData.stage || appConfig.defaultAgentStage || 'Draft',
          environment: formData.environment || appConfig.defaultEnvironment || 'AOC',
          agent: formData.agent,
        })
        setAgents(prev => [...prev, record])
        setSelectedId(record.id)
      } else {
        const updated = await api.updateAgent(selectedId, {
          type: formData.type,
          slug: formData.slug,
          stage: formData.stage || appConfig.defaultAgentStage || 'Draft',
          environment: formData.environment || appConfig.defaultEnvironment || 'AOC',
          agent: formData.agent,
        })
        setAgents(prev => prev.map(a => a.id === selectedId ? updated : a))
      }
    } catch (err) { console.error('Save failed', err) }
    setDialogOpen(false)
  }

  const handleImportAgent = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    e.target.value = ''
    setImporting(true)
    try {
      const result = await api.importAgent(file)
      if (result.status === 'complete') {
        setAgents(prev => [...prev, result.record])
        setSelectedId(result.record.id)
      } else if (result.status === 'incomplete') {
        setImportPendingFile(file)
        setImportPartialData(result.partial)
        setDialogMode('import')
        setDialogOpen(true)
      }
    } catch (err) {
      alert('Import failed: ' + err.message)
    } finally {
      setImporting(false)
    }
  }

  const handleImportSave = async (formData) => {
    if (!importPendingFile) return
    try {
      const agentDef = {
        ...importPartialData,
        type: formData.type || importPartialData?.type || 'local',
        slug: formData.slug || importPartialData?.slug || null,
        stage: formData.stage || importPartialData?.stage || appConfig.defaultAgentStage || 'Draft',
        calls: importPartialData?.calls || [],
        mcpBindings: importPartialData?.mcpBindings || [],
        tags: importPartialData?.tags || [],
        agent: formData.agent,
      }
      const result = await api.importAgentConfirm(importPendingFile, agentDef)
      if (result.status === 'complete') {
        setAgents(prev => [...prev, result.record])
        setSelectedId(result.record.id)
      }
    } catch (err) {
      alert('Import save failed: ' + err.message)
    } finally {
      setImportPendingFile(null)
      setImportPartialData(null)
      setDialogOpen(false)
    }
  }

  const handleUpdateSkills = (updatedSkills) => {
    setAgents(prev => prev.map(a =>
      a.id === previewId ? { ...a, managedSkills: updatedSkills } : a
    ))
  }

  const handleUpdateReference = (updatedReference) => {
    setAgents(prev => prev.map(a =>
      a.id === previewId ? { ...a, references: updatedReference } : a
    ))
  }

  const handleUpdateMcpBindings = (updatedBindings) => {
    setAgents(prev => prev.map(a =>
      a.id === previewId ? { ...a, mcpBindings: updatedBindings } : a
    ))
  }

  const handleToggleAgent = async (agentId, currentEnabled) => {
    const newEnabled = !currentEnabled
    setAgents(prev => prev.map(a => a.id === agentId ? { ...a, enabled: newEnabled } : a))
    try {
      await api.toggleAgentEnabled(agentId, newEnabled)
    } catch (err) {
      console.error('Toggle failed', err)
      setAgents(prev => prev.map(a => a.id === agentId ? { ...a, enabled: currentEnabled } : a))
    }
  }

  const handleToggleMcp = async (mcpId, currentEnabled) => {
    const newEnabled = !currentEnabled
    setMcpServers(prev => prev.map(s => s.id === mcpId ? { ...s, enabled: newEnabled } : s))
    try {
      await api.toggleMcpEnabled(mcpId, newEnabled)
    } catch (err) {
      console.error('Toggle MCP failed', err)
      setMcpServers(prev => prev.map(s => s.id === mcpId ? { ...s, enabled: currentEnabled } : s))
    }
  }

  const selectedAgent = selectedId ? agents.find(a => a.id === selectedId) : null
  const previewAgent = previewId ? agents.find(a => a.id === previewId) : null

  if (!loggedIn) {
    return (
      <div className="ac-login-page">
        <form className="ac-login-form" onSubmit={e => {
          e.preventDefault()
          const u = e.target.user.value
          const p = e.target.pass.value
          if (u === '1' && p === '1') { setLoggedIn(true); setLoginError('') }
          else setLoginError('Invalid username or password')
        }}>
          <h2 className="ac-login-title">
            <div className="ac-login-logo"><Bot size={24} /></div>
            AOC Sign In
          </h2>
          <div className="ac-login-field">
            <label>Username</label>
            <input name="user" type="text" autoFocus placeholder="Enter username" />
          </div>
          <div className="ac-login-field">
            <label>Password</label>
            <input name="pass" type="password" placeholder="Enter password" />
          </div>
          {loginError && <div className="ac-login-error">{loginError}</div>}
          <button type="submit" className="ac-login-btn">Sign In</button>
          <div className="ac-login-sub">AOC | Diagnostic</div>
        </form>
      </div>
    )
  }

  return (
    <div className="ac-layout">
      {configPwOpen && (
        <div className="dialog-overlay" onClick={() => setConfigPwOpen(false)}>
          <div className="ac-pw-dialog" onClick={e => e.stopPropagation()}>
            <h3>Configuration Access</h3>
            <p>Enter password to access configuration.</p>
            <form onSubmit={e => {
              e.preventDefault()
              if (configPwValue === '00') {
                setConfigPwOpen(false)
                setActiveView('config')
              } else {
                setConfigPwError(true)
              }
            }}>
              <input
                type="password"
                className={configPwError ? 'input-error' : ''}
                value={configPwValue}
                onChange={e => { setConfigPwValue(e.target.value); setConfigPwError(false) }}
                autoFocus
                placeholder="••••"
              />
              {configPwError && <span className="ac-pw-error">Incorrect password</span>}
              <div className="ac-pw-actions">
                <button type="button" className="btn btn-cancel" onClick={() => setConfigPwOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-save">Unlock</button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Header */}
      <header className="ac-header">
        <div className="ac-header-left">
          <button className="ac-menu-btn" onClick={() => setSidebarOpen(!sidebarOpen)}>
            <Menu size={18} />
          </button>
          <span className="ac-logo">{appConfig.appTitle || 'IT Operation'}</span>
          {(() => {
            let section = ''
            for (const item of SIDEBAR_ITEMS) {
              if (item.section) section = item.label
              if (item.view === activeView) break
            }
            const page = (SIDEBAR_ITEMS.find(i => i.view === activeView) || {}).label || 'Agent Config'
            const currentItem = SIDEBAR_ITEMS.find(i => i.view === activeView)
            const hasSection = currentItem && currentItem.sub
            return <>
              {hasSection && <>
                <ChevronRightIcon size={14} style={{ color: '#cbd5e1' }} />
                <span className="ac-header-section">{section}</span>
              </>}
              <ChevronRightIcon size={14} style={{ color: '#cbd5e1' }} />
              <span className="ac-header-page">{page}</span>
            </>
          })()}
        </div>
        <div className="ac-header-right">
          <div className="ac-avatar">
            <img src="https://ui-avatars.com/api/?name=Admin&background=6d28d9&color=fff&size=32&rounded=true" alt="user" />
          </div>
          <span className="ac-username">admin</span>
        </div>
      </header>

      <div className="ac-body">
        {/* Sidebar */}
        <nav className={`ac-sidebar ${sidebarOpen ? 'open' : 'collapsed'}`}>
          {SIDEBAR_ITEMS.map((item, i) => (
            <div
              key={i}
              className={`ac-sidebar-item${item.section ? ' section' : ''}${item.sub ? ' sub' : ''}${item.highlight ? ' active' : ''}${item.view && activeView === item.view ? ' active' : ''}`}
              title={item.label}
              onClick={item.view ? () => {
                if (item.view === 'config') {
                  setConfigPwValue('')
                  setConfigPwError(false)
                  setConfigPwOpen(true)
                  return
                }
                setActiveView(item.view)
              } : undefined}
              style={item.view ? { cursor: 'pointer' } : undefined}
            >
              <item.icon size={item.sub ? 15 : 18} />
              {sidebarOpen && <span>{item.label}</span>}
            </div>
          ))}
        </nav>

        {/* Main Content */}
        <main className="ac-main">
          {/* Toolbar */}
          <div className="ac-toolbar">
            <div className="ac-toolbar-actions">
              {(activeView === 'list' || activeView === 'cards' || activeView === 'map') && (
                <>
                  <button className="ac-btn ac-btn-create" onClick={handleCreate}>
                    <Plus size={14} /> Create Agent / MCP
                  </button>
                  <button
                    className="ac-btn ac-btn-update"
                    onClick={handleUpdate}
                    disabled={!selectedId && !selectedMcpId}
                  >
                    <Pencil size={14} /> Update
                  </button>
                  <button
                    className="ac-btn ac-btn-delete"
                    onClick={handleDelete}
                    disabled={!selectedId && !selectedMcpId}
                  >
                    <Trash2 size={14} /> Delete
                  </button>
                  <button
                    className="ac-btn ac-btn-import"
                    onClick={() => importInputRef.current?.click()}
                    disabled={importing}
                  >
                    <Upload size={14} /> {importing ? 'Importing…' : 'Import Agent'}
                  </button>
                  <input
                    ref={importInputRef}
                    type="file"
                    accept=".zip"
                    style={{ display: 'none' }}
                    onChange={handleImportAgent}
                  />
                </>
              )}
              {activeView === 'mcp' && (
                <button className="ac-btn ac-btn-create ac-btn-mcp" onClick={() => setMcpAddTrigger(t => t + 1)}>
                  <Plus size={14} /> Add MCP
                </button>
              )}
            </div>
            <div className="ac-toolbar-search">
              <Search size={16} className="ac-search-icon" />
              <input
                type="text"
                placeholder="Local Search"
                value={searchQuery}
                onChange={e => { setSearchQuery(e.target.value); setCurrentPage(1) }}
              />
            </div>
            <div className="ac-tag-filter" ref={tagDropdownRef}>
              <button
                className={`ac-btn ac-btn-tag ${selectedTags.length > 0 ? 'active' : ''}`}
                onClick={() => setTagDropdownOpen(v => !v)}
              >
                <Tag size={14} />
                Tags{selectedTags.length > 0 && <span className="ac-tag-count">{selectedTags.length}</span>}
              </button>
              {selectedTags.length > 0 && (
                <button className="ac-tag-clear" onClick={() => { setSelectedTags([]); setCurrentPage(1) }} title="Clear all tags">
                  <X size={12} />
                </button>
              )}
              {tagDropdownOpen && (
                <div className="ac-tag-dropdown">
                  {allTags.map(tag => (
                    <label key={tag} className={`ac-tag-option ${selectedTags.includes(tag) ? 'selected' : ''}`}>
                      <input
                        type="checkbox"
                        checked={selectedTags.includes(tag)}
                        onChange={() => toggleTag(tag)}
                      />
                      <span>{tag}</span>
                    </label>
                  ))}
                  {allTags.length === 0 && <div className="ac-tag-empty">No tags</div>}
                </div>
              )}
            </div>
            <div className="ac-tag-filter" ref={stageDropdownRef}>
              <button
                className={`ac-btn ac-btn-tag ${selectedStages.length > 0 ? 'active' : ''}`}
                onClick={() => setStageDropdownOpen(v => !v)}
              >
                <Gauge size={14} />
                Stage{selectedStages.length > 0 && <span className="ac-tag-count">{selectedStages.length}</span>}
              </button>
              {selectedStages.length > 0 && (
                <button className="ac-tag-clear" onClick={() => { setSelectedStages([]); setCurrentPage(1) }} title="Clear stage filter">
                  <X size={12} />
                </button>
              )}
              {stageDropdownOpen && (
                <div className="ac-tag-dropdown">
                  {ALL_STAGES.map(stage => (
                    <label key={stage} className={`ac-tag-option ${selectedStages.includes(stage) ? 'selected' : ''}`}>
                      <input
                        type="checkbox"
                        checked={selectedStages.includes(stage)}
                        onChange={() => toggleStage(stage)}
                      />
                      <span>{stage}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>
          </div>
          {(selectedTags.length > 0 || selectedStages.length > 0) && (
            <div className="ac-tag-chips">
              {selectedStages.map(stage => (
                <span key={`s-${stage}`} className="ac-tag-chip ac-stage-chip" onClick={() => toggleStage(stage)}>
                  {stage} <X size={10} />
                </span>
              ))}
              {selectedTags.map(tag => (
                <span key={tag} className="ac-tag-chip" onClick={() => toggleTag(tag)}>
                  {tag} <X size={10} />
                </span>
              ))}
            </div>
          )}

          {activeView === 'sky-tasks' ? (
            <SkyTasksPanel />
          ) : activeView === 'sky-ticket2' ? (
            <TicketDetails2 />
          ) : activeView === 'sky-report' ? (
            <SkyTrackingReport />
          ) : activeView === 'config' ? (
            <ConfigurationPanel config={appConfig} onConfigChange={handleConfigChange} />
          ) : activeView === 'test' ? (
            <AgentTestPanel agents={agents} />
          ) : activeView === 'cards' ? (
            <>
              <AgentCardsPanel
                items={listItems}
                selectedId={selectedId}
                previewId={previewId}
                selectedMcpId={selectedMcpId}
                onSelect={(id) => { setSelectedId(id === selectedId ? null : id); setSelectedMcpId(null) }}
                onSelectMcp={(id) => { setSelectedMcpId(id === selectedMcpId ? null : id); setSelectedId(null) }}
                onEditMcp={(srv) => setMcpEditTarget(srv)}
                onPreview={(id) => { setPreviewId(previewId === id ? null : id); setSelectedId(id) }}
                onToggleAgent={handleToggleAgent}
                onToggleMcp={handleToggleMcp}
              />
              {previewAgent && (
                <AgentDetailPanel
                  agent={previewAgent.agent}
                  agentRecord={previewAgent}
                  onUpdateSkills={handleUpdateSkills}
                  onUpdateReference={handleUpdateReference}
                  onUpdateMcpBindings={handleUpdateMcpBindings}
                  agentSlug={previewAgent.slug}
                  mcpServers={mcpServers}
                />
              )}
            </>
          ) : activeView === 'matrix' ? (
            <AgentMcpMatrixPanel agents={filteredAgents} mcpServers={filteredMcpServers} />
          ) : activeView === 'mcp' ? (
            <McpServersPanel mcpServers={filteredMcpServers} onServersChange={setMcpServers} addTrigger={mcpAddTrigger} onToggleMcp={handleToggleMcp} />
          ) : activeView === 'mapv' ? (
            <div className={`ac-map-split ${logViewer ? 'has-logs' : ''}`}>
              <AgentMapVerticalPanel agents={filteredAgents} consumers={consumers} mcpServers={filteredMcpServers} onAddAgent={handleCreate} onToggleAgent={handleToggleAgent} onToggleMcp={handleToggleMcp} onAgentDblClick={(slug, name) => setLogViewer({ slug, name })} />
              {logViewer && (
                <AgentLogViewer
                  agentSlug={logViewer.slug}
                  agentName={logViewer.name}
                  onClose={() => setLogViewer(null)}
                />
              )}
            </div>
          ) : activeView === 'map' ? (
            <div className={`ac-map-split ${logViewer ? 'has-logs' : ''}`}>
              <AgentMapPanel agents={filteredAgents} consumers={consumers} mcpServers={filteredMcpServers} onAddAgent={handleCreate} onToggleAgent={handleToggleAgent} onToggleMcp={handleToggleMcp} onAgentDblClick={(slug, name) => setLogViewer({ slug, name })} />
              {logViewer && (
                <AgentLogViewer
                  agentSlug={logViewer.slug}
                  agentName={logViewer.name}
                  onClose={() => setLogViewer(null)}
                />
              )}
            </div>
          ) : (
            <>
              {/* Data Grid */}
              <div className="ac-grid-wrapper">
                <table className="ac-grid">
                  <thead>
                    <tr>
                      {visibleColumns.map(col => (
                        <th key={col.key} onClick={() => handleSort(col.key)} className="ac-col-sortable">
                          <span>{col.label}</span>
                          {sortColumn === col.key && (
                            sortDirection === 'asc' ? <ChevronUp size={12} /> : <ChevronDown size={12} />
                          )}
                        </th>
                      ))}
                      <th style={{ width: '44px' }}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {pagedItems.length === 0 && (
                      <tr>
                        <td colSpan={visibleColumns.length + 1} className="ac-no-data">No Data Found</td>
                      </tr>
                    )}
                    {pagedItems.map(row => {
                      const isAgent = row._kind === 'agent'
                      const itemId = isAgent ? row.raw.id : null
                      const mcpId = !isAgent ? row.raw.id : null
                      const isPrivate = row._role === 'sub-agent' || row._role === 'private'
                      const isSelected = isAgent ? selectedId === itemId : selectedMcpId === mcpId
                      return (
                        <tr
                          key={row._uid}
                          className={`${isSelected ? 'selected' : ''} ${isAgent && previewId === itemId ? 'previewing' : ''}`}
                          onClick={() => {
                            if (isAgent) {
                              setSelectedId(itemId === selectedId ? null : itemId)
                              setSelectedMcpId(null)
                            } else {
                              setSelectedMcpId(mcpId === selectedMcpId ? null : mcpId)
                              setSelectedId(null)
                            }
                          }}
                          onDoubleClick={() => {
                            if (isAgent) {
                              setSelectedId(itemId); setDialogMode('edit'); setDialogOpen(true)
                            } else {
                              const srv = mcpServers.find(s => s.id === mcpId)
                              if (srv) setMcpEditTarget(srv)
                            }
                          }}
                        >
                          {visibleColumns.map(col => {
                            switch (col.key) {
                              case 'icon':
                                return (
                                  <td key="icon" className="ac-col-icon">
                                    {isAgent
                                      ? <Bot size={15} className="ac-row-icon ac-row-icon-agent" />
                                      : <Plug size={15} className="ac-row-icon ac-row-icon-mcp" />}
                                  </td>
                                )
                              case 'origin':
                                return (
                                  <td key="origin">
                                    <span className={`ac-type-badge ac-type-${row._type}`}>
                                      {row._type === 'local' ? 'Local' : 'External'}
                                    </span>
                                  </td>
                                )
                              case 'name':
                                return <td key="name" className="ac-cell-name">{row._name}</td>
                              case 'description':
                                return <td key="desc" className="ac-cell-desc">{row._desc}</td>
                              case 'version':
                                return <td key="ver">{row._version}</td>
                              case 'url':
                                return <td key="url" className="ac-cell-url">{row._url}</td>
                              case 'stage':
                                return (
                                  <td key="stage">
                                    {(() => {
                                      const stage = row._stage
                                      const stageIdx = ALL_STAGES.indexOf(stage)
                                      const level = stageIdx >= 0 ? stageIdx + 1 : 1
                                      const total = ALL_STAGES.length
                                      return (
                                        <div className={`ac-stage-bar ac-stage-${stage.toLowerCase()}`} title={stage}>
                                          {ALL_STAGES.map((_, si) => (
                                            <span key={si} className={`ac-stage-step ${si < level ? 'filled' : ''}`} />
                                          ))}
                                          <span className="ac-stage-label">{stage}</span>
                                        </div>
                                      )
                                    })()}
                                  </td>
                                )
                              case 'public':
                                return (
                                  <td key="pub">
                                    <span className={`ac-public-badge ${isPrivate ? 'ac-public-private' : 'ac-public-public'}`}>
                                      {isPrivate ? 'Private' : 'Public'}
                                    </span>
                                  </td>
                                )
                              case 'live':
                                return (
                                  <td key="live" className="ac-col-toggle">
                                    <label className="live-toggle" onClick={e => e.stopPropagation()}>
                                      <input
                                        type="checkbox"
                                        checked={row._enabled}
                                        onChange={() => {
                                          if (isAgent) handleToggleAgent(itemId, row._enabled)
                                          else handleToggleMcp(row.raw.id, row._enabled)
                                        }}
                                      />
                                      <span className="live-toggle-track" />
                                    </label>
                                  </td>
                                )
                              default:
                                return null
                            }
                          })}
                          <td className="ac-col-preview">
                            {isAgent ? (
                              <button
                                className={`ac-preview-btn ${previewId === itemId ? 'active' : ''}`}
                                title="Preview details"
                                onClick={e => { e.stopPropagation(); setPreviewId(previewId === itemId ? null : itemId); setSelectedId(itemId) }}
                              >
                                <Eye size={15} />
                              </button>
                            ) : null}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="ac-pagination">
                <div className="ac-pagination-left">
                  <span>{listItems.length} result{listItems.length !== 1 ? 's' : ''}</span>
                </div>
                <div className="ac-pagination-right">
                  <label>Page Size</label>
                  <select value={pageSize} onChange={e => { setPageSize(Number(e.target.value)); setCurrentPage(1) }}>
                    <option value={10}>10</option>
                    <option value={20}>20</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                  </select>
                  <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}>
                    <ChevronLeft size={16} />
                  </button>
                  <span className="ac-page-info">Page {currentPage} / {totalPages}</span>
                  <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}>
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>

              {/* Detail Panel */}
              {previewAgent && (
                <AgentDetailPanel
                  agent={previewAgent.agent}
                  agentRecord={previewAgent}
                  onUpdateSkills={handleUpdateSkills}
                  onUpdateReference={handleUpdateReference}
                  onUpdateMcpBindings={handleUpdateMcpBindings}
                  agentSlug={previewAgent.slug}
                  mcpServers={mcpServers}
                />
              )}
            </>
          )}
        </main>
      </div>

      {/* Form Dialog */}
      <AgentFormDialog
        isOpen={dialogOpen}
        onClose={() => {
          setDialogOpen(false)
          if (dialogMode === 'import') {
            setImportPendingFile(null)
            setImportPartialData(null)
          }
        }}
        onSave={dialogMode === 'import' ? handleImportSave : handleSave}
        editData={dialogMode === 'edit' ? selectedAgent : dialogMode === 'import' ? importPartialData : null}
        mode={dialogMode === 'import' ? 'import' : dialogMode}
        mcpServers={mcpServers}
        onUpdateSkills={(updatedSkills) => {
          if (!selectedId) return
          setAgents(prev => prev.map(a => a.id === selectedId ? { ...a, managedSkills: updatedSkills } : a))
        }}
        onUpdateMcpBindings={(updatedBindings) => {
          if (!selectedId) return
          setAgents(prev => prev.map(a => a.id === selectedId ? { ...a, mcpBindings: updatedBindings } : a))
        }}
      />

      {/* MCP Edit Dialog */}
      {mcpEditTarget && (
        <McpServerDialog
          mode="edit"
          server={mcpEditTarget}
          onSave={handleMcpEditSave}
          onClose={() => setMcpEditTarget(null)}
        />
      )}

      {/* Delete Confirmation */}
      {deleteConfirmOpen && (
        <div className="dialog-overlay">
          <div className="ac-confirm-dialog">
            <h3>Confirm Delete</h3>
            <p>Are you sure you want to delete {selectedMcpId ? 'MCP server' : 'agent'} <strong>"{selectedMcpId ? mcpServers.find(s => s.id === selectedMcpId)?.name : selectedAgent?.agent.name}"</strong>?</p>
            <div className="ac-confirm-actions">
              <button className="btn btn-cancel" onClick={() => setDeleteConfirmOpen(false)}>Cancel</button>
              <button className="btn btn-delete-confirm" onClick={confirmDelete}>Delete</button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}

export default AgentConfig
