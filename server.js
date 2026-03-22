const express = require('express')
const fs = require('fs')
const path = require('path')
const dns = require('dns')
const os = require('os')
const multer = require('multer')
const AdmZip = require('adm-zip')

const app = express()
app.use(express.json({ limit: '10mb' }))

const ACCESS_LOG = path.join(__dirname, 'user_access.log')
const hostnameCache = {}

function resolveHostname(ip) {
  return new Promise(resolve => {
    const clean = ip.replace(/^::ffff:/, '')
    if (clean === '127.0.0.1' || clean === '::1' || clean === '1') {
      resolve(os.hostname())
      return
    }
    if (hostnameCache[clean]) { resolve(hostnameCache[clean]); return }
    dns.reverse(clean, (err, hostnames) => {
      const name = (!err && hostnames && hostnames.length) ? hostnames[0] : null
      if (name) hostnameCache[clean] = name
      resolve(name)
    })
  })
}

app.use(async (req, res, next) => {
  const ip = (req.headers['x-forwarded-for'] || req.socket.remoteAddress || '').replace(/^::ffff:/, '')
  const hostname = await resolveHostname(ip)
  const d = new Date()
  const ts = `${String(d.getDate()).padStart(2,'0')}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getFullYear()).slice(-2)} ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`
  const client = hostname ? `${hostname} (${ip})` : ip
  const line = `[${ts}] ${req.method} ${req.originalUrl} — ${client}\n`
  fs.appendFile(ACCESS_LOG, line, () => {})
  next()
})

const DATA_DIR = path.join(__dirname, 'src', 'config')
const AGENTS_DIR = path.join(DATA_DIR, 'agents')
const REGISTRY_PATH = path.join(DATA_DIR, 'common', 'agents.json')
const MCP_SERVERS_PATH = path.join(DATA_DIR, 'common', 'mcp-servers.json')
const LOGGER_DIR = path.join(__dirname, 'logger')

function readMcpServers() {
  if (!fs.existsSync(MCP_SERVERS_PATH)) return []
  return JSON.parse(fs.readFileSync(MCP_SERVERS_PATH, 'utf-8'))
}

function writeMcpServers(data) {
  fs.writeFileSync(MCP_SERVERS_PATH, JSON.stringify(data, null, 2) + '\n')
}

function readRegistry() {
  return JSON.parse(fs.readFileSync(REGISTRY_PATH, 'utf-8'))
}

function writeRegistry(data) {
  fs.writeFileSync(REGISTRY_PATH, JSON.stringify(data, null, 2) + '\n')
}

function parseSkillMd(content) {
  const result = { name: '', description: '', license: null, compatibility: null, metadata: [], allowedTools: null, body: '' }
  const fmMatch = content.match(/^---\s*\n([\s\S]*?)\n---\s*\n?([\s\S]*)$/)
  if (!fmMatch) return { ...result, body: content }
  const yaml = fmMatch[1]
  result.body = (fmMatch[2] || '').trim()
  let inMetadata = false
  for (const line of yaml.split('\n')) {
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

function loadSkillsForAgent(slug) {
  const skillsDir = path.join(AGENTS_DIR, slug, 'skills')
  if (!fs.existsSync(skillsDir)) return []
  const skills = []
  for (const dir of fs.readdirSync(skillsDir, { withFileTypes: true })) {
    if (!dir.isDirectory()) continue
    const mdPath = path.join(skillsDir, dir.name, 'SKILL.md')
    if (!fs.existsSync(mdPath)) continue
    const content = fs.readFileSync(mdPath, 'utf-8')
    const parsed = parseSkillMd(content)
    const stat = fs.statSync(mdPath)
    skills.push({
      id: `sk-${slug}-${dir.name}`,
      name: parsed.name || dir.name,
      description: parsed.description || '',
      status: 'active',
      lastModified: stat.mtime.toISOString(),
      license: parsed.license,
      compatibility: parsed.compatibility,
      metadata: parsed.metadata,
      allowedTools: parsed.allowedTools,
      content
    })
  }
  return skills
}

function loadReferenceForAgent(slug) {
  const manifestPath = path.join(AGENTS_DIR, slug, 'references', 'manifest.json')
  if (!fs.existsSync(manifestPath)) return []
  try { return JSON.parse(fs.readFileSync(manifestPath, 'utf-8')) }
  catch { return [] }
}

function buildAgentRecord(entry) {
  const record = {
    id: entry.id,
    type: entry.type,
    role: entry.role || null,
    stage: entry.stage || null,
    environment: entry.environment || 'AOC',
    tags: entry.tags || [],
    suite: entry.suite || [],
    slug: entry.slug,
    calls: entry.calls || [],
    mcpBindings: entry.mcpBindings || [],
    enabled: entry.enabled !== false,
    agent: entry.agent,
    managedSkills: [],
    references: [],
  }
  if (entry.type === 'local' && entry.slug) {
    record.managedSkills = loadSkillsForAgent(entry.slug)
    record.references = loadReferenceForAgent(entry.slug)
  }
  return record
}

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
}

function scaffoldAgentDir(slug) {
  const agentDir = path.join(AGENTS_DIR, slug)
  const skillsDir = path.join(agentDir, 'skills')
  const referenceDir = path.join(agentDir, 'references')

  ensureDir(skillsDir)
  ensureDir(referenceDir)

  const skillsReadme = path.join(skillsDir, 'README.optional.md')
  if (!fs.existsSync(skillsReadme)) {
    fs.writeFileSync(skillsReadme,
      `# Skills\n\nEach subdirectory is one skill. Every skill folder must contain a \`SKILL.md\` file\nwith YAML frontmatter (name, description) and markdown instructions.\n\nOptional subdirectories per skill: \`scripts/\`, \`references/\`, \`assets/\`.\n\nSee https://agentskills.io/specification for the full spec.\n`)
  }

  const referenceReadme = path.join(referenceDir, 'README.optional.md')
  if (!fs.existsSync(referenceReadme)) {
    fs.writeFileSync(referenceReadme,
      `# Reference\n\nPlace reference documents here (PDF, DOCX, TXT, MD).\nThe \`manifest.json\` file tracks all entries.\n`)
  }

  const manifestPath = path.join(referenceDir, 'manifest.json')
  if (!fs.existsSync(manifestPath)) {
    fs.writeFileSync(manifestPath, '[]\n')
  }
}

// ── GET /api/agents ──
app.get('/api/agents', (req, res) => {
  const registry = readRegistry()
  const agents = registry.agents.map(buildAgentRecord)
  res.json(agents)
})

// ── GET /api/consumers ──
app.get('/api/consumers', (req, res) => {
  const registry = readRegistry()
  res.json(registry.consumers || [])
})

// ── POST /api/agents ──
app.post('/api/agents', (req, res) => {
  const registry = readRegistry()
  const { type, role, stage, environment, tags, suite, slug, agent, mcpBindings } = req.body
  const newId = registry.agents.length > 0
    ? Math.max(...registry.agents.map(a => a.id)) + 1 : 1

  const entry = { id: newId, type, role: role || null, stage: stage || null, environment: environment || 'AOC', tags: tags || [], suite: suite || [], slug: slug || null, calls: [], mcpBindings: mcpBindings || [], agent }
  registry.agents.push(entry)
  writeRegistry(registry)

  if (type === 'local' && slug) {
    scaffoldAgentDir(slug)
  }

  res.json(buildAgentRecord(entry))
})

// ── PUT /api/agents/:id ──
app.put('/api/agents/:id', (req, res) => {
  const id = parseInt(req.params.id)
  const registry = readRegistry()
  const idx = registry.agents.findIndex(a => a.id === id)
  if (idx === -1) return res.status(404).json({ error: 'Agent not found' })

  const { type, role, stage, environment, tags, suite, slug, agent, mcpBindings } = req.body
  registry.agents[idx] = { ...registry.agents[idx], type, role: role !== undefined ? (role || null) : registry.agents[idx].role, stage: stage !== undefined ? (stage || null) : registry.agents[idx].stage, environment: environment !== undefined ? (environment || 'AOC') : (registry.agents[idx].environment || 'AOC'), tags: tags !== undefined ? (tags || []) : (registry.agents[idx].tags || []), suite: suite !== undefined ? (suite || []) : (registry.agents[idx].suite || []), slug: slug || null, agent, mcpBindings: mcpBindings || registry.agents[idx].mcpBindings || [] }
  writeRegistry(registry)
  res.json(buildAgentRecord(registry.agents[idx]))
})

// ── DELETE /api/agents/:id ──
app.delete('/api/agents/:id', (req, res) => {
  const id = parseInt(req.params.id)
  const registry = readRegistry()
  const entry = registry.agents.find(a => a.id === id)
  if (!entry) return res.status(404).json({ error: 'Agent not found' })

  registry.agents = registry.agents.filter(a => a.id !== id)
  writeRegistry(registry)

  if (entry.type === 'local' && entry.slug) {
    const agentDir = path.join(AGENTS_DIR, entry.slug)
    if (fs.existsSync(agentDir)) {
      fs.rmSync(agentDir, { recursive: true, force: true })
    }
  }

  res.json({ ok: true })
})

// ── POST /api/agents/:slug/skills ──
app.post('/api/agents/:slug/skills', (req, res) => {
  const { slug } = req.params
  const { name, content } = req.body
  const skillDir = path.join(AGENTS_DIR, slug, 'skills', name)
  ensureDir(skillDir)
  ensureDir(path.join(skillDir, 'scripts'))
  ensureDir(path.join(skillDir, 'references'))
  ensureDir(path.join(skillDir, 'assets'))
  fs.writeFileSync(path.join(skillDir, 'SKILL.md'), content)

  const readmeTpl = { scripts: 'Helper scripts', references: 'Reference materials', assets: 'Static assets' }
  for (const [dir, desc] of Object.entries(readmeTpl)) {
    const rp = path.join(skillDir, dir, 'README.optional.md')
    if (!fs.existsSync(rp)) {
      fs.writeFileSync(rp, `# ${desc.charAt(0).toUpperCase() + desc.slice(1)} (Optional)\n\nPlace ${desc.toLowerCase()} here.\n`)
    }
  }

  res.json({ skills: loadSkillsForAgent(slug) })
})

// ── PUT /api/agents/:slug/skills/:skillName ──
app.put('/api/agents/:slug/skills/:skillName', (req, res) => {
  const { slug, skillName } = req.params
  const { content } = req.body
  const mdPath = path.join(AGENTS_DIR, slug, 'skills', skillName, 'SKILL.md')
  if (!fs.existsSync(path.dirname(mdPath))) {
    return res.status(404).json({ error: 'Skill folder not found' })
  }
  fs.writeFileSync(mdPath, content)
  res.json({ skills: loadSkillsForAgent(slug) })
})

// ── DELETE /api/agents/:slug/skills/:skillName ──
app.delete('/api/agents/:slug/skills/:skillName', (req, res) => {
  const { slug, skillName } = req.params
  const skillDir = path.join(AGENTS_DIR, slug, 'skills', skillName)
  if (fs.existsSync(skillDir)) {
    fs.rmSync(skillDir, { recursive: true, force: true })
  }
  res.json({ skills: loadSkillsForAgent(slug) })
})

// ── POST /api/agents/:slug/reference ──
app.post('/api/agents/:slug/references', (req, res) => {
  const { slug } = req.params
  const item = req.body
  const manifestPath = path.join(AGENTS_DIR, slug, 'references', 'manifest.json')
  ensureDir(path.dirname(manifestPath))
  let manifest = []
  if (fs.existsSync(manifestPath)) {
    try { manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8')) } catch {}
  }
  manifest.push(item)
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2))
  res.json({ reference: manifest })
})

// ── DELETE /api/agents/:slug/references/:id ──
app.delete('/api/agents/:slug/references/:id', (req, res) => {
  const { slug, id } = req.params
  const manifestPath = path.join(AGENTS_DIR, slug, 'references', 'manifest.json')
  if (!fs.existsSync(manifestPath)) return res.json({ reference: [] })
  let manifest = []
  try { manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8')) } catch {}
  manifest = manifest.filter(k => k.id !== id)
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2))
  res.json({ reference: manifest })
})

// ── GET /api/agents/:slug/references/files ──
app.get('/api/agents/:slug/references/files', (req, res) => {
  const refDir = path.join(AGENTS_DIR, req.params.slug, 'references')
  if (!fs.existsSync(refDir)) return res.json([])
  const files = fs.readdirSync(refDir)
    .filter(f => !f.startsWith('README') && f !== 'manifest.json')
    .map(f => {
      const stat = fs.statSync(path.join(refDir, f))
      return { name: f, size: stat.size, modified: stat.mtime.toISOString() }
    })
  res.json(files)
})

// ── POST /api/agents/:slug/references/upload ──
const refUpload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 20 * 1024 * 1024 } })
app.post('/api/agents/:slug/references/upload', refUpload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file' })
  const refDir = path.join(AGENTS_DIR, req.params.slug, 'references')
  ensureDir(refDir)
  fs.writeFileSync(path.join(refDir, req.file.originalname), req.file.buffer)
  res.json({ ok: true, name: req.file.originalname })
})

// ── GET /api/agents/:slug/references/download/:filename ──
app.get('/api/agents/:slug/references/download/:filename', (req, res) => {
  const filePath = path.join(AGENTS_DIR, req.params.slug, 'references', req.params.filename)
  if (!fs.existsSync(filePath)) return res.status(404).json({ error: 'File not found' })
  res.download(filePath)
})

// ── DELETE /api/agents/:slug/references/files/:filename ──
app.delete('/api/agents/:slug/references/files/:filename', (req, res) => {
  const filePath = path.join(AGENTS_DIR, req.params.slug, 'references', req.params.filename)
  if (fs.existsSync(filePath)) fs.unlinkSync(filePath)
  res.json({ ok: true })
})

// ── GET /api/mcp-servers ──
app.get('/api/mcp-servers', (req, res) => {
  res.json(readMcpServers())
})

// ── POST /api/mcp-servers ──
app.post('/api/mcp-servers', (req, res) => {
  const servers = readMcpServers()
  const entry = req.body
  if (!entry.id) return res.status(400).json({ error: 'id is required' })
  if (servers.find(s => s.id === entry.id)) return res.status(409).json({ error: `Server "${entry.id}" already exists` })
  servers.push(entry)
  writeMcpServers(servers)
  res.json(servers)
})

// ── PUT /api/mcp-servers/:id ──
app.put('/api/mcp-servers/:id', (req, res) => {
  const servers = readMcpServers()
  const idx = servers.findIndex(s => s.id === req.params.id)
  if (idx === -1) return res.status(404).json({ error: 'Server not found' })
  servers[idx] = { ...servers[idx], ...req.body, id: req.params.id }
  writeMcpServers(servers)
  res.json(servers)
})

// ── DELETE /api/mcp-servers/:id ──
app.delete('/api/mcp-servers/:id', (req, res) => {
  let servers = readMcpServers()
  servers = servers.filter(s => s.id !== req.params.id)
  writeMcpServers(servers)
  res.json(servers)
})

// ── PUT /api/agents/:id/mcp-bindings ──
app.put('/api/agents/:id/mcp-bindings', (req, res) => {
  const id = parseInt(req.params.id)
  const registry = readRegistry()
  const idx = registry.agents.findIndex(a => a.id === id)
  if (idx === -1) return res.status(404).json({ error: 'Agent not found' })
  registry.agents[idx].mcpBindings = req.body.mcpBindings || []
  writeRegistry(registry)
  res.json(buildAgentRecord(registry.agents[idx]))
})

// ── PATCH /api/agents/:id/enabled ──
app.patch('/api/agents/:id/enabled', (req, res) => {
  const id = parseInt(req.params.id)
  const registry = readRegistry()
  const idx = registry.agents.findIndex(a => a.id === id)
  if (idx === -1) return res.status(404).json({ error: 'Agent not found' })
  registry.agents[idx].enabled = !!req.body.enabled
  writeRegistry(registry)
  res.json(buildAgentRecord(registry.agents[idx]))
})

// ── PATCH /api/mcp-servers/:id/enabled ──
app.patch('/api/mcp-servers/:id/enabled', (req, res) => {
  const servers = readMcpServers()
  const idx = servers.findIndex(s => s.id === req.params.id)
  if (idx === -1) return res.status(404).json({ error: 'Server not found' })
  servers[idx].enabled = !!req.body.enabled
  writeMcpServers(servers)
  res.json(servers[idx])
})

// ── GET /api/sky-tasks ──
app.get('/api/sky-tasks', (req, res) => {
  const tasksPath = path.join(DATA_DIR, 'common', 'sky-tasks.json')
  if (!fs.existsSync(tasksPath)) return res.json({ tasks: [] })
  try {
    res.json(JSON.parse(fs.readFileSync(tasksPath, 'utf-8')))
  } catch { res.json({ tasks: [] }) }
})

// ── GET /api/sky-tasks-att ──
app.get('/api/sky-tasks-att', (req, res) => {
  const tasksPath = path.join(DATA_DIR, 'common', 'sky-tasks-att.json')
  if (!fs.existsSync(tasksPath)) return res.json({ tasks: [] })
  try {
    res.json(JSON.parse(fs.readFileSync(tasksPath, 'utf-8')))
  } catch { res.json({ tasks: [] }) }
})

// ── GET /api/agent-handlers ──
app.get('/api/agent-handlers', (req, res) => {
  const dirs = fs.readdirSync(AGENTS_DIR).filter(d => {
    const hp = path.join(AGENTS_DIR, d, 'services', 'handler.py')
    return fs.existsSync(hp)
  })
  const handlers = dirs.map(slug => {
    const content = fs.readFileSync(path.join(AGENTS_DIR, slug, 'services', 'handler.py'), 'utf-8')
    const nameMatch = content.match(/class\s+(\w+)/)
    return { slug, className: nameMatch ? nameMatch[1] : slug, label: slug.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) }
  })
  res.json(handlers)
})

// ── GET /api/agents/:slug/handler ──
app.get('/api/agents/:slug/handler', (req, res) => {
  const handlerPath = path.join(AGENTS_DIR, req.params.slug, 'services', 'handler.py')
  if (!fs.existsSync(handlerPath)) return res.json({ content: null })
  res.json({ content: fs.readFileSync(handlerPath, 'utf-8') })
})

// ── GET /api/agents/:slug/servers-config ──
app.get('/api/agents/:slug/servers-config', (req, res) => {
  const cfgPath = path.join(AGENTS_DIR, req.params.slug, 'agent_servers.json')
  if (!fs.existsSync(cfgPath)) return res.json({ content: null })
  res.json({ content: fs.readFileSync(cfgPath, 'utf-8') })
})

// ── GET /api/agents/:slug/logs ──
app.get('/api/agents/:slug/logs', (req, res) => {
  const logFile = path.join(LOGGER_DIR, `${req.params.slug}.json`)
  if (!fs.existsSync(logFile)) return res.json([])
  try {
    const data = JSON.parse(fs.readFileSync(logFile, 'utf-8'))
    res.json(data)
  } catch { res.json([]) }
})

// ── POST /api/agents/import  (zip upload) ──
// Validates the uploaded agent folder. If all required fields are present,
// auto-imports. Otherwise returns partial data so the UI can ask the user to
// fill in the gaps.
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 50 * 1024 * 1024 } })

function extractAgentZip(buffer) {
  const zip = new AdmZip(buffer)
  const entries = zip.getEntries()

  const paths = entries.map(e => e.entryName.replace(/\\/g, '/'))
  const topDirs = new Set(paths.map(p => p.split('/')[0]).filter(Boolean))
  let rootPrefix = ''
  if (topDirs.size === 1) {
    const candidate = [...topDirs][0]
    if (entries.some(e => e.entryName.replace(/\\/g, '/').startsWith(candidate + '/'))) {
      rootPrefix = candidate + '/'
    }
  }

  const agentJsonEntry = entries.find(e => {
    const rel = e.entryName.replace(/\\/g, '/').replace(rootPrefix, '')
    return rel === 'agent.json' && !e.isDirectory
  })

  return { zip, entries, rootPrefix, agentJsonEntry }
}

function validateAgentDef(agentDef) {
  const missing = []
  const a = agentDef.agent || {}
  if (!(a.name || '').trim()) missing.push('name')
  if (!(a.url || '').trim()) missing.push('url')
  if (!(a.version || '').trim()) missing.push('version')
  const isLocal = (agentDef.type || 'local') === 'local'
  if (isLocal && !(agentDef.slug || '').trim()) missing.push('slug')
  if (isLocal && !(a.handler?.class || '').trim()) missing.push('handlerClass')
  if (isLocal && !(a.handler?.args?.agent_executor || '').trim()) missing.push('agentExecutor')
  return missing
}

function finalizeImport(buffer, agentDef, slug) {
  const { entries, rootPrefix } = extractAgentZip(buffer)
  const registry = readRegistry()
  const newId = registry.agents.length > 0
    ? Math.max(...registry.agents.map(a => a.id)) + 1 : 1

  const entry = {
    id: newId,
    type: agentDef.type || 'local',
    role: agentDef.role || 'public',
    stage: agentDef.stage || 'Draft',
    slug,
    calls: agentDef.calls || [],
    mcpBindings: agentDef.mcpBindings || [],
    agent: agentDef.agent,
    enabled: agentDef.enabled !== undefined ? agentDef.enabled : true,
    tags: agentDef.tags || [],
  }

  const agentDir = path.join(AGENTS_DIR, slug)
  if (fs.existsSync(agentDir)) {
    fs.rmSync(agentDir, { recursive: true, force: true })
  }

  for (const zipEntry of entries) {
    const rel = zipEntry.entryName.replace(/\\/g, '/').replace(rootPrefix, '')
    if (!rel || rel === 'agent.json') continue
    const targetPath = path.join(agentDir, rel)
    if (zipEntry.isDirectory) {
      ensureDir(targetPath)
    } else {
      ensureDir(path.dirname(targetPath))
      fs.writeFileSync(targetPath, zipEntry.getData())
    }
  }

  ensureDir(path.join(agentDir, 'skills'))
  ensureDir(path.join(agentDir, 'references'))
  const manifestPath = path.join(agentDir, 'references', 'manifest.json')
  if (!fs.existsSync(manifestPath)) fs.writeFileSync(manifestPath, '[]\n')

  registry.agents.push(entry)
  writeRegistry(registry)

  return buildAgentRecord(entry)
}

app.post('/api/agents/import', upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' })

  try {
    const { agentJsonEntry } = extractAgentZip(req.file.buffer)

    if (!agentJsonEntry) {
      return res.status(400).json({ error: 'Zip must contain an agent.json file at the root level' })
    }

    let agentDef
    try {
      agentDef = JSON.parse(agentJsonEntry.getData().toString('utf-8'))
    } catch {
      return res.status(400).json({ error: 'agent.json is not valid JSON' })
    }

    if (!agentDef.agent) agentDef.agent = {}

    const slug = agentDef.slug
      || (agentDef.agent.name || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') + '-agent'
    agentDef.slug = slug

    const missingFields = validateAgentDef(agentDef)

    if (missingFields.length === 0) {
      const record = finalizeImport(req.file.buffer, agentDef, slug)
      return res.json({ status: 'complete', record })
    }

    return res.json({ status: 'incomplete', partial: agentDef, missingFields })
  } catch (err) {
    console.error('Import failed:', err)
    res.status(500).json({ error: 'Import failed: ' + err.message })
  }
})

// ── POST /api/agents/import-confirm  (finalize incomplete import) ──
app.post('/api/agents/import-confirm', upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' })

  let agentDef
  try {
    agentDef = JSON.parse(req.body.agentDef || '{}')
  } catch {
    return res.status(400).json({ error: 'Invalid agentDef JSON' })
  }

  try {
    const slug = agentDef.slug
      || (agentDef.agent?.name || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') + '-agent'
    const record = finalizeImport(req.file.buffer, agentDef, slug)
    res.json({ status: 'complete', record })
  } catch (err) {
    console.error('Import confirm failed:', err)
    res.status(500).json({ error: 'Import confirm failed: ' + err.message })
  }
})

// ── POST /api/test/execute — simulate a traced request through agent graph ──
app.post('/api/test/execute', (req, res) => {
  const { agentSlug, action, params, stubMode } = req.body
  if (!agentSlug) return res.status(400).json({ error: 'agentSlug required' })

  const registry = readRegistry()
  const mcpServers = readMcpServers()
  const stubServer = mcpServers.find(s => s.id === 'stub-mcp')
  const agentBySlug = {}
  registry.agents.forEach(a => {
    const slug = a.slug || a.agent.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
    agentBySlug[slug] = a
  })

  const rootAgent = agentBySlug[agentSlug]
  if (!rootAgent) return res.status(404).json({ error: `Agent "${agentSlug}" not found` })

  const traceId = 'trace-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6)
  const steps = []
  let stepSeq = 0
  let tsOffset = 0

  function addStep(type, from, to, detail, durationMs) {
    const startMs = tsOffset
    tsOffset += durationMs
    steps.push({
      seq: stepSeq++,
      type,
      from,
      to,
      detail,
      startMs,
      durationMs,
      endMs: tsOffset,
      status: 'ok'
    })
  }

  const selectedAction = action || (rootAgent.agent.tools && rootAgent.agent.tools[0] ? rootAgent.agent.tools[0].id || rootAgent.agent.tools[0].name : 'process')
  const requestParams = params || { query: 'sample request', timeRange: '1h' }

  addStep('request', 'Consumer', rootAgent.agent.name, { action: selectedAction, params: requestParams }, 5)

  const calls = rootAgent.calls || []
  calls.forEach(targetSlug => {
    const target = agentBySlug[targetSlug]
    if (!target) return
    const targetTool = target.agent.tools && target.agent.tools[0] ? (target.agent.tools[0].id || target.agent.tools[0].name) : 'process'
    addStep('agent-call', rootAgent.agent.name, target.agent.name, {
      action: targetTool,
      reason: `Delegating to ${target.agent.name} for ${targetTool}`
    }, 15 + Math.floor(Math.random() * 30))

    const subBindings = target.mcpBindings || []
    subBindings.slice(0, 2).forEach(b => {
      const sid = typeof b === 'string' ? b : b.serverId
      const srv = mcpServers.find(s => s.id === sid)
      if (!srv) return
      const tool = typeof b === 'object' && b.tools ? b.tools[0] : (Array.isArray(srv.tools) && srv.tools[0] ? (typeof srv.tools[0] === 'string' ? srv.tools[0] : srv.tools[0].name) : 'query')
      const actualSrv = (stubMode && stubServer) ? stubServer : srv
      const actualName = (stubMode && stubServer) ? `STUB MCP (${srv.name})` : srv.name
      addStep('mcp-call', target.agent.name, actualName, {
        tool,
        purpose: typeof b === 'object' ? b.purpose : `Using ${srv.name}`,
        serverId: stubMode ? 'stub-mcp' : sid,
        originalServerId: stubMode ? sid : undefined,
        stubMode: stubMode || false
      }, 20 + Math.floor(Math.random() * 60))
      addStep('mcp-response', actualName, target.agent.name, {
        tool,
        result: stubMode
          ? { status: 'success', records: Math.floor(Math.random() * 200) + 1, note: '*STUB RESULTS*', stub: true }
          : { status: 'success', records: Math.floor(Math.random() * 200) + 1 }
      }, 3)
    })

    addStep('agent-response', target.agent.name, rootAgent.agent.name, {
      action: targetTool,
      result: { status: 'success', summary: `${target.agent.name} completed ${targetTool}` }
    }, 5)
  })

  const rootBindings = rootAgent.mcpBindings || []
  rootBindings.slice(0, 3).forEach(b => {
    const sid = typeof b === 'string' ? b : b.serverId
    const srv = mcpServers.find(s => s.id === sid)
    if (!srv) return
    const tool = typeof b === 'object' && b.tools ? b.tools[0] : (Array.isArray(srv.tools) && srv.tools[0] ? (typeof srv.tools[0] === 'string' ? srv.tools[0] : srv.tools[0].name) : 'query')
    const actualSrv = (stubMode && stubServer) ? stubServer : srv
    const actualName = (stubMode && stubServer) ? `STUB MCP (${srv.name})` : srv.name
    addStep('mcp-call', rootAgent.agent.name, actualName, {
      tool,
      purpose: typeof b === 'object' ? b.purpose : `Using ${srv.name}`,
      serverId: stubMode ? 'stub-mcp' : sid,
      originalServerId: stubMode ? sid : undefined,
      stubMode: stubMode || false
    }, 25 + Math.floor(Math.random() * 80))
    addStep('mcp-response', actualName, rootAgent.agent.name, {
      tool,
      result: stubMode
        ? { status: 'success', records: Math.floor(Math.random() * 500) + 1, note: '*STUB RESULTS*', stub: true }
        : { status: 'success', records: Math.floor(Math.random() * 500) + 1 }
    }, 3)
  })

  addStep('response', rootAgent.agent.name, 'Consumer', {
    action: selectedAction,
    result: {
      status: 'success',
      summary: stubMode
        ? `*STUB RESULTS* — ${rootAgent.agent.name} processed "${selectedAction}" across ${calls.length} sub-agent(s) and ${rootBindings.length} MCP binding(s) [STUB MODE]`
        : `${rootAgent.agent.name} processed "${selectedAction}" across ${calls.length} sub-agent(s) and ${rootBindings.length} MCP binding(s)`,
      totalLatencyMs: tsOffset,
      stubMode: stubMode || false
    }
  }, 2)

  res.json({ traceId, agentSlug, agentName: rootAgent.agent.name, totalMs: tsOffset, stubMode: stubMode || false, steps })
})

const PORT = 3001
app.listen(PORT, '0.0.0.0', () => {
  console.log(`API server running on http://0.0.0.0:${PORT}`)
})
