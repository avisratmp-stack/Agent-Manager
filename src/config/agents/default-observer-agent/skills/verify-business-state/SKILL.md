---
name: Verify Business State
description: "Chapter 4: Query business DB to validate entity final state vs expected"
---

# Business Data Truth (Chapter 4)

## Purpose
Query the business database to validate entity final state vs expected outcome.

## Steps
1. Use `query-entity` to retrieve the business record by ID
2. Use `get-entity-status` for the current status and last-modified timestamp
3. Use `get-entity-history` for the full audit trail
4. Use `compare-states` if expected state is known — detect silent failures
5. Cross-reference with Trace (Chapter 1) and Logs (Chapter 2)

## Output
- Entity current state (status, last-modified, key fields)
- State consistency verdict: matches trace result / silent failure detected
- If mismatch: detail expected vs actual state
