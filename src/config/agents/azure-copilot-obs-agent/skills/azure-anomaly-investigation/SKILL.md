---
name: azure-anomaly-investigation
description: Detect and correlate anomalies across Azure App Services, VMs, and AKS using metrics, logs, and observability signals. Generate actionable findings with Microsoft Copilot AI.
metadata:
  author: microsoft
  source: https://learn.microsoft.com/en-us/azure/copilot/observability-agent
---
# Azure Anomaly Investigation
## Coverage
- App Services: HTTP errors, response time, CPU/memory
- VMs: disk I/O, network throughput, process health
- AKS: pod restarts, node pressure, container OOMKill
## Flow
1. Collect signals from Azure Monitor
2. Correlate anomalies across resource types
3. Generate findings with root cause and remediation
