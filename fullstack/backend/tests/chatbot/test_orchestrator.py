from unittest.mock import AsyncMock, patch

import pytest

from app.services.chatbot.orchestrator import (
    choose_command,
    execute_command,
    generate_final_response,
)


@pytest.mark.asyncio
async def test_choose_command_handles_invalid_json():
    with patch("app.services.chatbot.orchestrator.ask_llm", return_value="not json"):
        result = await choose_command("Which projects are overdue?", None)

    assert result["command"] is None
    assert result["arguments"] == {}


@pytest.mark.asyncio
async def test_execute_command_rejects_unknown_command():
    result = await execute_command(
        command_name="delete_everything",
        arguments={},
        session=None,
        current_user=None,
    )

    assert result["success"] is False
    assert "Unknown command" in result["error"]


@pytest.mark.asyncio
async def test_execute_command_catches_command_exception():
    async def broken_command(**kwargs):
        raise RuntimeError("Database failed")

    with patch.dict(
        "app.services.chatbot.orchestrator.COMMANDS",
        {"broken_command": broken_command},
    ):
        result = await execute_command(
            command_name="broken_command",
            arguments={},
            session=None,
            current_user=None,
        )

    assert result["success"] is False
    assert result["command"] == "broken_command"


@pytest.mark.asyncio
async def test_generate_final_response_handles_llm_failure():
    with patch("app.services.chatbot.orchestrator.ask_llm", return_value=None):
        result = await generate_final_response(
            message="Summarize projects",
            command_name="get_visible_projects_summary",
            command_result={"success": True, "data": {}},
        )

    assert "could not generate" in result.lower()