---
name: autonomous-rca
description: Autonomous root cause analysis using an agentic loop — form hypotheses, gather evidence, validate, and converge on the most likely root cause without human intervention.
license: Apache-2.0
metadata:
  author: "wizai-team"
  version: "3.0"
allowed-tools: Bash(curl:*) Read
---

# Autonomous Root Cause Analysis

## Agentic Loop
1. **Observe** — collect initial signals (alert, error spike, latency increase)
2. **Hypothesize** — generate ranked list of possible root causes
3. **Investigate** — for each hypothesis, gather supporting evidence
4. **Validate** — test hypothesis against evidence (confirm or reject)
5. **Converge** — select highest-confidence root cause
6. **Report** — produce structured RCA report with evidence chain

## Hypothesis Templates
- Deployment regression (recent deploy + error spike)
- Infrastructure failure (node/pod issues + service degradation)
- Dependency failure (downstream error rate increase)
- Configuration change (config update timestamp near incident)
- Traffic anomaly (request volume spike beyond capacity)

## Confidence Scoring
- Each piece of evidence adds/subtracts confidence points
- Threshold for high confidence: > 0.8
- If no hypothesis reaches 0.6, escalate to human
