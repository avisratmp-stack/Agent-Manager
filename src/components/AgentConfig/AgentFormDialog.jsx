import React, { useState, useEffect } from 'react'
import { X, Plus, Trash2, Globe, HardDrive, Settings, Zap, Server } from 'lucide-react'
import SkillsPanel from './SkillsPanel'
import McpBindingsPanel from './McpBindingsPanel'

const emptyFormData = {
  type: 'external',
  stage: 'Draft',
  environment: 'AOC',
  slug: null,
  agent: {
    name: '',
    description: '',
    url: '',
    version: '1.0.0',
    capabilities: { streaming: false, async_execution: false },
    tools: [],
    handler: {
      class: 'framework.handlers.DefaultRequestHandler',
      args: {
        agent_executor: '',
        task_store: 'framework.task_stores.InMemoryTaskStore'
      }
    }
  }
}

const emptyTool = { id: '', name: '', description: '', tags: [] }

const AgentFormDialog = ({ isOpen, onClose, onSave, editData, mode, mcpServers, onUpdateSkills, onUpdateMcpBindings }) => {
  const [formData, setFormData] = useState(emptyFormData)
  const [newTag, setNewTag] = useState({})
  const [errors, setErrors] = useState({})
  const [activeTab, setActiveTab] = useState('general')

  useEffect(() => {
    if (editData && (mode === 'edit' || mode === 'import')) {
      const clone = JSON.parse(JSON.stringify(editData))
      const a = clone.agent || {}
      if (!a.capabilities) a.capabilities = { streaming: false, async_execution: false }
      if (!a.handler) a.handler = { class: '', args: { agent_executor: '', task_store: '' } }
      if (!a.handler.args) a.handler.args = { agent_executor: '', task_store: '' }
      if (!a.url && a.url !== '') a.url = ''
      if (!a.version) a.version = '1.0.0'
      if (!a.tools) a.tools = []
      a.tools = a.tools.map(t => ({ id: t.id || '', name: t.name || '', description: t.description || '', tags: t.tags || [], ...t }))
      clone.agent = a
      setFormData(clone)
    } else {
      setFormData(JSON.parse(JSON.stringify(emptyFormData)))
    }
    setErrors({})
    setActiveTab('general')
  }, [editData, mode, isOpen])

  if (!isOpen) return null

  const agent = formData.agent || emptyFormData.agent
  const isLocal = formData.type === 'local'
  const isEdit = mode === 'edit'
  const isImport = mode === 'import'
  const showExtendedTabs = isLocal && isEdit

  const tabs = [
    { id: 'general', label: 'General', icon: Settings },
    ...(showExtendedTabs ? [{ id: 'skills', label: 'Skills', icon: Zap }] : []),
    ...(showExtendedTabs ? [{ id: 'mcp', label: 'MCP Bindings', icon: Server }] : []),
  ]

  const updateAgent = (field, value) => {
    setFormData(prev => ({
      ...prev,
      agent: { ...prev.agent, [field]: value }
    }))
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: null }))
  }

  const updateCapability = (field, value) => {
    setFormData(prev => ({
      ...prev,
      agent: {
        ...prev.agent,
        capabilities: { ...(prev.agent.capabilities || {}), [field]: value }
      }
    }))
  }

  const updateHandler = (field, value) => {
    setFormData(prev => ({
      ...prev,
      agent: {
        ...prev.agent,
        handler: { ...(prev.agent.handler || {}), [field]: value }
      }
    }))
  }

  const updateHandlerArg = (field, value) => {
    setFormData(prev => {
      const handler = prev.agent.handler || {}
      return {
        ...prev,
        agent: {
          ...prev.agent,
          handler: {
            ...handler,
            args: { ...(handler.args || {}), [field]: value }
          }
        }
      }
    })
  }

  const addTool = () => {
    setFormData(prev => ({
      ...prev,
      agent: {
        ...prev.agent,
        tools: [...prev.agent.tools, { ...emptyTool }]
      }
    }))
  }

  const removeTool = (index) => {
    setFormData(prev => ({
      ...prev,
      agent: {
        ...prev.agent,
        tools: prev.agent.tools.filter((_, i) => i !== index)
      }
    }))
  }

  const updateTool = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      agent: {
        ...prev.agent,
        tools: prev.agent.tools.map((t, i) => i === index ? { ...t, [field]: value } : t)
      }
    }))
  }

  const addTag = (toolIndex) => {
    const tag = (newTag[toolIndex] || '').trim()
    if (!tag) return
    setFormData(prev => ({
      ...prev,
      agent: {
        ...prev.agent,
        tools: prev.agent.tools.map((t, i) =>
          i === toolIndex ? { ...t, tags: [...(t.tags || []), tag] } : t
        )
      }
    }))
    setNewTag(prev => ({ ...prev, [toolIndex]: '' }))
  }

  const removeTag = (toolIndex, tagIndex) => {
    setFormData(prev => ({
      ...prev,
      agent: {
        ...prev.agent,
        tools: prev.agent.tools.map((t, i) =>
          i === toolIndex ? { ...t, tags: t.tags.filter((_, ti) => ti !== tagIndex) } : t
        )
      }
    }))
  }

  const validate = () => {
    const errs = {}
    if (!(agent.name || '').trim()) errs.name = 'Agent name is required'
    if (!(agent.url || '').trim()) errs.url = 'URL is required'
    if (!(agent.version || '').trim()) errs.version = 'Version is required'
    if (formData.type === 'local' && !formData.slug?.trim()) errs.slug = 'Folder slug is required for local agents'
    if (formData.type === 'local') {
      if (!(agent.handler?.class || '').trim()) errs.handlerClass = 'Handler class is required'
      if (!(agent.handler?.args?.agent_executor || '').trim()) errs.agentExecutor = 'Agent executor is required'
    }
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSave = () => {
    if (!validate()) {
      setActiveTab('general')
      return
    }
    onSave(formData)
  }

  const handleTagKeyDown = (e, toolIndex) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      addTag(toolIndex)
    }
  }

  const skillCount = (editData?.managedSkills || []).length
  const mcpCount = (editData?.mcpBindings || []).length

  return (
    <div className="dialog-overlay">
      <div className="dialog-container">
        <div className="dialog-header">
          <h2>{isImport ? 'Import Agent — Complete Missing Data' : mode === 'edit' ? 'Update' : 'Create'} {isImport ? '' : 'Observability Agent'}</h2>
          <button className="dialog-close" onClick={onClose}><X size={20} /></button>
        </div>

        {tabs.length > 1 && (
          <div className="dlg-tab-bar">
            {tabs.map(tab => (
              <button
                key={tab.id}
                className={`dlg-tab ${activeTab === tab.id ? 'active' : ''}`}
                onClick={() => setActiveTab(tab.id)}
                type="button"
              >
                <tab.icon size={14} />
                {tab.label}
                {tab.id === 'skills' && skillCount > 0 && (
                  <span className="dlg-tab-count">{skillCount}</span>
                )}
                {tab.id === 'mcp' && mcpCount > 0 && (
                  <span className="dlg-tab-count">{mcpCount}</span>
                )}
              </button>
            ))}
          </div>
        )}

        <div className="dialog-body">
          {activeTab === 'general' && (
            <>
              {/* Agent Type */}
              <div className="form-section">
                <h3 className="form-section-title">Agent Type</h3>
                <span className="sk-field-hint">Determines how this agent is hosted and managed. Local agents have a dedicated skills folder on disk. External agents are remote references.</span>
                <div className="ac-type-selector">
                  <button
                    className={`ac-type-option ${formData.type === 'local' ? 'active' : ''}`}
                    onClick={() => setFormData(prev => ({ ...prev, type: 'local' }))}
                    type="button"
                  >
                    <HardDrive size={16} />
                    <div>
                      <strong>Local</strong>
                      <span>Managed here with dedicated skills folder</span>
                    </div>
                  </button>
                  <button
                    className={`ac-type-option ${formData.type === 'external' ? 'active' : ''}`}
                    onClick={() => setFormData(prev => ({ ...prev, type: 'external', slug: null }))}
                    type="button"
                  >
                    <Globe size={16} />
                    <div>
                      <strong>External</strong>
                      <span>Remote agent — reference only, no local folder</span>
                    </div>
                  </button>
                </div>
                {formData.type === 'local' && (
                  <div className="form-group" style={{ marginTop: 12 }}>
                    <label>Folder Slug <span className="required">*</span></label>
                    <input
                      type="text"
                      value={formData.slug || ''}
                      onChange={e => {
                        const val = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '')
                        setFormData(prev => ({ ...prev, slug: val }))
                        if (errors.slug) setErrors(prev => ({ ...prev, slug: null }))
                      }}
                      placeholder="e.g. log-agent"
                      className={errors.slug ? 'input-error' : ''}
                    />
                    <span className="sk-field-hint">Lowercase, hyphens only. Creates folder: agents/{formData.slug || '...'}/</span>
                    {errors.slug && <span className="error-text">{errors.slug}</span>}
                  </div>
                )}
              </div>

              {/* Basic Info */}
              <div className="form-section">
                <h3 className="form-section-title">Basic Information</h3>
                <div className="form-grid">
                  <div className="form-group">
                    <label>Agent Name <span className="required">*</span></label>
                    <input
                      type="text"
                      value={agent.name}
                      onChange={e => updateAgent('name', e.target.value)}
                      placeholder="e.g. Calculator Agent"
                      className={errors.name ? 'input-error' : ''}
                    />
                    <span className="sk-field-hint">Human-readable display name. Used in lists, graphs and logs.</span>
                    {errors.name && <span className="error-text">{errors.name}</span>}
                  </div>
                  <div className="form-group">
                    <label>Version <span className="required">*</span></label>
                    <input
                      type="text"
                      value={agent.version}
                      onChange={e => updateAgent('version', e.target.value)}
                      placeholder="e.g. 1.0.0"
                      className={errors.version ? 'input-error' : ''}
                    />
                    <span className="sk-field-hint">Semantic version (major.minor.patch). Increment on behavior changes.</span>
                    {errors.version && <span className="error-text">{errors.version}</span>}
                  </div>
                  <div className="form-group">
                    <label>Stage</label>
                    <select
                      value={formData.stage || 'Draft'}
                      onChange={e => setFormData(prev => ({ ...prev, stage: e.target.value }))}
                    >
                      <option value="Draft">Draft</option>
                      <option value="Design">Design</option>
                      <option value="Dev">Dev</option>
                      <option value="Released">Released</option>
                    </select>
                    <span className="sk-field-hint">Lifecycle stage: Draft → Design → Dev → Released.</span>
                  </div>
                  <div className="form-group full-width">
                    <label>Description</label>
                    <textarea
                      value={agent.description}
                      onChange={e => updateAgent('description', e.target.value)}
                      placeholder="Describe what this agent does and when to use it..."
                      rows={2}
                    />
                    <span className="sk-field-hint">Explain what the agent does and when it should be activated. Include trigger keywords per agentskills.io spec.</span>
                  </div>
                  <div className="form-group full-width">
                    <label>URL <span className="required">*</span></label>
                    <input
                      type="text"
                      value={agent.url}
                      onChange={e => updateAgent('url', e.target.value)}
                      placeholder="e.g. http://localhost:8000"
                      className={errors.url ? 'input-error' : ''}
                    />
                    <span className="sk-field-hint">The agent's A2A endpoint. For local agents, typically http://localhost:PORT.</span>
                    {errors.url && <span className="error-text">{errors.url}</span>}
                  </div>
                </div>
              </div>

              {/* Capabilities */}
              <div className="form-section">
                <h3 className="form-section-title">Capabilities</h3>
                <span className="sk-field-hint" style={{ marginBottom: 8, display: 'block' }}>Declare what communication patterns this agent supports.</span>
                <div className="form-grid">
                  <div className="form-group checkbox-group">
                    <label className="checkbox-label">
                      <input
                        type="checkbox"
                        checked={agent.capabilities?.streaming || false}
                        onChange={e => updateCapability('streaming', e.target.checked)}
                      />
                      <span className="checkbox-custom"></span>
                      Streaming
                    </label>
                    <span className="sk-field-hint">Agent can stream partial responses (SSE / WebSocket).</span>
                  </div>
                  <div className="form-group checkbox-group">
                    <label className="checkbox-label">
                      <input
                        type="checkbox"
                        checked={agent.capabilities?.async_execution || false}
                        onChange={e => updateCapability('async_execution', e.target.checked)}
                      />
                      <span className="checkbox-custom"></span>
                      Async Execution
                    </label>
                    <span className="sk-field-hint">Agent runs tasks in background and returns results via callback/polling.</span>
                  </div>
                </div>
              </div>

              {/* Handler */}
              <div className="form-section">
                <h3 className="form-section-title">Handler</h3>
                <span className="sk-field-hint" style={{ marginBottom: 8, display: 'block' }}>Runtime configuration — the Python class that processes incoming requests and the executor that implements agent logic.</span>
                <div className="form-grid">
                  <div className="form-group full-width">
                    <label>Handler Class <span className="required">*</span></label>
                    <input
                      type="text"
                      value={agent.handler?.class || ''}
                      onChange={e => updateHandler('class', e.target.value)}
                      placeholder="e.g. framework.handlers.DefaultRequestHandler"
                      className={errors.handlerClass ? 'input-error' : ''}
                    />
                    <span className="sk-field-hint">Fully-qualified Python class that handles HTTP requests for this agent.</span>
                    {errors.handlerClass && <span className="error-text">{errors.handlerClass}</span>}
                  </div>
                  <div className="form-group">
                    <label>Agent Executor <span className="required">*</span></label>
                    <input
                      type="text"
                      value={agent.handler?.args?.agent_executor || ''}
                      onChange={e => updateHandlerArg('agent_executor', e.target.value)}
                      placeholder="e.g. services.calculator_executor.CalculatorAgentExecutor"
                      className={errors.agentExecutor ? 'input-error' : ''}
                    />
                    <span className="sk-field-hint">The executor class that implements the agent's core logic and tool orchestration.</span>
                    {errors.agentExecutor && <span className="error-text">{errors.agentExecutor}</span>}
                  </div>
                  <div className="form-group">
                    <label>Task Store</label>
                    <input
                      type="text"
                      value={agent.handler?.args?.task_store || ''}
                      onChange={e => updateHandlerArg('task_store', e.target.value)}
                      placeholder="e.g. framework.task_stores.InMemoryTaskStore"
                    />
                    <span className="sk-field-hint">Where async task state is persisted. InMemoryTaskStore for dev, RedisTaskStore for production.</span>
                  </div>
                </div>
              </div>

              {/* Tools */}
              <div className="form-section">
                <div className="form-section-header">
                  <h3 className="form-section-title">Tools</h3>
                  <button className="btn-add-skill" onClick={addTool}>
                    <Plus size={14} /> Add Tool
                  </button>
                </div>
                <span className="sk-field-hint" style={{ marginBottom: 8, display: 'block' }}>Tools are capabilities this agent exposes to callers. Each tool needs an ID, name, description, and optional tags for discovery.</span>
                {agent.tools.length === 0 && (
                  <p className="empty-skills">No tools configured. Click "Add Tool" to add one.</p>
                )}
                {agent.tools.map((tool, idx) => (
                  <div key={idx} className="skill-card">
                    <div className="skill-card-header">
                      <span className="skill-index">Tool #{idx + 1}</span>
                      <button className="btn-remove-skill" onClick={() => removeTool(idx)}>
                        <Trash2 size={14} />
                      </button>
                    </div>
                    <div className="form-grid">
                      <div className="form-group">
                        <label>Tool ID</label>
                        <input
                          type="text"
                          value={tool.id}
                          onChange={e => updateTool(idx, 'id', e.target.value)}
                          placeholder="e.g. add"
                        />
                      </div>
                      <div className="form-group">
                        <label>Tool Name</label>
                        <input
                          type="text"
                          value={tool.name}
                          onChange={e => updateTool(idx, 'name', e.target.value)}
                          placeholder="e.g. Addition"
                        />
                      </div>
                      <div className="form-group full-width">
                        <label>Description</label>
                        <input
                          type="text"
                          value={tool.description}
                          onChange={e => updateTool(idx, 'description', e.target.value)}
                          placeholder="e.g. Add two numbers"
                        />
                      </div>
                      <div className="form-group full-width">
                        <label>Tags</label>
                        <div className="tags-container">
                          {(tool.tags || []).map((tag, ti) => (
                            <span key={ti} className="tag">
                              {tag}
                              <button onClick={() => removeTag(idx, ti)}><X size={10} /></button>
                            </span>
                          ))}
                          <input
                            type="text"
                            className="tag-input"
                            value={newTag[idx] || ''}
                            onChange={e => setNewTag(prev => ({ ...prev, [idx]: e.target.value }))}
                            onKeyDown={e => handleTagKeyDown(e, idx)}
                            placeholder="Type tag + Enter"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {activeTab === 'skills' && showExtendedTabs && (
            <div className="dlg-extended-tab-body">
              <SkillsPanel
                skills={editData?.managedSkills || []}
                onUpdate={onUpdateSkills}
                agentSlug={editData?.slug}
              />
            </div>
          )}

          {activeTab === 'mcp' && showExtendedTabs && (
            <div className="dlg-extended-tab-body">
              <McpBindingsPanel
                agentId={editData?.id}
                bindings={editData?.mcpBindings || []}
                mcpServers={mcpServers || []}
                onUpdate={onUpdateMcpBindings}
              />
            </div>
          )}
        </div>

        <div className="dialog-footer">
          <button className="btn btn-cancel" onClick={onClose}>Cancel</button>
          {activeTab === 'general' && (
            <button className="btn btn-save" onClick={handleSave}>
              {isImport ? 'Import' : mode === 'edit' ? 'Update' : 'Create'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export default AgentFormDialog
