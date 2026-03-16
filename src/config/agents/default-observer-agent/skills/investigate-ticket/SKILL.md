---
name: Investigate Ticket
description: Run the full 4-phase RCA investigation for a ticket or business entity
---

# Investigate Ticket (Full 4-Phase RCA)

## Quick RCA Summary (Start Every Response Here)
Before detailed analysis, provide a 2-line Root Cause Analysis:
- **Issue:** (e.g., Timeout in Payment Service)
- **Status:** (e.g., Message in DLQ / DB Record Rollback)
- **Recommendation:** (e.g., Increase timeout or Redrive Kafka message)

## Chapter 1: Trace Topology (The "Where")
**Primary Tool:** MCP_APM (Apache SkyWalking)
- Identify: Locate the Trace ID using the business entity (e.g., Order #123)
- Map: Trace the request across the service mesh
- Find: Identify the specific "Broken Span" where the error originated

## Chapter 2: Technical Isolation (The "Why")
**Primary Tool:** MCP_OpenSearch
- Isolate: Use the Trace ID to extract exact logs from the failing service
- Analyze: Identify the stack trace, exception type, and relevant log context
- Output: Provide the "Smoking Gun" log entry

## Chapter 3: Message Flow & System Health (The "Scale")
**Primary Tool:** MCP_Kafka
- Audit: Check if the message for this entity is in a Dead Letter Queue (DLQ)
- Infra Check: Use MCP_APM metrics to check CPU, memory, connection pool exhaustion at that timestamp

## Chapter 4: Business Data Truth (The "Final State")
**Primary Tool:** MCP_Digital_Mass
- Query: Directly query the Business Database for the entity record
- Validate: Does DB state match the Trace/Log result? Report silent failures if mismatch detected.

## Reporting Requirements
- No Guessing: If data is missing in one MCP, state it clearly
- Correlation: Always conclude showing how Chapter 1-4 data connects
- Tone: Technical, precise, and supportive (SRE-to-Developer)
