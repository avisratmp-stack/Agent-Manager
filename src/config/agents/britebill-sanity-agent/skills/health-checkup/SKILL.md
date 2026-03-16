---
name: health-checkup
description: Run automated sanity and health checks across BriteBill and FBF production services. Verify service availability, response times, and data consistency.
license: Apache-2.0
metadata:
  author: "viji-ramalingam-team"
  version: "1.0"
  account: "ATT"
allowed-tools: Bash(curl:*) Read
---

# BriteBill Health Checkup

## Check Categories
1. **Service Availability** — HTTP health endpoints for all BriteBill services
2. **Response Times** — API latency within SLA thresholds
3. **Data Consistency** — billing record counts match expected ranges
4. **Queue Health** — message queue depths and consumer lag
5. **Dependency Status** — database, cache, and external service connectivity

## Check Flow
1. Run all health checks in parallel
2. Collect pass/fail/warn status per check
3. For failed checks, gather diagnostic info (logs, metrics)
4. Generate health report with overall status
5. Alert operations team if any critical check fails

## Thresholds
- Response time > 2s — Warning
- Response time > 5s — Critical
- Queue depth > 10,000 — Warning
- Service unreachable — Critical
