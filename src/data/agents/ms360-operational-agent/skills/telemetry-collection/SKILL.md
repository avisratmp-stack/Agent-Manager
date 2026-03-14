---
name: telemetry-collection
description: Collect and interpret telemetry signals from ms360ai-observability stack — logs, metrics, and traces via leaf agents (ms360ai-logging, ms360ai-tracing, ms360ai-istio).
license: Apache-2.0
metadata:
  author: "ms360-team"
  version: "2.0"
allowed-tools: Bash(curl:*) Read
---

# Telemetry Collection

## Leaf Agents
- **ms360ai-logging** — structured log collection and indexing
- **ms360ai-tracing** — distributed trace capture via OpenTelemetry
- **ms360ai-istio** — service mesh telemetry from Istio sidecars

## Collection Flow
1. Poll each leaf agent for latest telemetry batch
2. Normalize data into unified schema (timestamp, service, level, payload)
3. Index into Elasticsearch for search
4. Push key metrics to Prometheus for alerting
5. Render summary on Grafana operational dashboards

## Quality Checks
- Verify all expected services report within 5-minute window
- Flag gaps in telemetry coverage (missing service, silent pod)
- Alert on ingestion lag > 2 minutes
