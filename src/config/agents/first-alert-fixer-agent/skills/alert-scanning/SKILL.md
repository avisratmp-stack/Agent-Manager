---
name: alert-scanning
description: Scan Microsoft Outlook inbox for production alert emails matching known patterns. Classify alerts by severity and target system (T1/T2).
license: Apache-2.0
metadata:
  author: "pradip-team"
  version: "1.0"
  account: "ATT"
allowed-tools: Bash(curl:*) Read
---

# Alert Scanning

## Scan Strategy
1. Connect to Outlook via MCP and search inbox for alert emails
2. Filter by sender patterns (monitoring systems, PagerDuty notifications)
3. Parse email subject and body for alert identifiers
4. Classify alert: Critical / Warning / Info
5. Map alert to target system (T1 or T2 environment)

## Alert Patterns
- Subject contains "CRITICAL" or "P1" — Critical
- Subject contains "WARNING" or "P2" — Warning
- Subject contains "INFO" or "P3/P4" — Info
- Body contains environment tags (PROD, NON-PROD)

## Output
- Classified alert queue with priority ordering
- Deduplicated alerts (same root cause grouped)
- Enrichment with Prometheus metric context
