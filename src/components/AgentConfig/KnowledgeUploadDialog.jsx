import React, { useState, useEffect } from 'react'
import { X, Upload, Link, FileText, AlertTriangle } from 'lucide-react'

const ALLOWED_EXTENSIONS = ['pdf', 'docx', 'txt', 'md']
const MAX_FILE_SIZE = 20 * 1024 * 1024

const KnowledgeUploadDialog = ({ isOpen, onClose, onSave }) => {
  const [inputMode, setInputMode] = useState('file')
  const [file, setFile] = useState(null)
  const [url, setUrl] = useState('')
  const [textContent, setTextContent] = useState('')
  const [textName, setTextName] = useState('')
  const [tags, setTags] = useState('')
  const [errors, setErrors] = useState({})

  useEffect(() => {
    setFile(null)
    setUrl('')
    setTextContent('')
    setTextName('')
    setTags('')
    setErrors({})
    setInputMode('file')
  }, [isOpen])

  if (!isOpen) return null

  const handleFileSelect = (e) => {
    const f = e.target.files?.[0]
    if (!f) return
    const ext = f.name.split('.').pop().toLowerCase()
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      setErrors({ file: `Unsupported file type ".${ext}". Allowed: ${ALLOWED_EXTENSIONS.join(', ')}` })
      setFile(null)
      return
    }
    if (f.size > MAX_FILE_SIZE) {
      setErrors({ file: `File too large (${(f.size / 1024 / 1024).toFixed(1)} MB). Max: 20 MB` })
      setFile(null)
      return
    }
    setFile(f)
    setErrors({})
  }

  const validate = () => {
    const errs = {}
    if (inputMode === 'file' && !file) errs.file = 'Please select a file'
    if (inputMode === 'url') {
      if (!url.trim()) errs.url = 'URL is required'
      else if (!/^https?:\/\/.+/.test(url.trim())) errs.url = 'Enter a valid URL (http:// or https://)'
    }
    if (inputMode === 'text') {
      if (!textName.trim()) errs.textName = 'Document name is required'
      if (!textContent.trim()) errs.textContent = 'Content is required'
    }
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const parseTags = () => tags.split(',').map(t => t.trim()).filter(Boolean)

  const handleSave = () => {
    if (!validate()) return
    const base = {
      id: `kb-${Date.now()}`,
      uploadDate: new Date().toISOString(),
      status: 'processing',
      tags: parseTags()
    }
    if (inputMode === 'file') {
      const ext = file.name.split('.').pop().toLowerCase()
      onSave({ ...base, name: file.name, type: ext, source: 'file', size: file.size })
    } else if (inputMode === 'url') {
      onSave({ ...base, name: url.trim(), type: 'url', source: url.trim(), size: null })
    } else {
      onSave({ ...base, name: textName.trim(), type: 'txt', source: 'text', size: textContent.length })
    }
  }

  const formatSize = (bytes) => {
    if (!bytes) return '—'
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  return (
    <div className="dialog-overlay">
      <div className="dialog-container kb-upload-dialog">
        <div className="dialog-header">
          <h2>Add to Knowledge Base</h2>
          <button className="dialog-close" onClick={onClose}><X size={20} /></button>
        </div>

        <div className="dialog-body">
          <div className="kb-source-tabs">
            <button className={`kb-tab ${inputMode === 'file' ? 'active' : ''}`} onClick={() => setInputMode('file')}>
              <Upload size={14} /> Upload File
            </button>
            <button className={`kb-tab ${inputMode === 'url' ? 'active' : ''}`} onClick={() => setInputMode('url')}>
              <Link size={14} /> From URL
            </button>
            <button className={`kb-tab ${inputMode === 'text' ? 'active' : ''}`} onClick={() => setInputMode('text')}>
              <FileText size={14} /> Paste Text
            </button>
          </div>

          {inputMode === 'file' && (
            <div className="kb-file-section">
              <input
                type="file"
                accept=".pdf,.docx,.txt,.md"
                onChange={handleFileSelect}
                id="kb-file-input"
                style={{ display: 'none' }}
              />
              <label htmlFor="kb-file-input" className={`kb-drop-zone ${file ? 'has-file' : ''}`}>
                {file ? (
                  <div className="kb-file-info">
                    <FileText size={20} />
                    <div>
                      <span className="kb-file-name">{file.name}</span>
                      <span className="kb-file-size">{formatSize(file.size)}</span>
                    </div>
                  </div>
                ) : (
                  <>
                    <Upload size={28} />
                    <span className="kb-drop-primary">Click to select a file</span>
                    <span className="kb-drop-hint">PDF, DOCX, TXT, or MD — up to 20 MB</span>
                  </>
                )}
              </label>
              {errors.file && (
                <div className="kb-error-banner">
                  <AlertTriangle size={14} />
                  <span>{errors.file}</span>
                </div>
              )}
            </div>
          )}

          {inputMode === 'url' && (
            <div className="form-group" style={{ marginTop: 16 }}>
              <label>URL <span className="required">*</span></label>
              <input
                type="text"
                value={url}
                onChange={e => { setUrl(e.target.value); if (errors.url) setErrors(p => ({ ...p, url: null })) }}
                placeholder="https://example.com/document"
                className={errors.url ? 'input-error' : ''}
              />
              {errors.url && <span className="error-text">{errors.url}</span>}
              <span className="kb-url-note">The page content will be fetched and indexed automatically.</span>
            </div>
          )}

          {inputMode === 'text' && (
            <>
              <div className="form-group" style={{ marginTop: 16 }}>
                <label>Document Name <span className="required">*</span></label>
                <input
                  type="text"
                  value={textName}
                  onChange={e => { setTextName(e.target.value); if (errors.textName) setErrors(p => ({ ...p, textName: null })) }}
                  placeholder="e.g. Error Codes Reference"
                  className={errors.textName ? 'input-error' : ''}
                />
                {errors.textName && <span className="error-text">{errors.textName}</span>}
              </div>
              <div className="form-group" style={{ marginTop: 12 }}>
                <label>Content <span className="required">*</span></label>
                <textarea
                  className={`kb-text-area ${errors.textContent ? 'input-error' : ''}`}
                  value={textContent}
                  onChange={e => { setTextContent(e.target.value); if (errors.textContent) setErrors(p => ({ ...p, textContent: null })) }}
                  placeholder="Paste or type your document content here..."
                  rows={8}
                />
                {errors.textContent && <span className="error-text">{errors.textContent}</span>}
              </div>
            </>
          )}

          <div className="form-group" style={{ marginTop: 16 }}>
            <label>Tags <span className="kb-tag-hint">(comma-separated, optional)</span></label>
            <input
              type="text"
              value={tags}
              onChange={e => setTags(e.target.value)}
              placeholder="e.g. reference, playbook, v2"
            />
          </div>
        </div>

        <div className="dialog-footer">
          <button className="btn btn-cancel" onClick={onClose}>Cancel</button>
          <button className="btn btn-save" onClick={handleSave}>Add Document</button>
        </div>
      </div>
    </div>
  )
}

export default KnowledgeUploadDialog
