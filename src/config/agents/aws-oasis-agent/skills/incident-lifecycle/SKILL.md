---
name: incident-lifecycle
description: Full incident lifecycle management using Amazon Bedrock Strands agent. From anomaly detection through OpenSearch to human-in-the-loop resolution approval.
metadata:
  author: aws-samples
  source: https://github.com/aws-samples/sample-operational-ai-agent
---
# Incident Lifecycle
## Stages
1. Detection — anomaly flagged in OpenSearch logs/metrics
2. Investigation — Strands agent gathers evidence
3. Hypothesis — AI proposes root cause and remediation
4. Approval — human-in-the-loop confirms action
5. Resolution — approved action executed automatically
