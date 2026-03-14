---
name: dashboard-investigation
description: Leverage Grafana dashboards and annotations to investigate incidents visually. Identify correlations between deployment events, metric anomalies, and alert triggers.
license: Apache-2.0
metadata:
  author: "msfn-obs-team"
  version: "1.0"
allowed-tools: Bash(curl:*) Read
---

# Dashboard-Driven Investigation

## Approach
1. List dashboards related to the affected service
2. Query panel data for the incident time range
3. Check annotations for deploy, config change, or scaling events
4. Overlay error rate, latency, and saturation on the same timeline

## Key Panels
- **Service Overview** — request rate, error rate, latency percentiles
- **Infrastructure** — node CPU, memory, disk I/O
- **Dependencies** — upstream/downstream call rates and error rates

## Correlation Rules
- If annotation (deploy) aligns within 15 min of anomaly start — likely deployment
- If no deploy but resource spike — investigate autoscaling or traffic surge
- If downstream error rate rises first — propagated failure
