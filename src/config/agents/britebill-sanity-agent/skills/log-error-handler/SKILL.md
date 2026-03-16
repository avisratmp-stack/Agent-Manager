---
name: log-error-handler
description: Monitor BriteBill and FBF application logs for errors. Automatically classify, deduplicate, and handle recurring error patterns with known remediations.
license: Apache-2.0
metadata:
  author: "viji-ramalingam-team"
  version: "1.0"
  account: "ATT"
allowed-tools: Bash(curl:*) Read
---

# Log Error Handler

## Error Processing Pipeline
1. Stream BriteBill and FBF logs from Elasticsearch
2. Filter for ERROR and FATAL level entries
3. Extract error signature (class, message pattern, stack trace hash)
4. Check against known-error database for remediation
5. If known — execute auto-remediation
6. If unknown — create alert and escalate

## Known Error Categories
- **Billing Calculation** — rounding errors, tax calculation failures
- **Template Rendering** — PDF generation failures, missing templates
- **Data Import** — file format errors, validation failures
- **Integration** — upstream API timeouts, authentication failures

## Auto-Remediation Actions
- Retry failed billing calculations with corrected inputs
- Regenerate PDFs with fallback template
- Queue failed imports for retry with validation fix
- Refresh authentication tokens for integration errors
