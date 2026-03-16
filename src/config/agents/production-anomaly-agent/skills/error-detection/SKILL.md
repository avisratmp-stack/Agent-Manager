---
name: error-detection
description: Detect new and previously unseen error messages in production logs for TLG applications. Classify errors by severity and frequency, flagging novel patterns.
license: Apache-2.0
metadata:
  author: "peddi-t-team"
  version: "1.0"
  account: "ATT"
allowed-tools: Bash(curl:*) Read
---

# Production Error Detection

## Approach
1. Query Elasticsearch for ERROR/FATAL log entries in the last N minutes
2. Compare error message signatures against known-error database
3. Flag messages with no prior occurrence as "new anomaly"
4. Cluster similar new errors by message similarity (Levenshtein / TF-IDF)
5. Rank by frequency and affected service count

## TLG Application Coverage
- All TLG microservices reporting to centralized logging
- Application-specific error codes mapped to severity levels
- Known error database refreshed daily from resolved tickets

## Output
- List of new error signatures with first-seen timestamp
- Affected services and pod counts
- Suggested severity (Critical / Major / Minor)
