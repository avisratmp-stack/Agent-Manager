---
name: summary-generation
description: Generate clean, accurate, ready-to-send end-of-shift summary from collected events. Highlights critical issues and provides consistent handover format.
license: Apache-2.0
metadata:
  author: "victor-orantes-team"
  version: "1.0"
  account: "ATT"
allowed-tools: Bash(curl:*) Read
---

# Shift Summary Generation

## Summary Structure
1. **Shift Overview** — date, team, shift window, total event count
2. **Critical Issues** — unresolved P1/P2 incidents requiring attention
3. **Resolved Items** — incidents and tickets closed during shift
4. **Ongoing Work** — in-progress items carried over to next shift
5. **Key Metrics** — error rates, SLA compliance, response times
6. **Action Items** — specific follow-ups for the incoming team

## Formatting Rules
- Professional, concise language
- Bullet points, no paragraphs
- Severity-ordered (critical first)
- Timestamps in local timezone
- Include ticket/incident IDs for reference

## Delivery
- Generate summary in markdown format
- Ready for email or chat distribution
- Include "nothing missed" confidence indicator
