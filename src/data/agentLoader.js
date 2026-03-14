import agentsRegistry from './common/agents.json'

import logAnomaly from './agents/log-agent/skills/log-anomaly-detection/SKILL.md?raw'
import logParsing from './agents/log-agent/skills/log-parsing-rules/SKILL.md?raw'
import logCorrelation from './agents/log-agent/skills/log-correlation/SKILL.md?raw'
import logKnowledge from './agents/log-agent/knowledge/manifest.json'

import apmLatency from './agents/apm-agent/skills/latency-analysis/SKILL.md?raw'
import apmErrorRate from './agents/apm-agent/skills/error-rate-monitor/SKILL.md?raw'
import apmDependency from './agents/apm-agent/skills/dependency-mapping/SKILL.md?raw'
import apmKnowledge from './agents/apm-agent/knowledge/manifest.json'

import ensInvestigation from './agents/ensemble-agent/skills/multi-agent-investigation/SKILL.md?raw'
import ensSummarization from './agents/ensemble-agent/skills/incident-summarization/SKILL.md?raw'
import ensKnowledge from './agents/ensemble-agent/knowledge/manifest.json'

import dcOrderHealth from './agents/digital-commerce-agent/skills/order-pipeline-health/SKILL.md?raw'
import dcPaymentTrace from './agents/digital-commerce-agent/skills/payment-flow-tracing/SKILL.md?raw'
import dcKnowledge from './agents/digital-commerce-agent/knowledge/manifest.json'

function parseSkillMd(content) {
  const result = { name: '', description: '', license: null, compatibility: null, metadata: [], allowedTools: null }
  const fmMatch = content.match(/^---\s*\n([\s\S]*?)\n---\s*\n?([\s\S]*)$/)
  if (!fmMatch) return { ...result, body: content }
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

function buildSkill(rawContent, id) {
  const parsed = parseSkillMd(rawContent)
  return {
    id,
    name: parsed.name,
    description: parsed.description,
    status: 'active',
    lastModified: new Date().toISOString(),
    license: parsed.license,
    compatibility: parsed.compatibility,
    metadata: parsed.metadata,
    allowedTools: parsed.allowedTools,
    content: rawContent
  }
}

const skillFiles = {
  'log-agent': [
    { raw: logAnomaly, id: 'sk-log-1' },
    { raw: logParsing, id: 'sk-log-2' },
    { raw: logCorrelation, id: 'sk-log-3' },
  ],
  'apm-agent': [
    { raw: apmLatency, id: 'sk-apm-1' },
    { raw: apmErrorRate, id: 'sk-apm-2' },
    { raw: apmDependency, id: 'sk-apm-3' },
  ],
  'ensemble-agent': [
    { raw: ensInvestigation, id: 'sk-ens-1' },
    { raw: ensSummarization, id: 'sk-ens-2' },
  ],
  'digital-commerce-agent': [
    { raw: dcOrderHealth, id: 'sk-dc-1' },
    { raw: dcPaymentTrace, id: 'sk-dc-2' },
  ],
}

const knowledgeFiles = {
  'log-agent': logKnowledge,
  'apm-agent': apmKnowledge,
  'ensemble-agent': ensKnowledge,
  'digital-commerce-agent': dcKnowledge,
}

export function loadConsumers() {
  return agentsRegistry.consumers || []
}

export function loadAgents() {
  return agentsRegistry.agents.map(entry => {
    const record = {
      id: entry.id,
      type: entry.type,
      slug: entry.slug,
      calls: entry.calls || [],
      agent: entry.agent,
      managedSkills: [],
      knowledge: [],
    }

    if (entry.type === 'local' && entry.slug) {
      const skills = skillFiles[entry.slug]
      if (skills) {
        record.managedSkills = skills.map(s => buildSkill(s.raw, s.id))
      }
      const kb = knowledgeFiles[entry.slug]
      if (kb) {
        record.knowledge = kb
      }
    }

    return record
  })
}
