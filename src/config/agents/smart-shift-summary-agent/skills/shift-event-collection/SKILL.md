---
name: shift-event-collection
description: Gather all incidents, alerts, chats, calls, and key events from an entire shift window for AMOC operations. Ensures nothing is missed for handover.
license: Apache-2.0
metadata:
  author: "victor-orantes-team"
  version: "1.0"
  account: "ATT"
allowed-tools: Bash(curl:*) Read
---

# Shift Event Collection

## Event Sources
- **PagerDuty** — incidents, alerts, escalations during the shift
- **Jira** — tickets created, updated, or resolved during the shift
- **Elasticsearch** — operational logs and chat/call records
- **Grafana** — dashboard snapshots showing shift-period metrics

## Collection Flow
1. Define shift window (start time, end time, team/region)
2. Query PagerDuty for all incidents and alerts in window
3. Query Jira for tickets touched during the shift
4. Search Elasticsearch for operational events and communications
5. Pull key metric snapshots from Grafana dashboards
6. Deduplicate and merge events into unified timeline

## Quality Checks
- Verify all expected data sources responded
- Flag any source with zero events (potential gap)
- Cross-reference incident counts with alert counts
