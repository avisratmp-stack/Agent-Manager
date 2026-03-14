---
name: issue-analysis
description: Analyze reported issues in LS-OMS by gathering and correlating evidence from logs, metrics, and ticket history to build a complete picture of the problem.
license: Apache-2.0
metadata:
  author: "oms-t1-team"
  version: "1.0"
  account: "ATT"
allowed-tools: Bash(curl:*) Read
---

# Issue Analysis

## Data Sources
- **Application Logs** — LS-OMS service logs from Elasticsearch
- **Metrics** — error rates, latency, throughput from Prometheus
- **Tickets** — related Jira issues and past incident reports

## Analysis Steps
1. Parse the reported issue description for key identifiers (order ID, service name, error code)
2. Query logs for matching entries in the incident time window
3. Pull metrics for affected services — compare to baseline
4. Search Jira for similar past issues and their resolutions
5. Build timeline of events leading to the issue

## Output
- Issue timeline with correlated evidence
- Probable cause assessment with supporting data
- Recommended next steps for investigation or resolution
