from types import SimpleNamespace
from unittest.mock import patch
import uuid

import pytest

from app.services.chatbot.commands import (
    get_visible_project_ids,
    can_view_project,
    get_invoice_summary,
)


def test_get_visible_project_ids():
    project_id = uuid.uuid4()
    fake_project = SimpleNamespace(id=project_id)
    fake_user = SimpleNamespace(employee_id=uuid.uuid4(), is_superuser=False)

    with patch(
        "app.services.chatbot.commands.crud.get_visible_projects",
        return_value=[fake_project],
    ):
        result = get_visible_project_ids(session=None, current_user=fake_user)

    assert result == {project_id}


def test_can_view_project_denies_invisible_project():
    visible_id = uuid.uuid4()
    invisible_id = uuid.uuid4()
    fake_project = SimpleNamespace(id=visible_id)
    fake_user = SimpleNamespace(employee_id=uuid.uuid4(), is_superuser=False)

    with patch(
        "app.services.chatbot.commands.crud.get_visible_projects",
        return_value=[fake_project],
    ):
        result = can_view_project(
            session=None,
            current_user=fake_user,
            project_id=invisible_id,
        )

    assert result is False


def test_can_view_project_allows_superuser():
    fake_user = SimpleNamespace(employee_id=None, is_superuser=True)

    result = can_view_project(
        session=None,
        current_user=fake_user,
        project_id=uuid.uuid4(),
    )

    assert result is True


@pytest.mark.asyncio
async def test_invoice_summary_denies_non_superuser():
    fake_user = SimpleNamespace(employee_id=uuid.uuid4(), is_superuser=False)

    result = await get_invoice_summary(
        session=None,
        current_user=fake_user,
    )

    assert "error" in result