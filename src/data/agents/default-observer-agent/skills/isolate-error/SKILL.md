---
name: Isolate Error
description: "Chapter 2: Extract logs and stack traces to identify the smoking gun"
---

# Technical Isolation (Chapter 2)

## Purpose
Extract and analyze logs to find the root cause using MCP_OpenSearch.

## Steps
1. Use `get-logs-by-trace` with the Trace ID from Chapter 1
2. Filter for ERROR/FATAL entries using `get-error-logs`
3. Extract the stack trace with `get-stack-trace`
4. Classify the exception: NullPointer, Timeout, 5xx, ConnectionRefused, etc.
5. Identify the "Smoking Gun" — the single most relevant log entry

## Output
- Smoking Gun log entry (timestamp, service, message, stack trace)
- Exception classification
- Contextual log entries (N lines before/after the error)
