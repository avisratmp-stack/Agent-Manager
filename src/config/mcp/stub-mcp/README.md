# STUB MCP

Universal stub MCP server that mirrors every tool from all registered MCP servers.

When **Stub Mode** is enabled in the Test Console, all MCP calls are routed here instead of real backends. Every tool returns dummy `*STUB RESULTS*` data.

## Purpose
- Test agent traces end-to-end without live infrastructure
- Validate wiring and tool selection logic
- Demo the platform without external dependencies

## Tools
Contains all tools from every registered MCP server (external and local). The tool list is a superset — any tool name from any MCP will match here.
