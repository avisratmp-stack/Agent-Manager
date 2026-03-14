---
name: leaf-agent-orchestration
description: Orchestrate leaf agents (logging, tracing, istio) in a hierarchical pattern. Coordinate parallel data collection and aggregate results for operational reporting.
license: Apache-2.0
metadata:
  author: "ms360-team"
  version: "2.0"
allowed-tools: Bash(curl:*) Read
---

# Leaf Agent Orchestration

## Architecture
- Parent agent (this) coordinates N leaf agents
- Each leaf is specialized for one telemetry domain
- Leaf agents run in parallel, parent aggregates results

## Orchestration Steps
1. Dispatch collection requests to all leaf agents in parallel
2. Wait for responses with 30-second timeout per leaf
3. If leaf fails, retry once then mark as degraded
4. Merge successful results into unified operational view
5. Publish aggregated status to Grafana and alert channels

## Health Monitoring
- Track leaf agent response times and success rates
- Auto-disable leaf if failure rate > 50% over 10 minutes
- Report degraded coverage to operations team
