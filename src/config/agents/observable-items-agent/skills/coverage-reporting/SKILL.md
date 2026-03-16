---
name: coverage-reporting
description: Generate observability coverage reports showing which services and interaction points are fully monitored, partially monitored, or unmonitored. Produce recommendations for closing gaps.
license: Apache-2.0
metadata:
  author: "observability-gaps-team"
  version: "1.0"
allowed-tools: Bash(curl:*) Read
---

# Coverage Reporting

## Report Sections
1. **Executive Summary** — overall coverage percentage, trend vs last scan
2. **Service Coverage Matrix** — per-service breakdown of metrics/logs/traces
3. **Gap Inventory** — list of unmonitored or under-monitored items
4. **Recommendations** — prioritized actions to close gaps
5. **Risk Assessment** — impact of current gaps on incident detection

## Coverage Calculation
- Full coverage: metrics + structured logs + distributed traces
- Partial coverage: at least 2 of 3 signals present
- No coverage: 0 or 1 signal

## Recommendation Priority
- Critical services with no coverage — P1
- Critical services with partial coverage — P2
- Non-critical services with no coverage — P3
- Non-critical services with partial coverage — P4
