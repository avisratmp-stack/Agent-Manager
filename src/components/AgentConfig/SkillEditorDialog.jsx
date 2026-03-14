import React, { useState, useEffect } from 'react'
import { X, Upload, FileText, Plus, Trash2, Info } from 'lucide-react'

const NAME_REGEX = /^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/
const NO_CONSECUTIVE_HYPHENS = /--/

function validateSkillName(name) {
  if (!name) return 'Skill name is required'
  if (name.length > 64) return 'Max 64 characters'
  if (name.startsWith('-') || name.endsWith('-')) return 'Must not start or end with a hyphen'
  if (NO_CONSECUTIVE_HYPHENS.test(name)) return 'Must not contain consecutive hyphens (--)'
  if (!NAME_REGEX.test(name)) return 'Only lowercase letters, numbers, and hyphens allowed'
  return null
}

const MAX_BODY_LINES = 500

function generateSkillMd(fields) {
  const fm = [`---`]
  fm.push(`name: ${fields.name}`)
  fm.push(`description: ${fields.description}`)
  if (fields.license) fm.push(`license: ${fields.license}`)
  if (fields.compatibility) fm.push(`compatibility: ${fields.compatibility}`)
  if (fields.metadata && fields.metadata.length > 0) {
    fm.push(`metadata:`)
    fields.metadata.forEach(m => { if (m.key) fm.push(`  ${m.key}: "${m.value}"`) })
  }
  if (fields.allowedTools) fm.push(`allowed-tools: ${fields.allowedTools}`)
  fm.push(`---`)
  if (fields.body) { fm.push(''); fm.push(fields.body) }
  return fm.join('\n')
}

function parseSkillMd(content) {
  const result = { name: '', description: '', license: '', compatibility: '', metadata: [], allowedTools: '', body: '' }
  if (!content) return result
  const fmMatch = content.match(/^---\s*\n([\s\S]*?)\n---\s*\n?([\s\S]*)$/)
  if (!fmMatch) { result.body = content; return result }
  const yaml = fmMatch[1]
  result.body = (fmMatch[2] || '').trim()
  const lines = yaml.split('\n')
  let inMetadata = false
  for (const line of lines) {
    if (/^metadata:\s*$/.test(line)) { inMetadata = true; continue }
    if (inMetadata) {
      const kvMatch = line.match(/^\s+(\S+):\s*"?([^"]*)"?\s*$/)
      if (kvMatch) { result.metadata.push({ key: kvMatch[1], value: kvMatch[2] }); continue }
      else inMetadata = false
    }
    const kv = line.match(/^(\S+):\s*(.*)$/)
    if (kv) {
      const [, key, val] = kv
      if (key === 'name') result.name = val.trim()
      else if (key === 'description') result.description = val.trim()
      else if (key === 'license') result.license = val.trim()
      else if (key === 'compatibility') result.compatibility = val.trim()
      else if (key === 'allowed-tools') result.allowedTools = val.trim()
    }
  }
  return result
}

const SkillEditorDialog = ({ isOpen, onClose, onSave, editData }) => {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [license, setLicense] = useState('')
  const [compatibility, setCompatibility] = useState('')
  const [metadata, setMetadata] = useState([])
  const [allowedTools, setAllowedTools] = useState('')
  const [body, setBody] = useState('')
  const [inputMode, setInputMode] = useState('form')
  const [rawContent, setRawContent] = useState('')
  const [errors, setErrors] = useState({})
  const [fileName, setFileName] = useState('')

  useEffect(() => {
    if (editData) {
      const parsed = parseSkillMd(editData.content)
      setName(parsed.name || editData.name || '')
      setDescription(parsed.description || editData.description || '')
      setLicense(parsed.license || '')
      setCompatibility(parsed.compatibility || '')
      setMetadata(parsed.metadata.length > 0 ? parsed.metadata : [])
      setAllowedTools(parsed.allowedTools || '')
      setBody(parsed.body || '')
      setRawContent(editData.content || '')
      setInputMode('form')
    } else {
      setName(''); setDescription(''); setLicense(''); setCompatibility('')
      setMetadata([]); setAllowedTools(''); setBody(''); setRawContent('')
      setInputMode('form')
    }
    setFileName('')
    setErrors({})
  }, [editData, isOpen])

  if (!isOpen) return null

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const ext = file.name.split('.').pop().toLowerCase()
    if (ext !== 'md') {
      setErrors({ file: 'SKILL.md files must be Markdown (.md)' })
      return
    }
    setFileName(file.name)
    const reader = new FileReader()
    reader.onload = (ev) => {
      const text = ev.target.result
      setRawContent(text)
      const parsed = parseSkillMd(text)
      setName(parsed.name); setDescription(parsed.description)
      setLicense(parsed.license); setCompatibility(parsed.compatibility)
      setMetadata(parsed.metadata); setAllowedTools(parsed.allowedTools)
      setBody(parsed.body)
      setInputMode('form')
    }
    reader.readAsText(file)
    setErrors({})
  }

  const addMetadataRow = () => setMetadata(prev => [...prev, { key: '', value: '' }])
  const removeMetadataRow = (idx) => setMetadata(prev => prev.filter((_, i) => i !== idx))
  const updateMetadata = (idx, field, val) => setMetadata(prev => prev.map((m, i) => i === idx ? { ...m, [field]: val } : m))

  const bodyLineCount = body ? body.split('\n').length : 0

  const validate = () => {
    const errs = {}
    const nameErr = validateSkillName(name)
    if (nameErr) errs.name = nameErr
    if (editData && editData.name && name !== editData.name) {
      errs.name = `Spec requires name to match the directory name "${editData.name}". Changing it would require renaming the folder.`
    }
    if (!description.trim()) errs.description = 'Description is required'
    else if (description.length > 1024) errs.description = `Max 1024 characters (${description.length})`
    if (compatibility && compatibility.length > 500) errs.compatibility = 'Max 500 characters'
    if (inputMode === 'raw' && !rawContent.trim()) errs.raw = 'Content is required'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSave = () => {
    if (!validate()) return
    const fullContent = inputMode === 'raw' ? rawContent : generateSkillMd({ name, description, license, compatibility, metadata, allowedTools, body })
    onSave({
      id: editData?.id || `sk-${Date.now()}`,
      name: name.trim(),
      description: description.trim(),
      status: editData?.status || 'active',
      lastModified: new Date().toISOString(),
      license: license.trim() || null,
      compatibility: compatibility.trim() || null,
      metadata: metadata.filter(m => m.key),
      allowedTools: allowedTools.trim() || null,
      content: fullContent
    })
  }

  const currentPreview = inputMode === 'raw' ? rawContent : generateSkillMd({ name, description, license, compatibility, metadata, allowedTools, body })

  return (
    <div className="dialog-overlay">
      <div className="dialog-container sk-editor-dialog">
        <div className="dialog-header">
          <div>
            <h2>{editData ? 'Edit Skill' : 'Add Skill'}</h2>
            <span className="sk-spec-link">
              Follows <a href="https://agentskills.io/specification" target="_blank" rel="noopener noreferrer">Agent Skills Spec</a>
            </span>
          </div>
          <button className="dialog-close" onClick={onClose}><X size={20} /></button>
        </div>

        <div className="dialog-body">
          {/* Input mode selector */}
          <div className="sk-input-toggle">
            <button className={`sk-toggle-btn ${inputMode === 'form' ? 'active' : ''}`} onClick={() => setInputMode('form')}>
              Structured Form
            </button>
            <button className={`sk-toggle-btn ${inputMode === 'raw' ? 'active' : ''}`} onClick={() => { setRawContent(currentPreview); setInputMode('raw') }}>
              Raw SKILL.md
            </button>
            <button className={`sk-toggle-btn ${inputMode === 'upload' ? 'active' : ''}`} onClick={() => setInputMode('upload')}>
              <Upload size={13} /> Upload
            </button>
          </div>

          {inputMode === 'upload' && (
            <div className="sk-upload-zone">
              <input type="file" accept=".md" onChange={handleFileUpload} id="skill-file-input" style={{ display: 'none' }} />
              <label htmlFor="skill-file-input" className="sk-upload-label">
                <Upload size={24} />
                <span>{fileName || 'Click to upload a SKILL.md file'}</span>
                <span className="sk-upload-hint">The frontmatter fields will be parsed into the form</span>
              </label>
              {errors.file && <span className="error-text" style={{ marginTop: 6, display: 'block' }}>{errors.file}</span>}
            </div>
          )}

          {inputMode === 'raw' && (
            <div className="form-group" style={{ marginTop: 12 }}>
              <label>SKILL.md Content <span className="required">*</span></label>
              <textarea
                className={`sk-content-editor ${errors.raw ? 'input-error' : ''}`}
                value={rawContent}
                onChange={e => { setRawContent(e.target.value); if (errors.raw) setErrors(p => ({ ...p, raw: null })) }}
                placeholder={'---\nname: my-skill\ndescription: What this skill does and when to use it.\n---\n\n# Instructions\n\nStep-by-step instructions here...'}
                rows={18}
                spellCheck={false}
              />
              {errors.raw && <span className="error-text">{errors.raw}</span>}
            </div>
          )}

          {inputMode === 'form' && (
            <>
              {/* Required fields */}
              <div className="sk-spec-section">
                <div className="sk-spec-section-title">
                  Required Fields
                  <span className="sk-spec-badge">SKILL.md frontmatter</span>
                </div>
                <div className="form-grid">
                  <div className="form-group">
                    <label>name <span className="required">*</span></label>
                    <input
                      type="text"
                      value={name}
                      onChange={e => { setName(e.target.value.toLowerCase()); if (errors.name) setErrors(p => ({ ...p, name: null })) }}
                      placeholder="e.g. severity-classification"
                      className={errors.name ? 'input-error' : ''}
                    />
                    <span className="sk-field-hint">Lowercase letters, numbers, hyphens. 1-64 chars. Must match parent directory name per spec.</span>
                    {errors.name && <span className="error-text">{errors.name}</span>}
                  </div>
                  <div className="form-group">
                    <label>description <span className="required">*</span></label>
                    <input
                      type="text"
                      value={description}
                      onChange={e => { setDescription(e.target.value); if (errors.description) setErrors(p => ({ ...p, description: null })) }}
                      placeholder="Describe what this skill does and when to use it"
                      className={errors.description ? 'input-error' : ''}
                    />
                    <span className="sk-field-hint">What it does + when to use it. Max 1024 chars. ({description.length}/1024)</span>
                    {errors.description && <span className="error-text">{errors.description}</span>}
                  </div>
                </div>
              </div>

              {/* Optional fields */}
              <div className="sk-spec-section">
                <div className="sk-spec-section-title">
                  Optional Fields
                </div>
                <div className="form-grid">
                  <div className="form-group">
                    <label>license</label>
                    <input type="text" value={license} onChange={e => setLicense(e.target.value)} placeholder="e.g. Apache-2.0" />
                    <span className="sk-field-hint">License name or reference to bundled file</span>
                  </div>
                  <div className="form-group">
                    <label>compatibility</label>
                    <input
                      type="text" value={compatibility}
                      onChange={e => { setCompatibility(e.target.value); if (errors.compatibility) setErrors(p => ({ ...p, compatibility: null })) }}
                      placeholder="e.g. Requires git, docker"
                      className={errors.compatibility ? 'input-error' : ''}
                    />
                    {errors.compatibility && <span className="error-text">{errors.compatibility}</span>}
                  </div>
                  <div className="form-group full-width">
                    <label>allowed-tools</label>
                    <input type="text" value={allowedTools} onChange={e => setAllowedTools(e.target.value)} placeholder='e.g. Bash(git:*) Bash(jq:*) Read' />
                    <span className="sk-field-hint">Space-delimited list of pre-approved tools (experimental)</span>
                  </div>
                </div>

                {/* Metadata */}
                <div className="sk-metadata-section">
                  <div className="sk-metadata-header">
                    <label>metadata</label>
                    <button className="sk-meta-add" onClick={addMetadataRow}><Plus size={12} /> Add</button>
                  </div>
                  {metadata.length === 0 && (
                    <span className="sk-field-hint">Optional key-value pairs for custom properties (author, version, etc.)</span>
                  )}
                  {metadata.map((m, idx) => (
                    <div key={idx} className="sk-metadata-row">
                      <input type="text" value={m.key} onChange={e => updateMetadata(idx, 'key', e.target.value)} placeholder="key" className="sk-meta-input" />
                      <input type="text" value={m.value} onChange={e => updateMetadata(idx, 'value', e.target.value)} placeholder="value" className="sk-meta-input" />
                      <button className="sk-meta-remove" onClick={() => removeMetadataRow(idx)}><Trash2 size={12} /></button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Body */}
              <div className="sk-spec-section">
                <div className="sk-spec-section-title">
                  Instructions
                  <span className="sk-spec-badge">SKILL.md body</span>
                </div>
                <textarea
                  className="sk-content-editor"
                  value={body}
                  onChange={e => setBody(e.target.value)}
                  placeholder={'# Step-by-step instructions\n\nWrite whatever helps agents perform this task effectively.\n\n## Examples\n\n## Edge cases'}
                  rows={10}
                  spellCheck={false}
                />
                <span className={`sk-field-hint ${bodyLineCount > MAX_BODY_LINES ? 'sk-field-warn' : ''}`}>
                  {bodyLineCount}/{MAX_BODY_LINES} lines. {bodyLineCount > MAX_BODY_LINES ? 'Exceeds recommended limit — consider splitting into references/ files.' : 'Keep under 500 lines; split longer content into reference files.'}
                </span>
              </div>

              {/* Preview */}
              <details className="sk-preview-toggle">
                <summary>Preview generated SKILL.md</summary>
                <pre className="sk-viewer-content">{currentPreview}</pre>
              </details>
            </>
          )}
        </div>

        <div className="dialog-footer">
          <button className="btn btn-cancel" onClick={onClose}>Cancel</button>
          <button className="btn btn-save" onClick={handleSave}>
            {editData ? 'Save Changes' : 'Add Skill'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default SkillEditorDialog
