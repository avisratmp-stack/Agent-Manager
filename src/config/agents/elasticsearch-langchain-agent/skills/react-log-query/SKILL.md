---
name: react-log-query
description: LangChain ReAct agent iteratively queries Elasticsearch, reasons over results, and converges on root cause through multi-step investigation.
metadata:
  author: onepointconsulting
  source: https://github.com/onepointconsulting/elasticsearch-agent
---
# ReAct Log Query
## Pattern
1. Observe — receive user question about logs
2. Think — formulate ES query strategy
3. Act — execute query against Elasticsearch
4. Observe — analyze results, decide next step
5. Repeat until root cause identified
