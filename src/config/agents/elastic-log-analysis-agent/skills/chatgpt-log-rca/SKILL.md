---
name: chatgpt-log-rca
description: Use ChatGPT to perform automated root cause analysis over Elasticsearch log indices. Parse error patterns and produce human-readable RCA reports.
metadata:
  author: elastic
  source: https://github.com/elastic/chatgpt-log-analysis
---
# ChatGPT Log RCA
## Flow
1. Query ES for error/fatal entries in time window
2. Send log excerpts to ChatGPT for pattern interpretation
3. Generate structured RCA with root cause, impact, remediation
