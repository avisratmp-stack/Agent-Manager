---
name: evidence-collection
description: Systematically collect and rank evidence from logs, metrics, traces, and tickets to support root cause hypotheses. Build an evidence chain for audit trail.
license: Apache-2.0
metadata:
  author: "wizai-team"
  version: "3.0"
allowed-tools: Bash(curl:*) Read
---

# Evidence Collection

## Evidence Sources
- **Logs** — error messages, stack traces, timing information
- **Metrics** — error rates, latency percentiles, resource utilization
- **Traces** — slow spans, failed spans, dependency chains
- **Tickets** — recent changes, known issues, related incidents

## Collection Strategy
1. Start with the alert or reported symptom
2. Identify the primary service and time window
3. Pull logs for ERROR/FATAL entries in the window
4. Query metrics for anomalies vs baseline
5. Fetch distributed traces with errors
6. Search Jira for recent changes to the service

## Evidence Ranking
- Direct correlation (same timestamp, same service) — weight 1.0
- Indirect correlation (related service, +-5 min) — weight 0.5
- Circumstantial (same day, different service) — weight 0.2
- Contradictory evidence — negative weight
