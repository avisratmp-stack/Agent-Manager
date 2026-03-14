---
name: incident-summarization
description: Generate concise, executive-ready incident summaries from multi-agent investigation outputs.
license: Apache-2.0
metadata:
  domain: "reporting"
  audience: "engineering-leads"
allowed-tools: summarize
---

# Incident Summarization

Transform raw multi-agent investigation data into a clear, actionable incident summary suitable for stakeholders at all levels.

## Summary Structure

1. **Impact Statement** — one sentence describing what was affected and for how long.
2. **Root Cause** — the most probable cause with confidence level.
3. **Timeline** — key events in chronological order (max 10 entries).
4. **Affected Services** — list of impacted services and their severity.
5. **Resolution** — steps taken or recommended to resolve the incident.
6. **Follow-up Actions** — preventive measures and open items.

## Tone Guidelines

- Use plain language; avoid internal jargon.
- Lead with impact, not technical details.
- Keep the full summary under 500 words.
- Flag any data gaps where an agent was unreachable.
