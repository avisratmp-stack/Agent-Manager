---
name: metric-rca
description: Perform root cause analysis using Prometheus metrics. Query error rates, latency percentiles, and saturation to identify the source of production incidents.
license: Apache-2.0
metadata:
  author: "msfn-obs-team"
  version: "1.0"
allowed-tools: Bash(curl:*) Read
---

# Metric-Based Root Cause Analysis

## Signals
- **Error Rate** — 5xx responses per service and endpoint
- **Latency** — P50/P95/P99 per service, compare to 7-day baseline
- **Saturation** — CPU, memory, and thread pool utilization

## Analysis Flow
1. Query Prometheus for error rate spike in the target time window
2. Identify affected services by grouping on service label
3. For each affected service, check latency percentiles
4. Correlate with saturation metrics (CPU > 80%, memory > 90%)
5. Cross-reference with Grafana annotations for deploy events

## Common Root Causes
- Recent deployment causing error spike
- Downstream dependency degradation
- Resource exhaustion (OOM, thread starvation)
- Configuration drift after rollout
