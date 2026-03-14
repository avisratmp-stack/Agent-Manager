---
name: Trace Topology
description: "Chapter 1: Locate and map the distributed trace for a business entity"
---

# Trace Topology (Chapter 1)

## Purpose
Locate and map the distributed trace for a business entity using MCP_APM (SkyWalking).

## Steps
1. Use `search-traces` with the business entity ID (order ID, subscription ID, etc.)
2. Retrieve the full trace with `get-trace` using the discovered Trace ID
3. Map the service-to-service call chain via `get-topology`
4. Identify the "Broken Span" — the specific span with error tags or timeout
5. Extract span detail with `get-span-detail` for the failing span

## Output
- Trace ID
- Service call chain (A → B → C)
- Broken span: service name, operation, duration, error tag
- Timestamp of failure
