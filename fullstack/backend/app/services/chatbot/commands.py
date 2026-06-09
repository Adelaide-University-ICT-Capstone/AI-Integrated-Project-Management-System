# app/services/chatbot/commands.py
import uuid
from datetime import date, datetime, timedelta
from decimal import Decimal
from typing import Any
from app import crud


def get_visible_project_ids(session, current_user) -> set[uuid.UUID]:
    visible_projects = crud.get_visible_projects(
        session=session,
        employee_id=current_user.employee_id,
        is_superuser=current_user.is_superuser,
    )
    return {project.id for project in visible_projects}


def can_view_project(session, current_user, project_id: uuid.UUID) -> bool:
    if current_user.is_superuser:
        return True

    return project_id in get_visible_project_ids(session, current_user)


def require_project_access(session, current_user, project_id: uuid.UUID):
    if not can_view_project(session, current_user, project_id):
        return {"error": "Project not found or access denied"}
    return None

def resolve_project(session, current_user, project_identifier: str):
    project = None

    # UUID
    try:
        project_uuid = uuid.UUID(project_identifier)
        project = crud.get_project_by_id(
            session=session,
            project_id=project_uuid,
        )
    except ValueError:
        pass

    # Job number
    if not project:
        project = crud.get_project_by_job_number(
            session=session,
            job_number=project_identifier,
        )

    # Project name
    visible_projects = crud.get_visible_projects(
        session=session,
        employee_id=current_user.employee_id,
        is_superuser=current_user.is_superuser,
    )

    if not project:
        project = next(
            (
                p
                for p in visible_projects
                if p.project_name
                and p.project_name.lower() == project_identifier.lower()
            ),
            None,
        )

    if not project:
        return None

    access_error = require_project_access(
        session=session,
        current_user=current_user,
        project_id=project.id,
    )

    if access_error:
        return None

    return project

def serialize(value: Any):
    if isinstance(value, uuid.UUID):
        return str(value)
    if isinstance(value, Decimal):
        return float(value)
    if isinstance(value, date | datetime):
        return value.isoformat()
    return value


def model_to_dict(model):
    return {
        key: serialize(value)
        for key, value in model.model_dump().items()
    }


async def get_visible_projects_summary(session, current_user):
    projects = crud.get_visible_projects(
        session=session,
        employee_id=current_user.employee_id,
        is_superuser=current_user.is_superuser,
    )

    details = crud.build_project_details(
        session=session,
        projects=projects,
    )

    return {
        "projects": [model_to_dict(project) for project in details],
        "count": len(details),
    }

async def get_project_details(session, current_user, project_identifier: str):
    project = resolve_project(
        session=session,
        current_user=current_user,
        project_identifier=project_identifier,
    )

    if not project:
        return {"error": "Project not found or access denied"}

    # 4. Permission check
    visible_ids = {visible_project.id for visible_project in visible_projects}

    if project.id not in visible_ids:
        return {"error": "Project not found or access denied"}

    return {
        "project_id": str(project.id),
        "job_number": project.job_number,
        "project_name": project.project_name,
        "client_name": project.client.client_name if project.client else None,
        "company_name": project.client.company_name if project.client else None,
        "status": project.current_status.status_name if project.current_status else None,
        "start_date": serialize(project.start_date),
        "due_date": serialize(project.due_date),
        "completion_date": serialize(project.completion_date),
        "completion_percent": serialize(
            crud.calculate_project_completion_percent(
                session=session,
                project=project,
            )
        ),
        "is_invoiced": crud.is_project_invoiced(
            session=session,
            project=project,
        ),
        "project_tab": crud.get_project_tab(
            session=session,
            project=project,
        ),
        "fee_final": serialize(project.fee_final),
        "invoice_amount": serialize(project.invoice_amount),
    }


async def get_delayed_projects(session, current_user):
    projects = crud.get_delayed_projects(session=session)

    visible_projects = crud.get_visible_projects(
        session=session,
        employee_id=current_user.employee_id,
        is_superuser=current_user.is_superuser,
    )

    visible_ids = {project.id for project in visible_projects}
    projects = [project for project in projects if project.id in visible_ids]

    details = crud.build_project_details(session=session, projects=projects)

    return {
        "delayed_projects": [model_to_dict(project) for project in details],
        "count": len(details),
    }


async def get_overdue_projects(session, current_user):
    projects = crud.get_overdue_projects(session=session)

    visible_projects = crud.get_visible_projects(
        session=session,
        employee_id=current_user.employee_id,
        is_superuser=current_user.is_superuser,
    )

    visible_ids = {project.id for project in visible_projects}
    projects = [project for project in projects if project.id in visible_ids]

    details = crud.build_project_details(session=session, projects=projects)

    return {
        "overdue_projects": [model_to_dict(project) for project in details],
        "count": len(details),
    }

async def get_projects_due_soon(
    session,
    current_user,
    days: int = 7,
):
    due_by = date.today() + timedelta(days=days)

    projects = crud.get_projects_expected_by_date(
        session=session,
        due_by=due_by,
    )

    visible_projects = crud.get_visible_projects(
        session=session,
        employee_id=current_user.employee_id,
        is_superuser=current_user.is_superuser,
    )

    visible_ids = {project.id for project in visible_projects}

    projects = [
        project
        for project in projects
        if project.id in visible_ids
    ]

    details = crud.build_project_details(
        session=session,
        projects=projects,
    )

    return {
    "projects_due_soon": [
        model_to_dict(project)
        for project in details
    ],
    "count": len(details),
    "due_by": due_by.isoformat(),
}

async def get_project_tasks(session, current_user, project_identifier: str):
    project = None

    # 1. Try UUID first
    try:
        project_uuid = uuid.UUID(project_identifier)
        project = crud.get_project_by_id(
            session=session,
            project_id=project_uuid,
        )
    except ValueError:
        pass

    # 2. Try job number
    if not project:
        project = crud.get_project_by_job_number(
            session=session,
            job_number=project_identifier,
        )

    # 3. Try project name
    if not project:
        visible_projects = crud.get_visible_projects(
            session=session,
            employee_id=current_user.employee_id,
            is_superuser=current_user.is_superuser,
        )

        project = next(
            (
                visible_project
                for visible_project in visible_projects
                if visible_project.project_name
                and visible_project.project_name.lower() == project_identifier.lower()
            ),
            None,
        )

    if not project:
        return {"error": "Project not found"}

    # 4. Permission check
    visible_projects = crud.get_visible_projects(
        session=session,
        employee_id=current_user.employee_id,
        is_superuser=current_user.is_superuser,
    )
    visible_ids = {visible_project.id for visible_project in visible_projects}

    if project.id not in visible_ids:
        return {"error": "Project not found or access denied"}

    # 5. Get tasks using resolved UUID
    milestones = crud.get_project_task_management(
        session=session,
        project_id=project.id,
        employee_id=current_user.employee_id,
        filter_by_employee=not current_user.is_superuser,
    )

    return {
        "project_id": str(project.id),
        "job_number": project.job_number,
        "project_name": project.project_name,
        "milestones": [model_to_dict(milestone) for milestone in milestones],
        "count": len(milestones),
    }


async def get_invoice_summary(session, current_user):
    today = date.today()

    current_start, current_end = crud.month_bounds(today.year, today.month)
    previous_year, previous_month = crud.prev_month(today.year, today.month)
    previous_start, previous_end = crud.month_bounds(previous_year, previous_month)

    current_month_total = crud.sum_invoices(
        session=session,
        start=current_start,
        end=current_end,
    )

    previous_month_total = crud.sum_invoices(
        session=session,
        start=previous_start,
        end=previous_end,
    )

    return {
        "current_month_total": serialize(current_month_total),
        "previous_month_total": serialize(previous_month_total),
        "current_month": today.strftime("%B %Y"),
        "previous_month": previous_start.strftime("%B %Y"),
    }


COMMANDS = {
    "get_visible_projects_summary": get_visible_projects_summary,
    "get_project_details": get_project_details,
    "get_overdue_projects": get_overdue_projects,
    "get_delayed_projects": get_delayed_projects,
    "get_projects_due_soon": get_projects_due_soon,
    "get_project_tasks": get_project_tasks,
    "get_invoice_summary": get_invoice_summary,
}