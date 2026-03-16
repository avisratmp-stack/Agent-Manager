"""
Investigate Now Agent - Handler Service
"""
import logging
from typing import Any, Dict, Optional
from framework.base_handler import BaseAgentHandler

logger = logging.getLogger(__name__)


class InvestigateNowHandler(BaseAgentHandler):
    """Request handler for Investigate Now Agent."""

    def __init__(self, config: Optional[Dict[str, Any]] = None):
        super().__init__(config or {})
        self.agent_name = "investigate-now-agent"

    async def process(self, task_input: Dict[str, Any]) -> Dict[str, Any]:
        logger.info("[%s] Processing task: %s", self.agent_name, task_input.get("task_id"))
        context = self._build_context(task_input)
        result = await self._execute(context)
        return self._format_response(result)

    def _build_context(self, task_input: Dict[str, Any]) -> Dict[str, Any]:
        return {
            "agent": self.agent_name,
            "payload": task_input.get("payload", {}),
            "metadata": task_input.get("metadata", {}),
        }

    async def _execute(self, context: Dict[str, Any]) -> Dict[str, Any]:
        # TODO: Implement Investigate Now Agent business logic
        raise NotImplementedError("InvestigateNowHandler._execute")

    def _format_response(self, result: Dict[str, Any]) -> Dict[str, Any]:
        return {
            "status": "completed",
            "agent": self.agent_name,
            "output": result,
        }
