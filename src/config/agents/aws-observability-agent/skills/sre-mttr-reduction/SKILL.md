---
name: sre-mttr-reduction
description: SRE observability agent reducing MTTR by correlating OpenSearch Serverless logs, Prometheus metrics, and distributed traces through Bedrock AgentCore.
metadata:
  author: aws-samples
  source: https://github.com/aws-samples/sample-observability-agent-bedrock-agentcore
---
# SRE MTTR Reduction
## Correlation Strategy
1. Detect alert from Prometheus
2. Query OpenSearch Serverless for related logs
3. Pull distributed traces for affected requests
4. Correlate across all three signals
5. Produce ranked root cause hypotheses
