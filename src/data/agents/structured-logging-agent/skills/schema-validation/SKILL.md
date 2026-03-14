---
name: schema-validation
description: Validate application log entries against a structured logging schema. Detect missing fields, type mismatches, and non-compliant formats before indexing.
license: Apache-2.0
metadata:
  author: "logging-team"
  version: "1.0"
allowed-tools: Bash(curl:*) Read
---

# Schema Validation

## Required Fields
- timestamp (ISO 8601)
- level (TRACE, DEBUG, INFO, WARN, ERROR, FATAL)
- service (string, non-empty)
- message (string, non-empty)
- correlationId (string, UUID format preferred)

## Optional Fields
- errorClass, stackTrace, httpStatus, duration, userId

## Validation Flow
1. Parse incoming log event
2. Check all required fields are present and non-null
3. Validate field types (timestamp is valid ISO, level is in enum)
4. Flag events missing correlationId as "partially compliant"
5. Reject events missing timestamp or service (cannot be indexed)
6. Report compliance rate per service per hour

## Compliance Targets
- 100% of services emit timestamp + level + service + message
- > 95% include correlationId
- > 80% include errorClass on ERROR/FATAL entries
