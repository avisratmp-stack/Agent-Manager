---
name: log-enrichment
description: Enrich raw application logs with contextual attributes — correlation IDs, error classification, service metadata, and deployment version tags for faster RCA.
license: Apache-2.0
metadata:
  author: "logging-team"
  version: "1.0"
allowed-tools: Bash(curl:*) Read
---

# Log Enrichment

## Attributes Added
- **correlationId** — trace/request ID for cross-service correlation
- **errorClass** — categorized error type (Timeout, Auth, Validation, System)
- **deployVersion** — git SHA or release tag of the running service
- **environment** — prod, staging, dev
- **k8sContext** — pod name, namespace, node

## Enrichment Pipeline
1. Consume raw log events from Kafka topic
2. Parse log structure (JSON, logfmt, or regex patterns)
3. Extract and attach correlation ID from headers or MDC
4. Classify error based on message patterns and HTTP status
5. Tag with deployment metadata from K8s labels
6. Produce enriched event to output Kafka topic

## Error Classification Rules
- 4xx + "token" or "auth" — Auth error
- 4xx + "validation" — Validation error
- 5xx + "timeout" or "connect" — Timeout error
- 5xx + all others — System error
