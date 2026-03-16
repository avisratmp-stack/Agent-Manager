---
name: cluster-event-analysis
description: Analyze Kubernetes cluster events to identify systemic issues — node failures, scaling events, network policies, and resource quota exhaustion.
license: Apache-2.0
metadata:
  author: "msfn-k8s-team"
  version: "1.0"
allowed-tools: Bash(kubectl:*) Read
---

# Cluster Event Analysis

## Event Categories
- **Normal** — successful scheduling, scaling, pull
- **Warning** — failed scheduling, back-off, unhealthy
- **Error** — node not ready, volume mount failure

## Analysis Flow
1. List events across all namespaces, sorted by last timestamp
2. Filter for Warning and Error events
3. Group by involved object (pod, node, deployment)
4. Identify patterns — repeated failures on same node suggest node issue
5. Cross-reference with node conditions (MemoryPressure, DiskPressure)

## Escalation Triggers
- Node NotReady for > 5 minutes
- > 10 pod scheduling failures in 15 minutes
- PersistentVolume mount failures
