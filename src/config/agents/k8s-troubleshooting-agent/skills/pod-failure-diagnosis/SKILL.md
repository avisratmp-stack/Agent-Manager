---
name: pod-failure-diagnosis
description: Diagnose Kubernetes pod failures by inspecting pod status, container logs, events, and resource limits. Identifies CrashLoopBackOff, OOMKilled, ImagePullBackOff, and scheduling failures.
license: Apache-2.0
metadata:
  author: "msfn-k8s-team"
  version: "1.0"
allowed-tools: Bash(kubectl:*) Read
---

# Pod Failure Diagnosis

## Common Failure States
- **CrashLoopBackOff** — application crashes on startup, check container logs
- **OOMKilled** — memory limit exceeded, review resource requests/limits
- **ImagePullBackOff** — image not found or registry auth failure
- **Pending** — insufficient resources or node affinity mismatch

## Diagnosis Steps
1. Get pod status and conditions via kubectl describe pod
2. Check container exit codes (137 = OOMKilled, 1 = app error)
3. Pull recent container logs from ECK Elasticsearch
4. List cluster events for the namespace in the last 30 minutes
5. Check node resource pressure (CPU, memory, disk)

## Remediation Hints
- OOMKilled — increase memory limit or fix memory leak
- CrashLoopBackOff — check app logs, config maps, secrets
- Pending — scale node pool or relax affinity rules
