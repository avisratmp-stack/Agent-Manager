---
name: latency-analysis
description: Analyze service latency distributions, identify P50/P95/P99 outliers, and pinpoint slow spans in distributed traces. Use when investigating performance degradation.
license: Apache-2.0
metadata:
  author: "apm-team"
  version: "1.5"
allowed-tools: Bash(curl:*) Read
---

# Latency Analysis

## Metrics
- **P50** (median) — typical user experience
- **P95** — tail latency, impacts 1 in 20 requests
- **P99** — extreme outliers, often reveals infrastructure issues

## Analysis Steps
1. Query latency percentiles for target service + time range
2. Compare against baseline (7-day rolling average)
3. If P95 > 2x baseline, drill into trace spans
4. Identify the slowest span and its service dependency

## Root Cause Categories
- Database slow queries (> 500ms)
- External API timeouts
- GC pauses (JVM services)
- Network latency between AZs
- Thread pool exhaustion
