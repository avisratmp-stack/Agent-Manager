---
name: log-parsing-rules
description: Parse structured and unstructured log formats into normalized fields. Use when ingesting logs from new sources or troubleshooting parse failures.
metadata:
  author: "obs-team"
  version: "1.3"
---

# Log Parsing Rules

## Supported Formats
- **JSON** — auto-extract all top-level fields
- **Apache/Nginx access logs** — regex-based field extraction
- **Syslog (RFC 5424)** — timestamp, facility, severity, message
- **Custom delimited** — configurable delimiter and field mapping

## Normalization
All parsed logs map to a common schema:
- `timestamp` (ISO 8601)
- `level` (DEBUG, INFO, WARN, ERROR, FATAL)
- `service` (source service name)
- `message` (human-readable text)
- `metadata` (key-value pairs)

## Fallback
Unparseable lines are stored raw with `level: UNKNOWN` and flagged for manual review.
