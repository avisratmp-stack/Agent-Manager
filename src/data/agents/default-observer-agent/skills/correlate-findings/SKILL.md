---
name: Correlate Findings
description: Cross-correlate data from all 4 chapters and produce a unified incident report
---

# Correlate Findings

## Purpose
Cross-correlate data from all 4 investigation chapters into a unified incident report.

## Steps
1. Summarize findings from each chapter
2. Check consistency: Does the trace error (Ch1) match the log error (Ch2)?
3. Check message state: Is the DLQ message (Ch3) consistent with the DB state (Ch4)?
4. Identify gaps: Any chapter with missing data? Flag it explicitly.
5. Produce a final correlation table and actionable recommendation.

## Output Format
| Chapter | Source | Finding | Consistent? |
|---------|--------|---------|-------------|
| 1 - Trace | MCP_APM | Broken span in service X | — |
| 2 - Logs | MCP_OpenSearch | TimeoutException in service X | Yes |
| 3 - Kafka | MCP_Kafka | Message in DLQ topic Y | Yes |
| 4 - DB | MCP_Digital_Mass | Entity status: FAILED | Yes |

**Final Recommendation:** [actionable next step]
