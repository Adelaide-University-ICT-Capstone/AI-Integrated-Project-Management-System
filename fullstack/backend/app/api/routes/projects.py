from datetime import date, datetime
from typing import Any
import uuid

from fastapi import APIRouter, Depends, HTTPException, status

from app import crud
from app.api.deps import SessionDep, get_current_active_superuser
from app.models import (
    MonthlyCountResponse,
    MonthlyInvoiceResponse,
    ProjectDetailsResponse,
    ProjectSummary,
    ProjectUpdateRequest,
    ProjectsListResponse,
    ProjectCreateRequest,
    ProjectCreateResponse,
    ProjectDetail,
    Message
)

router = APIRouter(prefix="/projects", tags=["projects"])

# --- PROJECT CREATION ----
@router.post("", response_model=ProjectCreateResponse)
def create_project(project: ProjectCreateRequest, session: SessionDep) -> ProjectCreateResponse:
    existing_project = crud.get_project_by_job_number(session=session, job_number=project.job_number)
    if existing_project:
        raise HTTPException(
            status_code=409,
            detail="A project with this job_number already exists",
        )
    
    created_project = crud.create_project(session=session, project_data=project)
    return ProjectCreateResponse(project_id=created_project.id, message="Project created successfully")


# ── Static GET routes — must all come before /{project_id} ──────────────────

@router.get("", response_model=ProjectDetailsResponse)
def list_projects(session: SessionDep, status: str | None = None) -> ProjectDetailsResponse:
    projects = crud.get_projects_by_status(session=session, status=status)
    details = crud.build_project_details(session=session, projects=projects)
    return ProjectDetailsResponse(data=details, count=len(details))


@router.get(
    "/all-project",
    dependencies=[Depends(get_current_active_superuser)],
    response_model=ProjectsListResponse,
)
def get_all_active_projects(session: SessionDep) -> Any:
    projects = crud.get_all_active_projects(session=session)
    summaries = crud.build_project_summaries(session=session, projects=projects)
    return ProjectsListResponse(data=summaries, count=len(summaries))


@router.get(
    "/delay-project",
    dependencies=[Depends(get_current_active_superuser)],
    response_model=ProjectsListResponse,
)
def get_delayed_projects(session: SessionDep) -> Any:
    projects = crud.get_delayed_projects(session=session)
    summaries = crud.build_project_summaries(session=session, projects=projects)
    return ProjectsListResponse(data=summaries, count=len(summaries))


@router.get(
    "/current-project-num",
    dependencies=[Depends(get_current_active_superuser)],
    response_model=MonthlyCountResponse,
)
def get_current_project_count(session: SessionDep) -> Any:
    today = date.today()
    cur_start, cur_end = crud.month_bounds(today.year, today.month)
    prev_start, prev_end = crud.month_bounds(*crud.prev_month(today.year, today.month))
    return MonthlyCountResponse(
        current_month=crud.count_active_projects(session=session, start=cur_start, end=cur_end),
        previous_month=crud.count_active_projects(session=session, start=prev_start, end=prev_end),
    )


@router.get(
    "/completed-project",
    dependencies=[Depends(get_current_active_superuser)],
    response_model=MonthlyCountResponse,
)
def get_completed_project_count(session: SessionDep) -> Any:
    today = date.today()
    cur_start, cur_end = crud.month_bounds(today.year, today.month)
    prev_start, prev_end = crud.month_bounds(*crud.prev_month(today.year, today.month))
    return MonthlyCountResponse(
        current_month=crud.count_completed_projects(session=session, start=cur_start, end=cur_end),
        previous_month=crud.count_completed_projects(session=session, start=prev_start, end=prev_end),
    )


@router.get(
    "/invoice-bill",
    dependencies=[Depends(get_current_active_superuser)],
    response_model=MonthlyInvoiceResponse,
)
def get_invoice_bill(session: SessionDep) -> Any:
    today = date.today()
    cur_start, cur_end = crud.month_bounds(today.year, today.month)
    prev_start, prev_end = crud.month_bounds(*crud.prev_month(today.year, today.month))
    return MonthlyInvoiceResponse(
        current_month_total=crud.sum_invoices(session=session, start=cur_start, end=cur_end),
        previous_month_total=crud.sum_invoices(session=session, start=prev_start, end=prev_end),
    )


@router.get("/overdue", response_model=ProjectDetailsResponse)
def get_overdue_projects(session: SessionDep) -> Any:
    projects = crud.get_overdue_projects(session=session)
    details = crud.build_project_details(session=session, projects=projects)
    return ProjectDetailsResponse(data=details, count=len(details))


@router.get("/expected-to-finish/{date_str}", response_model=ProjectDetailsResponse)
def get_projects_expected_to_finish(session: SessionDep, date_str: str) -> Any:
    try:
        due_by = datetime.strptime(date_str, "%d-%m-%Y").date()
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid date format. Use dd-mm-yyyy")
    projects = crud.get_projects_expected_by_date(session=session, due_by=due_by)
    details = crud.build_project_details(session=session, projects=projects)
    return ProjectDetailsResponse(data=details, count=len(details))


# ── Dynamic routes — /{project_id} must come after all static paths ──────────

@router.get("/{project_id}", response_model=ProjectDetail)
def get_project_by_id(session: SessionDep, project_id: uuid.UUID) -> ProjectDetail:
    project = crud.get_project_by_id(session=session, project_id=project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return ProjectDetail(
        project_id=project.id,
        job_number=project.job_number,
        project_name=project.project_name,
        company_name=project.client.company_name if project.client else None,
        company_address=project.client.billing_address if project.client else None,
        client_name=project.client.client_name if project.client else None,
        status=project.current_status.status_name if project.current_status else None,
        start_date=project.start_date,
        due_date=project.due_date,
        days_elapsed=(date.today() - project.created_at.date()).days if project.created_at else None,
        fee_estimate=project.fee_final,
    )


@router.patch("/{project_id}", response_model=Message)
def update_project(
    project_id: uuid.UUID,
    project: ProjectUpdateRequest,
    session: SessionDep,
) -> Message:
    existing = crud.get_project_by_id(session=session, project_id=project_id)
    if not existing:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")
    try:
        crud.update_project(session=session, project_id=project_id, project_data=project)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc))
    return Message(message="Project updated successfully")


@router.delete("/{project_id}")
def delete_project(project_id: uuid.UUID, session: SessionDep):
    if not crud.delete_project(session=session, project_id=project_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")
    return {"message": "Project deleted successfully"}


@router.delete("")
def delete_all_projects(session: SessionDep):
    count = crud.delete_all_projects(session=session)
    return {"message": f"Successfully deleted {count} projects"}
