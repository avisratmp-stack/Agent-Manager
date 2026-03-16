---
name: log-correlation
description: Correlate log events across multiple services using trace IDs and time windows. Use when investigating cross-service incidents.
metadata:
  author: "obs-team"
  version: "1.0"
---

# Log Correlation

## Correlation Keys
1. **Trace ID** — primary correlation across distributed services
2. **Request ID** — secondary, within a single service boundary
3. **Time window** — ±5 second window when no trace ID available

## Process
1. Extract correlation keys from incoming log event
2. Query related logs from all indexed services
3. Build a timeline sorted by timestamp
4. Highlight errors and latency outliers

## Limitations
- Time-window correlation may produce false positives in high-throughput systems
- Services without trace propagation require manual key mapping
