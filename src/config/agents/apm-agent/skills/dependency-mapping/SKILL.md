---
name: dependency-mapping
description: Map runtime service dependencies from trace data and detect unhealthy dependency chains. Use when onboarding new services or investigating cascade failures.
metadata:
  author: "apm-team"
  version: "1.0"
---

# Dependency Mapping

## Discovery
Build service dependency graph from:
1. Distributed trace parent-child relationships
2. HTTP/gRPC call metadata
3. Database and message queue connections

## Health Indicators per Edge
- Call volume (requests/sec)
- Error rate (%)
- Latency (P50, P95)
- Circuit breaker state (open/closed/half-open)

## Cascade Detection
Flag when:
- A dependency's error rate > 5% AND downstream services show correlated errors
- Latency propagation: upstream P95 increases within 1 min of dependency degradation
