---
name: root-cause-determination
description: Determine root cause from gathered evidence by testing hypotheses against log patterns, metric anomalies, and configuration changes.
license: Apache-2.0
metadata:
  author: "oms-t1-team"
  version: "1.0"
  account: "ATT"
allowed-tools: Bash(curl:*) Read
---

# Root Cause Determination

## Methodology
1. Generate candidate root causes from evidence
2. For each candidate, identify confirming and contradicting evidence
3. Score candidates by evidence strength
4. Select highest-scoring root cause
5. Document the evidence chain for audit

## Common LS-OMS Root Causes
- Order processing timeout due to downstream dependency
- Data validation failure from schema changes
- Queue backlog causing processing delays
- Configuration mismatch after deployment
- Database connection pool exhaustion

## Deliverable
- Root cause statement with confidence level
- Evidence chain (logs, metrics, timeline)
- Remediation recommendation
- Jira comment with findings summary
