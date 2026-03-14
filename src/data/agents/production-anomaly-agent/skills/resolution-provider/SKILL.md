---
name: resolution-provider
description: Provide resolution recommendations for detected production anomalies based on historical resolution patterns, runbooks, and similar past incidents.
license: Apache-2.0
metadata:
  author: "peddi-t-team"
  version: "1.0"
  account: "ATT"
allowed-tools: Bash(curl:*) Read
---

# Resolution Provider

## Resolution Sources
- **Historical Resolutions** — past tickets with same/similar error resolved
- **Runbooks** — standard operating procedures per error class
- **Config Changes** — recent deployments or config updates that may relate

## Resolution Flow
1. Match detected anomaly against known resolution database
2. If direct match — return resolution steps with confidence
3. If partial match — return top-3 candidate resolutions ranked by similarity
4. If no match — generate hypothesis based on error category and suggest investigation steps
5. Attach relevant runbook links and past ticket references

## Confidence Levels
- **High** (>0.8) — exact error signature seen and resolved before
- **Medium** (0.5-0.8) — similar error class resolved before
- **Low** (<0.5) — novel error, hypothesis-based suggestion
