import React, { useState, useCallback } from 'react'
import {
  Plus, Eye, Pencil, Power, Trash2, GripVertical, X,
  FileText, Zap, Shield, ExternalLink, FolderOpen, Upload,
  Download, ChevronDown, ChevronRight, Image, BookOpen, Code
} from 'lucide-react'
import SkillEditorDialog from './SkillEditorDialog'
import { api } from '../../api'

const SKILL_FOLDERS = [
  { key: 'assets', label: 'Assets', icon: Image, hint: 'Templates, images, resources' },
  { key: 'references', label: 'References', icon: BookOpen, hint: 'Documentation, specs' },
  { key: 'scripts', label: 'Scripts', icon: Code, hint: 'Executable code, automation' },
]

function SkillFolders({ agentSlug, skillName }) {
  const [expanded, setExpanded] = useState(null)
  const [files, setFiles] = useState({})
  const [uploading, setUploading] = useState(false)

  const loadFiles = useCallback(async (folder) => {
    if (!agentSlug || !skillName) return
    try {
      const res = await fetch(`/api/agents/${agentSlug}/skills/${skillName}/${folder}/files`)
      const data = await res.json()
      setFiles(prev => ({ ...prev, [folder]: data }))
    } catch {
      setFiles(prev => ({ ...prev, [folder]: [] }))
    }
  }, [agentSlug, skillName])

  const toggleFolder = (folder) => {
    if (expanded === folder) {
      setExpanded(null)
    } else {
      setExpanded(folder)
      if (!files[folder]) loadFiles(folder)
    }
  }

  const handleUpload = async (folder, e) => {
    const file = e.target.files?.[0]
    if (!file || !agentSlug || !skillName) return
    setUploading(true)
    const fd = new FormData()
    fd.append('file', file)
    try {
      await fetch(`/api/agents/${agentSlug}/skills/${skillName}/${folder}/upload`, { method: 'POST', body: fd })
      await loadFiles(folder)
    } catch {}
    setUploading(false)
    e.target.value = ''
  }

  const handleDelete = async (folder, fileName) => {
    if (!agentSlug || !skillName) return
    try {
      await fetch(`/api/agents/${agentSlug}/skills/${skillName}/${folder}/files/${fileName}`, { method: 'DELETE' })
      setFiles(prev => ({ ...prev, [folder]: (prev[folder] || []).filter(f => f.name !== fileName) }))
    } catch {}
  }

  return (
    <div className="sk-folders">
      {SKILL_FOLDERS.map(({ key, label, icon: Icon, hint }) => (
        <div key={key} className="sk-folder">
          <div className="sk-folder-header" onClick={() => toggleFolder(key)}>
            {expanded === key ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
            <Icon size={14} />
            <span className="sk-folder-name">{label}/</span>
            <span className="sk-folder-hint">{hint}</span>
            {files[key]?.length > 0 && <span className="sk-folder-count">{files[key].length}</span>}
          </div>
          {expanded === key && (
            <div className="sk-folder-body">
              <div className="sk-folder-actions">
                <label className="sk-folder-upload-btn">
                  <Upload size={12} /> Upload
                  <input type="file" hidden onChange={(e) => handleUpload(key, e)} />
                </label>
              </div>
              {uploading && <div className="sk-folder-msg">Uploading...</div>}
              {(files[key] || []).length === 0 && !uploading && (
                <div className="sk-folder-msg">No files</div>
              )}
              {(files[key] || []).map(f => (
                <div key={f.name} className="sk-folder-file">
                  <FileText size={12} />
                  <span className="sk-folder-file-name">{f.name}</span>
                  <span className="sk-folder-file-size">{f.size < 1024 ? f.size + ' B' : (f.size / 1024).toFixed(1) + ' KB'}</span>
                  <a
                    href={`/api/agents/${agentSlug}/skills/${skillName}/${key}/download/${f.name}`}
                    download
                    className="sk-folder-file-btn"
                    title="Download"
                  >
                    <Download size={12} />
                  </a>
                  <button className="sk-folder-file-btn sk-folder-file-del" title="Delete" onClick={() => handleDelete(key, f.name)}>
                    <Trash2 size={12} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

const SkillsPanel = ({ skills, onUpdate, agentSlug }) => {
  const [editorOpen, setEditorOpen] = useState(false)
  const [editingSkill, setEditingSkill] = useState(null)
  const [viewingSkill, setViewingSkill] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [dragIdx, setDragIdx] = useState(null)
  const [foldersOpen, setFoldersOpen] = useState({})

  const handleAdd = () => {
    setEditingSkill(null)
    setEditorOpen(true)
  }

  const handleEdit = (skill) => {
    setEditingSkill(skill)
    setEditorOpen(true)
  }

  const handleSave = async (skillData) => {
    if (editingSkill) {
      if (agentSlug) {
        try {
          const { skills: updated } = await api.updateSkill(agentSlug, skillData.name, skillData.content)
          onUpdate(updated)
        } catch (err) {
          console.error('Failed to update skill', err)
          onUpdate(skills.map(s => s.id === editingSkill.id ? skillData : s))
        }
      } else {
        onUpdate(skills.map(s => s.id === editingSkill.id ? skillData : s))
      }
    } else {
      const conflict = skills.find(s => s.name === skillData.name && s.id !== skillData.id)
      if (conflict) {
        const confirmed = window.confirm(
          `A skill named "${conflict.name}" already exists. The spec requires unique directory names. Continue anyway?`
        )
        if (!confirmed) return
      }
      if (agentSlug) {
        try {
          const { skills: updated } = await api.createSkill(agentSlug, skillData.name, skillData.content)
          onUpdate(updated)
        } catch (err) {
          console.error('Failed to create skill', err)
          onUpdate([...skills, skillData])
        }
      } else {
        onUpdate([...skills, skillData])
      }
    }
    setEditorOpen(false)
  }

  const handleToggle = (id) => {
    onUpdate(skills.map(s =>
      s.id === id ? { ...s, status: s.status === 'active' ? 'inactive' : 'active' } : s
    ))
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    if (agentSlug) {
      try {
        const { skills: updated } = await api.deleteSkill(agentSlug, deleteTarget.name)
        onUpdate(updated)
      } catch (err) {
        console.error('Failed to delete skill', err)
        onUpdate(skills.filter(s => s.id !== deleteTarget.id))
      }
    } else {
      onUpdate(skills.filter(s => s.id !== deleteTarget.id))
    }
    setDeleteTarget(null)
  }

  const handleDragStart = (idx) => setDragIdx(idx)
  const handleDragOver = (e, idx) => {
    e.preventDefault()
    if (dragIdx === null || dragIdx === idx) return
    const reordered = [...skills]
    const [moved] = reordered.splice(dragIdx, 1)
    reordered.splice(idx, 0, moved)
    onUpdate(reordered)
    setDragIdx(idx)
  }
  const handleDragEnd = () => setDragIdx(null)

  const formatDate = (iso) => {
    const d = new Date(iso)
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  const truncate = (str, len) => str && str.length > len ? str.slice(0, len) + '...' : str

  return (
    <div className="sk-panel">
      <div className="sk-panel-header">
        <div>
          <h3 className="sk-panel-title">Skills</h3>
          <p className="sk-panel-desc">
            Structured capabilities following the <a href="https://agentskills.io/specification" target="_blank" rel="noopener noreferrer" className="sk-spec-inline-link">Agent Skills spec</a>. Order matters — higher priority skills are evaluated first.
          </p>
        </div>
        <button className="ac-btn ac-btn-create" onClick={handleAdd}>
          <Plus size={14} /> Add Skill
        </button>
      </div>

      {skills.length === 0 ? (
        <div className="sk-empty">
          <Zap size={32} />
          <h4>No skills configured</h4>
          <p>Skills define what this agent knows and how it behaves. Each skill is a SKILL.md file with frontmatter metadata and markdown instructions.</p>
          <button className="ac-btn ac-btn-create" onClick={handleAdd}>
            <Plus size={14} /> Add First Skill
          </button>
        </div>
      ) : (
        <div className="sk-list">
          {skills.map((skill, idx) => (
            <div
              key={skill.id}
              className={`sk-item ${skill.status === 'inactive' ? 'sk-item-inactive' : ''} ${dragIdx === idx ? 'sk-item-dragging' : ''}`}
              draggable
              onDragStart={() => handleDragStart(idx)}
              onDragOver={(e) => handleDragOver(e, idx)}
              onDragEnd={handleDragEnd}
            >
              <div className="sk-item-grip" title="Drag to reorder">
                <GripVertical size={14} />
              </div>
              <div className="sk-item-order">{idx + 1}</div>
              <div className="sk-item-icon"><FileText size={16} /></div>
              <div className="sk-item-info">
                <div className="sk-item-name">
                  <code className="sk-name-slug">{skill.name}</code>
                  <span className={`sk-status-dot ${skill.status}`} title={skill.status} />
                </div>
                <div className="sk-item-desc">{truncate(skill.description, 80) || '—'}</div>
                <div className="sk-item-meta">
                  {skill.license && <span className="sk-meta-pill"><Shield size={10} /> {skill.license}</span>}
                  {skill.metadata?.length > 0 && skill.metadata.map(m => (
                    m.key && <span key={m.key} className="sk-meta-pill">{m.key}: {m.value}</span>
                  ))}
                  <span className="sk-date">Modified {formatDate(skill.lastModified)}</span>
                </div>
              </div>
              <div className="sk-item-actions">
                <button
                  className={`sk-action-btn ${foldersOpen[skill.id] ? 'sk-action-active' : ''}`}
                  title="Files"
                  onClick={() => setFoldersOpen(prev => ({ ...prev, [skill.id]: !prev[skill.id] }))}
                >
                  <FolderOpen size={14} />
                </button>
                <button className="sk-action-btn" title="View SKILL.md" onClick={() => setViewingSkill(skill)}>
                  <Eye size={14} />
                </button>
                <button className="sk-action-btn" title="Edit" onClick={() => handleEdit(skill)}>
                  <Pencil size={14} />
                </button>
                <button
                  className={`sk-action-btn ${skill.status === 'inactive' ? 'sk-action-enable' : ''}`}
                  title={skill.status === 'active' ? 'Disable' : 'Enable'}
                  onClick={() => handleToggle(skill.id)}
                >
                  <Power size={14} />
                </button>
                <button className="sk-action-btn sk-action-delete" title="Delete" onClick={() => setDeleteTarget(skill)}>
                  <Trash2 size={14} />
                </button>
              </div>
              {foldersOpen[skill.id] && (
                <SkillFolders agentSlug={agentSlug} skillName={skill.name} />
              )}
            </div>
          ))}
        </div>
      )}

      {/* Skill viewer */}
      {viewingSkill && (
        <div className="dialog-overlay">
          <div className="dialog-container sk-viewer-dialog">
            <div className="dialog-header">
              <div>
                <h2><code>{viewingSkill.name}/</code>SKILL.md</h2>
              </div>
              <button className="dialog-close" onClick={() => setViewingSkill(null)}><X size={20} /></button>
            </div>
            <div className="dialog-body">
              <div className="sk-viewer-meta">
                <span className={`ac-badge ${viewingSkill.status === 'active' ? 'ac-badge-on' : 'ac-badge-off'}`}>
                  {viewingSkill.status}
                </span>
                {viewingSkill.license && <span className="sk-meta-pill"><Shield size={10} /> {viewingSkill.license}</span>}
                {viewingSkill.compatibility && <span className="sk-meta-pill">{viewingSkill.compatibility}</span>}
              </div>
              <div className="sk-viewer-dir">
                <span className="sk-dir-label">Directory Structure (per agentskills.io spec)</span>
                <pre className="sk-dir-tree">{`${viewingSkill.name}/\n├── SKILL.md          # Required: metadata + instructions\n├── scripts/          # Optional: executable code\n│   └── readme.txt\n├── references/       # Optional: documentation\n│   └── readme.txt\n└── assets/           # Optional: templates, resources\n    └── readme.txt`}</pre>
              </div>
              <div className="sk-viewer-file-label">SKILL.md</div>
              <pre className="sk-viewer-content">{viewingSkill.content}</pre>
            </div>
            <div className="dialog-footer">
              <button className="btn btn-cancel" onClick={() => setViewingSkill(null)}>Close</button>
              <button className="btn btn-save" onClick={() => { setViewingSkill(null); handleEdit(viewingSkill) }}>Edit</button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirmation */}
      {deleteTarget && (
        <div className="dialog-overlay">
          <div className="ac-confirm-dialog">
            <h3>Delete Skill</h3>
            <p>Remove skill <strong><code>{deleteTarget.name}</code></strong> and its SKILL.md? This cannot be undone.</p>
            <div className="ac-confirm-actions">
              <button className="btn btn-cancel" onClick={() => setDeleteTarget(null)}>Cancel</button>
              <button className="btn btn-delete-confirm" onClick={handleDelete}>Delete</button>
            </div>
          </div>
        </div>
      )}

      <SkillEditorDialog
        isOpen={editorOpen}
        onClose={() => setEditorOpen(false)}
        onSave={handleSave}
        editData={editingSkill}
      />
    </div>
  )
}

export default SkillsPanel
