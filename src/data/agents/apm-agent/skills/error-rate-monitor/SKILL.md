---
name: error-rate-monitor
description: Monitor application error rates and classify error types. Use when error budgets are at risk or after deployments.
metadata:
  author: "apm-team"
  version: "1.2"
---

# Error Rate Monitoring

## Error Classification
- **5xx** — server errors, immediate attention
- **4xx** — client errors, monitor trends only
- **Timeout** — requests exceeding SLA threshold
- **Exception** — uncaught application exceptions

## Alert Rules
| Condition | Severity |
|-----------|----------|
| 5xx rate > 1% of traffic for 5 min | Critical |
| 5xx rate > 0.5% for 15 min | Warning |
| New exception type after deploy | Info |
| Error budget consumed > 80% | Warning |

## Post-Deploy Monitoring
After each deployment, monitor error rates for 30 minutes with 2x sensitivity.
