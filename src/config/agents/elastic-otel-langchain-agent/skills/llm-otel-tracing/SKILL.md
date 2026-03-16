---
name: llm-otel-tracing
description: Auto-capture OpenTelemetry traces from LangChain AI pipelines — LLM calls, vector DB operations, and framework internals — into Elastic APM via Langtrace.
metadata:
  author: elastic
  source: https://www.elastic.co/observability-labs/blog/elastic-opentelemetry-langchain-tracing-langtrace
---
# LLM OTel Tracing
## Instrumented Components
- LLM API calls (latency, tokens, model, prompt)
- Vector DB queries (search latency, result count)
- Chain/agent step execution (duration, input/output)
- Retrieval-augmented generation pipelines
## Stack
Langtrace SDK -> OpenTelemetry -> Elastic APM
