---
name: telemetry-architecture
description: Reference architecture for dual-layer agent observability — local telemetry buffers for low-latency agent memory combined with centralized collection for cross-agent analysis.
metadata:
  author: dinesh707
  source: https://medium.com/@dinesh707/first-class-observability-stack-for-ai-agents-278d0f6eba74
---
# Dual-Layer Telemetry Architecture
## Design Principles
- Telemetry as first-class agent memory (not just logging)
- Local buffer per agent for sub-ms access to recent context
- Centralized backend for cross-agent correlation
- Cost optimization: sample high-volume, retain high-value
- Latency tiers: hot (local) / warm (central) / cold (archive)
