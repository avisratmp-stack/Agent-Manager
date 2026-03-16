---
name: multi-agent-investigation
description: Orchestrate parallel investigations across Log, APM, and Incident agents, correlating findings into a unified root-cause timeline.
license: Apache-2.0
metadata:
  domain: "orchestration"
  complexity: "high"
allowed-tools: investigate
---

# Multi-Agent Investigation

Coordinate multiple observability agents to perform a holistic investigation when a production incident is detected.

## Workflow

1. Receive an incident trigger (alert, ticket, or manual request).
2. Fan out parallel queries to Log Agent, APM Agent, and PagerDuty Incident Agent.
3. Collect and normalize responses into a common event schema.
4. Correlate events by timestamp, service, and trace ID.
5. Produce a ranked list of probable root causes with supporting evidence.

## Coordination Rules

- Respect each downstream agent's rate limits and timeout settings.
- If a downstream agent is unreachable, mark its data as "unavailable" and proceed with partial results.
- Merge duplicate events that appear across multiple agent responses.
- Prioritize findings that appear in more than one agent's output.

## Output Format

Return a structured timeline with:
- Timestamp range of the incident
- Ordered list of correlated events
- Confidence score per root-cause hypothesis
- Links to raw data from each contributing agent
