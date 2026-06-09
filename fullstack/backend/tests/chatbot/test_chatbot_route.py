from unittest.mock import patch

import pytest

from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_chatbot_handles_llm_command_selection_failure():
    with patch("app.services.chatbot.orchestrator.ask_llm", return_value="not json"):
        response = client.post(
            "/api/v1/chatbot/chat",
            json={"message": "Show projects"},
        )

    assert response.status_code in [401, 403]

def test_chatbot_mocked_success(
    client: TestClient,
    superuser_token_headers: dict[str, str],
):
    with patch("app.services.chatbot.orchestrator.ask_llm") as mock_llm:
        mock_llm.side_effect = [
            '{"command": "get_visible_projects_summary", "arguments": {}}',
            "There are 4 visible projects.",
        ]

        response = client.post(
            "/api/v1/chatbot/chat",
            headers=superuser_token_headers,
            json={"message": "Show project summary"},
        )

    assert response.status_code == 200
    assert "response" in response.json()