---
name: Audit Message Flow
description: "Chapter 3: Check DLQ, consumer lag, and infra health at failure time"
---

# Message Flow & System Health (Chapter 3)

## Purpose
Audit Kafka message flow and check infrastructure health at failure time.

## Steps
1. Use `search-dlq` to check if the business entity message is in a Dead Letter Queue
2. Use `get-consumer-lag` to check if the consumer group was behind at the time of failure
3. Use MCP_APM `get-service-metrics` to check CPU, memory, and connection pools at that timestamp
4. Correlate: was the failure due to infra pressure or a logic error?

## Output
- DLQ status: message found / not found, topic, partition, offset
- Consumer lag at failure time
- Infrastructure metrics snapshot (CPU%, Memory%, active connections)
- Correlation verdict: infrastructure-related vs application-level failure
