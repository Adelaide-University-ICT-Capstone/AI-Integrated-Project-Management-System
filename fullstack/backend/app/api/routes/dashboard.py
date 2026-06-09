from datetime import date, timedelta

from fastapi import APIRouter

from app import crud
from app.api.deps import CurrentUser, SessionDep
from app.schemas.dashboard import AIAlert, AIAlertsResponse

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


@router.get("/ai-alerts", response_model=AIAlertsResponse)
def get_ai_alerts(
    session: SessionDep,
    current_user: CurrentUser,
) -> AIAlertsResponse:
    alerts: list[AIAlert] = []

    visible_projects = crud.get_visible_projects(
        session=session,
        employee_id=current_user.employee_id,
        is_superuser=current_user.is_superuser,
    )
    visible_ids = {project.id for project in visible_projects}

    overdue_projects = [
        project for project in crud.get_overdue_projects(session=session)
        if project.id in visible_ids
    ]

    delayed_projects = [
        project for project in crud.get_delayed_projects(session=session)
        if project.id in visible_ids
    ]

    due_soon_projects = [
        project for project in crud.get_projects_expected_by_date(
            session=session,
            due_by=date.today() + timedelta(days=7),
        )
        if project.id in visible_ids
    ]

    for project in overdue_projects:
        days_overdue = (
            date.today() - project.due_date
        ).days if project.due_date else 0

        alerts.append(
            AIAlert(
                id=f"overdue-{project.id}",
                severity="high",
                project=project.project_name or project.job_number,
                message=f"Project is {days_overdue} days overdue.",
                action="Review project schedule and update delivery plan.",
            )
        )

    for project in delayed_projects:
        alerts.append(
            AIAlert(
                id=f"delayed-{project.id}",
                severity="high",
                project=project.project_name or project.job_number,
                message="Project has overdue incomplete milestones.",
                action="Review delayed milestones and assign follow-up actions.",
            )
        )

    for project in due_soon_projects:
        if project.id in {p.id for p in overdue_projects}:
            continue

        alerts.append(
            AIAlert(
                id=f"due-soon-{project.id}",
                severity="medium",
                project=project.project_name or project.job_number,
                message="Project is due within the next 7 days.",
                action="Confirm remaining deliverables before the due date.",
            )
        )

    return AIAlertsResponse(alerts=alerts[:10])