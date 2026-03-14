---
name: automated-remediation
description: Take automated actions on detected production alerts — restart services, clear queues, scale resources, or escalate to human operators based on alert type.
license: Apache-2.0
metadata:
  author: "pradip-team"
  version: "1.0"
  account: "ATT"
allowed-tools: Bash(curl:*) Read
---

# Automated Remediation

## Action Matrix
| Alert Type        | Action                    | Requires Approval |
|-------------------|---------------------------|-------------------|
| Service Down      | Restart pod/service       | No (auto)         |
| High Error Rate   | Scale up + alert team     | No (auto)         |
| Disk Full         | Archive old logs          | No (auto)         |
| DB Connection     | Reset connection pool     | Yes (human)       |
| Security Alert    | Isolate + escalate        | Yes (human)       |

## Remediation Flow
1. Match alert to action matrix
2. If auto-action — execute and log
3. If requires approval — notify operator and wait
4. Verify action resolved the alert (re-check metrics)
5. If not resolved — escalate to next level

## Safety Guards
- Never auto-remediate security alerts
- Max 3 auto-restarts per service per hour
- All actions logged with before/after metrics
