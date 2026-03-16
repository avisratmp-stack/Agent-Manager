---
name: gap-analysis
description: Scan application topology to identify interaction points NOT covered by observability. Detect services, endpoints, and integrations missing metrics, logs, or traces.
license: Apache-2.0
metadata:
  author: "observability-gaps-team"
  version: "1.0"
allowed-tools: Bash(curl:*) Read
---

# Gap Analysis

## Scan Targets
- Service-to-service communication paths
- External API integrations
- Database connections and query patterns
- Message queue producers and consumers
- Batch jobs and scheduled tasks

## Detection Method
1. Query service registry or K8s for all deployed services
2. For each service, check if metrics exist in Prometheus
3. Check if logs are indexed in Elasticsearch
4. Check if traces are captured in Jaeger
5. Compare against expected interaction map from architecture docs
6. Flag any service or path with < 2 of 3 signals as "gap"

## Gap Categories
- **Blind** — no metrics, no logs, no traces (critical gap)
- **Partial** — has logs but no metrics or traces
- **Shallow** — has metrics but no structured logs or traces
