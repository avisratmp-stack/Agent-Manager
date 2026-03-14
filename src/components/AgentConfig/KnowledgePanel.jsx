import React, { useState } from 'react'
import {
  Plus, Eye, Trash2, RefreshCw, FileText, Link, File,
  CheckCircle, Loader, AlertTriangle, BookOpen, X
} from 'lucide-react'
import KnowledgeUploadDialog from './KnowledgeUploadDialog'
import { api } from '../../api'

const TYPE_ICONS = { pdf: File, docx: FileText, txt: FileText, md: FileText, url: Link }
const STATUS_CONFIG = {
  indexed:    { icon: CheckCircle, label: 'Indexed', className: 'kb-st-indexed' },
  processing: { icon: Loader, label: 'Processing', className: 'kb-st-processing' },
  failed:     { icon: AlertTriangle, label: 'Failed', className: 'kb-st-failed' }
}

const KnowledgePanel = ({ knowledge, onUpdate, agentSlug }) => {
  const [uploadOpen, setUploadOpen] = useState(false)
  const [previewItem, setPreviewItem] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)

  const handleAdd = async (item) => {
    const persistedItem = { ...item, status: 'indexed' }
    if (agentSlug) {
      try {
        const { knowledge: updated } = await api.addKnowledge(agentSlug, persistedItem)
        onUpdate(updated)
      } catch (err) {
        console.error('Failed to add knowledge', err)
        onUpdate([...knowledge, persistedItem])
      }
    } else {
      onUpdate([...knowledge, persistedItem])
    }
    setUploadOpen(false)
  }

  const handleRetry = (id) => {
    onUpdate(knowledge.map(k => k.id === id ? { ...k, status: 'indexed' } : k))
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    if (agentSlug) {
      try {
        const { knowledge: updated } = await api.deleteKnowledge(agentSlug, deleteTarget.id)
        onUpdate(updated)
      } catch (err) {
        console.error('Failed to delete knowledge', err)
        onUpdate(knowledge.filter(k => k.id !== deleteTarget.id))
      }
    } else {
      onUpdate(knowledge.filter(k => k.id !== deleteTarget.id))
    }
    setDeleteTarget(null)
  }

  const formatDate = (iso) => {
    const d = new Date(iso)
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  const formatSize = (bytes) => {
    if (!bytes) return '—'
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  return (
    <div className="kb-panel">
      <div className="kb-panel-header">
        <div>
          <h3 className="kb-panel-title">Knowledge Base</h3>
          <p className="kb-panel-desc">Documents and references the agent can search at runtime to answer questions and inform decisions.</p>
        </div>
        <button className="ac-btn ac-btn-create" onClick={() => setUploadOpen(true)}>
          <Plus size={14} /> Add Knowledge
        </button>
      </div>

      {knowledge.length === 0 ? (
        <div className="kb-empty">
          <BookOpen size={32} />
          <h4>No documents uploaded</h4>
          <p>Add reference documents, URLs, or text so this agent can look up information when needed.</p>
          <button className="ac-btn ac-btn-create" onClick={() => setUploadOpen(true)}>
            <Plus size={14} /> Add First Document
          </button>
        </div>
      ) : (
        <div className="kb-list">
          <div className="kb-list-header">
            <span className="kb-col-name">Document</span>
            <span className="kb-col-type">Type</span>
            <span className="kb-col-size">Size</span>
            <span className="kb-col-date">Uploaded</span>
            <span className="kb-col-status">Status</span>
            <span className="kb-col-actions">Actions</span>
          </div>
          {knowledge.map(item => {
            const TypeIcon = TYPE_ICONS[item.type] || File
            const statusCfg = STATUS_CONFIG[item.status] || STATUS_CONFIG.processing
            const StatusIcon = statusCfg.icon
            return (
              <div key={item.id} className="kb-item">
                <div className="kb-col-name">
                  <TypeIcon size={16} className="kb-item-type-icon" />
                  <div className="kb-item-name-wrap">
                    <span className="kb-item-name" title={item.name}>{item.name}</span>
                    {item.tags?.length > 0 && (
                      <div className="kb-item-tags">
                        {item.tags.map((t, i) => <span key={i} className="kb-tag">{t}</span>)}
                      </div>
                    )}
                  </div>
                </div>
                <div className="kb-col-type">
                  <span className="kb-type-label">{item.type.toUpperCase()}</span>
                </div>
                <div className="kb-col-size">{formatSize(item.size)}</div>
                <div className="kb-col-date">{formatDate(item.uploadDate)}</div>
                <div className="kb-col-status">
                  <span className={`kb-status-badge ${statusCfg.className}`}>
                    <StatusIcon size={12} className={item.status === 'processing' ? 'kb-spin' : ''} />
                    {statusCfg.label}
                  </span>
                </div>
                <div className="kb-col-actions">
                  {item.type === 'url' && (
                    <a href={item.source} target="_blank" rel="noopener noreferrer" className="sk-action-btn" title="Open URL">
                      <Link size={14} />
                    </a>
                  )}
                  {item.type !== 'url' && (
                    <button className="sk-action-btn" title="Preview" onClick={() => setPreviewItem(item)}>
                      <Eye size={14} />
                    </button>
                  )}
                  {item.status === 'failed' && (
                    <button className="sk-action-btn sk-action-enable" title="Retry indexing" onClick={() => handleRetry(item.id)}>
                      <RefreshCw size={14} />
                    </button>
                  )}
                  <button className="sk-action-btn sk-action-delete" title="Delete" onClick={() => setDeleteTarget(item)}>
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Preview dialog */}
      {previewItem && (
        <div className="dialog-overlay">
          <div className="dialog-container">
            <div className="dialog-header">
              <h2>{previewItem.name}</h2>
              <button className="dialog-close" onClick={() => setPreviewItem(null)}><X size={20} /></button>
            </div>
            <div className="dialog-body">
              <div className="kb-preview-meta">
                <span className="kb-type-label">{previewItem.type.toUpperCase()}</span>
                <span>{formatSize(previewItem.size)}</span>
                <span>Uploaded {formatDate(previewItem.uploadDate)}</span>
              </div>
              <div className="kb-preview-body">
                <p className="kb-preview-placeholder">
                  Document preview is available when connected to a backend storage service.
                  For now, this document ({previewItem.name}) is {previewItem.status === 'indexed' ? 'indexed and ready' : previewItem.status}.
                </p>
              </div>
            </div>
            <div className="dialog-footer">
              <button className="btn btn-cancel" onClick={() => setPreviewItem(null)}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirmation */}
      {deleteTarget && (
        <div className="dialog-overlay">
          <div className="ac-confirm-dialog">
            <h3>Remove Document</h3>
            <p>Are you sure you want to remove <strong>"{deleteTarget.name}"</strong> from the knowledge base?
            {deleteTarget.status === 'indexed' && ' The indexed data will also be removed.'}</p>
            <div className="ac-confirm-actions">
              <button className="btn btn-cancel" onClick={() => setDeleteTarget(null)}>Cancel</button>
              <button className="btn btn-delete-confirm" onClick={handleDelete}>Remove</button>
            </div>
          </div>
        </div>
      )}

      <KnowledgeUploadDialog
        isOpen={uploadOpen}
        onClose={() => setUploadOpen(false)}
        onSave={handleAdd}
      />
    </div>
  )
}

export default KnowledgePanel
