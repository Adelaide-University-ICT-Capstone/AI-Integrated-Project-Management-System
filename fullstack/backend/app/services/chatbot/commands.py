# app/services/chatbot/commands.py
import uuid
from datetime import date, datetime, timedelta
from decimal import Decimal
from typing import Any
from app import crud

# Helper Functions
# Get all project ids that the users can access.
def get_visible_project_ids(session, current_user) -> set[uuid.UUID]:
    visible_projects = crud.get_visible_projects(
        session=session,
        employee_id=current_user.employee_id,
        is_superuser=current_user.is_superuser,
    )
    return {project.id for project in visible_projects}

# Check if user can view the project.
def can_view_project(session, current_user, project_id: uuid.UUID) -> bool:
    if current_user.is_superuser:
        return True

    return project_id in get_visible_project_ids(session, current_user)

# Try to find the project using a project identifier (UUID, Job Number, Project Name)
def resolve_project(session, current_user, project_identifier: str):
    project = None

    # Checks UUID
    try:
        project_uuid = uuid.UUID(project_identifier)
        project = crud.get_project_by_id(
            session=session,
            project_id=project_uuid,
        )
    except ValueError:
        pass

    # Check Job Number.
    if not project:
        project = crud.get_project_by_job_number(
            session=session,
            job_number=project_identifier,
        )

    # Get list of visible projects
    visible_projects = crud.get_visible_projects(
        session=session,
        employee_id=current_user.employee_id,
        is_superuser=current_user.is_superuser,
    )

    # Check Project Name from visible projects.
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

    # If no project match, return none.
    if not project:
        return None

    # If user can't view project, return none.
    if not can_view_project(session=session, current_user=current_user, project_id=project.id,):
        return None

    return project

# Serialize the value.
def serialize(value: Any):
    if isinstance(value, uuid.UUID):
        return str(value)
    if isinstance(value, Decimal):
        return float(value)
    if isinstance(value, date | datetime):
        return value.isoformat()
    return value

# Serializes all the values in a model to a proper dictionary.
def model_to_dict(model):
    return {
        key: serialize(value)
        for key, value in model.model_dump().items()
    }

# Creates a summary of visible projects.
async def get_visible_projects_summary(session, current_user):
    # Get a list of visible projects.
    projects = crud.get_visible_projects(
        session=session,
        employee_id=current_user.employee_id,
        is_superuser=current_user.is_superuser,
    )

    # Get details of each visible projects.
    details = crud.build_project_details(
        session=session,
        projects=projects,
    )

    # Return the dictionary of projects.
    return {
        "projects": [model_to_dict(project) for project in details],
        "count": len(details),
    }

# Get details of a specific project by it's identfier.
async def get_project_details(session, current_user, project_identifier: str):
    # Find the project.
    project = resolve_project(
        session=session,
        current_user=current_user,
        project_identifier=project_identifier,
    )

    # If project not found, return error.
    if not project:
        return {"error": "Project not found or access denied"}
    
    # Returns the details of the project.
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
    # Get all delayed projects.
    projects = crud.get_delayed_projects(session=session)

    # Check which projects are visible to the user.
    visible_projects = crud.get_visible_projects(
        session=session,
        employee_id=current_user.employee_id,
        is_superuser=current_user.is_superuser,
    )
    visible_ids = {project.id for project in visible_projects}
    projects = [project for project in projects if project.id in visible_ids]

    # Get details of the eligible projects.
    details = crud.build_project_details(session=session, projects=projects)

    # Return delayed projects.
    return {
        "delayed_projects": [model_to_dict(project) for project in details],
        "count": len(details),
    }


async def get_overdue_projects(session, current_user):
    # Get all overdue projects.
    projects = crud.get_overdue_projects(session=session)

    # Check which of these projects are visible to user.
    visible_projects = crud.get_visible_projects(
        session=session,
        employee_id=current_user.employee_id,
        is_superuser=current_user.is_superuser,
    )
    visible_ids = {project.id for project in visible_projects}
    projects = [project for project in projects if project.id in visible_ids]

    # Get details of eligible projects.
    details = crud.build_project_details(session=session, projects=projects)

    # Return overdue projects.
    return {
        "overdue_projects": [model_to_dict(project) for project in details],
        "count": len(details),
    }

async def get_projects_due_soon(session, current_user, days: int = 7):
    # Find the due by date.
    due_by = date.today() + timedelta(days=days)

    # Get a list of projects that are expected before this date.
    projects = crud.get_projects_expected_by_date(
        session=session,
        due_by=due_by,
    )

    # Check which ones are authorised to the user.
    visible_projects = crud.get_visible_projects(
        session=session,
        employee_id=current_user.employee_id,
        is_superuser=current_user.is_superuser,
    )
    visible_ids = {project.id for project in visible_projects}
    projects = [project for project in projects if project.id in visible_ids]

    # Get details of eligible projects.
    details = crud.build_project_details(
        session=session,
        projects=projects,
    )

    # Return projects due soon.
    return {
    "projects_due_soon": [model_to_dict(project) for project in details],
    "count": len(details),
    "due_by": due_by.isoformat(),
}

async def get_project_tasks(session, current_user, project_identifier: str):
    # Get project using identifier
    project = resolve_project(
        session=session,
        current_user=current_user,
        project_identifier=project_identifier,
    )

    # If project not found, return error.
    if not project:
        return {"error": "Project not found or access denied"}

    # Get tasks of the project
    milestones = crud.get_project_task_management(
        session=session,
        project_id=project.id,
        employee_id=current_user.employee_id,
        filter_by_employee=not current_user.is_superuser,
    )

    # Return project milestones.
    return {
        "project_id": str(project.id),
        "job_number": project.job_number,
        "project_name": project.project_name,
        "milestones": [model_to_dict(milestone) for milestone in milestones],
        "count": len(milestones),
    }


async def get_invoice_summary(session, current_user):
    # If user is not a superuser, return a permission error.
    if not current_user.is_superuser:
        return {
            "error": "You do not have permission to view invoice summaries."
        }

    # Find today's date and the time period of current and last month.
    today = date.today()

    current_start, current_end = crud.month_bounds(today.year, today.month)
    previous_year, previous_month = crud.prev_month(today.year, today.month)
    previous_start, previous_end = crud.month_bounds(previous_year, previous_month)

    # Find invoice total for current month.
    current_month_total = crud.sum_invoices(
        session=session,
        start=current_start,
        end=current_end,
    )
    
    # Find invoice total of last month.
    previous_month_total = crud.sum_invoices(
        session=session,
        start=previous_start,
        end=previous_end,
    )

    # Return the monthly invoice.
    return {
        "current_month_total": serialize(current_month_total),
        "previous_month_total": serialize(previous_month_total),
        "current_month": today.strftime("%B %Y"),
        "previous_month": previous_start.strftime("%B %Y"),
    }

# List of commands.
COMMANDS = {
    "get_visible_projects_summary": get_visible_projects_summary,
    "get_project_details": get_project_details,
    "get_overdue_projects": get_overdue_projects,
    "get_delayed_projects": get_delayed_projects,
    "get_projects_due_soon": get_projects_due_soon,
    "get_project_tasks": get_project_tasks,
    "get_invoice_summary": get_invoice_summary,
}