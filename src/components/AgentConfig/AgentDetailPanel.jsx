import React, { useState } from 'react'
import { Bot, Copy, Info, Zap, BookOpen, Plug, FolderOpen, Globe } from 'lucide-react'
import SkillsPanel from './SkillsPanel'
import KnowledgePanel from './KnowledgePanel'
import McpBindingsPanel from './McpBindingsPanel'

const AgentDetailPanel = ({ agent, agentRecord, onUpdateSkills, onUpdateKnowledge, onUpdateMcpBindings, agentSlug, mcpServers }) => {
  const [activeTab, setActiveTab] = useState('overview')

  if (!agent || !agentRecord) return null

  const isLocal = agentRecord.type === 'local'
  const mcpCount = (agentRecord.mcpBindings || []).length

  const tabs = [
    { id: 'overview', label: 'Overview', icon: Info },
    ...(isLocal ? [{ id: 'skills-knowledge', label: 'Skills & Knowledge', icon: Zap }] : []),
    ...(isLocal ? [{ id: 'mcp-bindings', label: 'MCP Bindings', icon: Plug }] : []),
  ]

  const skillCount = (agentRecord.managedSkills || []).length
  const kbCount = (agentRecord.knowledge || []).length
  const activeSkills = (agentRecord.managedSkills || []).filter(s => s.status === 'active').length

  return (
    <div className="ac-detail-panel">
      <div className="ac-detail-header">
        <div className="ac-detail-title">
          <Bot size={15} />
          <span>{agent.name}</span>
          <span className="ac-detail-version">v{agent.version}</span>
          <span className={`ac-type-badge ac-type-${agentRecord.type}`}>
            {isLocal ? 'Local' : 'External'}
          </span>
          {agentRecord.role !== 'sub-agent' && (
            <span className="ac-role-badge ac-role-public">Public</span>
          )}
          {isLocal && (
            <div className="ac-detail-counts">
              <span className="ac-detail-count" title="Active skills">
                <Zap size={12} /> {activeSkills} skill{activeSkills !== 1 ? 's' : ''}
              </span>
              <span className="ac-detail-count" title="Knowledge documents">
                <BookOpen size={12} /> {kbCount} doc{kbCount !== 1 ? 's' : ''}
              </span>
            </div>
          )}
          {isLocal && mcpCount > 0 && (
            <span className="ac-detail-count" title="MCP bindings">
              <Plug size={12} /> {mcpCount} MCP
            </span>
          )}
        </div>
        <button
          className="ac-detail-copy"
          onClick={() => navigator.clipboard.writeText(JSON.stringify(agentRecord, null, 2))}
          title="Copy JSON"
        >
          <Copy size={14} /> Copy JSON
        </button>
      </div>

      <div className="ac-tab-bar">
        {tabs.map(tab => (
          <button
            key={tab.id}
            className={`ac-tab ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            <tab.icon size={14} />
            {tab.label}
            {tab.id === 'skills-knowledge' && (skillCount + kbCount) > 0 && (
              <span className="ac-tab-count">{skillCount + kbCount}</span>
            )}
            {tab.id === 'mcp-bindings' && mcpCount > 0 && (
              <span className="ac-tab-count">{mcpCount}</span>
            )}
          </button>
        ))}
      </div>

      <div className="ac-tab-content">
        {activeTab === 'overview' && (
          <div className="ac-detail-body">
            {isLocal && agentRecord.slug && (
              <div className="ac-detail-field">
                <span className="ac-detail-label">Agent Folder</span>
                <span className="ac-detail-value ac-detail-mono">
                  <FolderOpen size={13} style={{ verticalAlign: 'middle', marginRight: 4 }} />
                  agents/{agentRecord.slug}/
                </span>
              </div>
            )}
            {!isLocal && (
              <div className="ac-detail-field">
                <span className="ac-detail-label">Source</span>
                <span className="ac-detail-value">
                  <Globe size={13} style={{ verticalAlign: 'middle', marginRight: 4 }} />
                  External — no local folder. Skills and knowledge managed remotely.
                </span>
              </div>
            )}
            <div className="ac-detail-field">
              <span className="ac-detail-label">Description</span>
              <span className="ac-detail-value">{agent.description || '—'}</span>
            </div>
            <div className="ac-detail-field">
              <span className="ac-detail-label">URL</span>
              <span className="ac-detail-value ac-detail-mono">{agent.url}</span>
            </div>
            <div className="ac-detail-field">
              <span className="ac-detail-label">Handler</span>
              <span className="ac-detail-value ac-detail-mono">{agent.handler.class}</span>
            </div>
            <div className="ac-detail-field">
              <span className="ac-detail-label">Executor</span>
              <span className="ac-detail-value ac-detail-mono">{agent.handler.args.agent_executor}</span>
            </div>
            <div className="ac-detail-field">
              <span className="ac-detail-label">Capabilities</span>
              <span className="ac-detail-value">
                {agent.capabilities.streaming && 'Streaming'}
                {agent.capabilities.streaming && agent.capabilities.async_execution && ', '}
                {agent.capabilities.async_execution && 'Async Execution'}
                {!agent.capabilities.streaming && !agent.capabilities.async_execution && '—'}
              </span>
            </div>
            <div className="ac-detail-field">
              <span className="ac-detail-label">Registered Tools</span>
              <span className="ac-detail-value">
                {agent.tools.map(t => t.name).join(', ') || '—'}
              </span>
            </div>
          </div>
        )}

        {activeTab === 'skills-knowledge' && isLocal && (
          <div className="ac-sk-container">
            <SkillsPanel
              skills={agentRecord.managedSkills || []}
              onUpdate={onUpdateSkills}
              agentSlug={agentSlug}
            />
            <div className="ac-sk-divider" />
            <KnowledgePanel
              knowledge={agentRecord.knowledge || []}
              onUpdate={onUpdateKnowledge}
              agentSlug={agentSlug}
            />
          </div>
        )}

        {activeTab === 'mcp-bindings' && isLocal && (
          <div className="ac-sk-container">
            <McpBindingsPanel
              agentId={agentRecord.id}
              bindings={agentRecord.mcpBindings || []}
              mcpServers={mcpServers}
              onUpdate={onUpdateMcpBindings}
            />
          </div>
        )}
      </div>
    </div>
  )
}

export default AgentDetailPanel
