---
name: log-anomaly-detection
description: Detect anomalous patterns in log streams using statistical baselines and keyword spikes. Use when investigating unexpected behavior or proactive monitoring.
license: Apache-2.0
metadata:
  author: "obs-team"
  version: "2.1"
allowed-tools: Bash(grep:*) Bash(jq:*) Read
---

# Log Anomaly Detection

Analyze log streams to detect anomalies based on:

## Detection Methods
1. **Frequency spikes** — sudden increase in error/warning log rates
2. **New patterns** — log messages not seen in the baseline window
3. **Keyword correlation** — co-occurrence of error keywords across services

## Thresholds
- Error rate > 3x baseline over 5-minute window → alert
- New unique error pattern → flag for review
- Correlated errors across 3+ services within 2 min → critical

## Edge Cases
- Deployment windows: suppress for 10 min after known deploy
- Log volume drops: treat as potential logging pipeline failure
