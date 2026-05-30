from datetime import date
from typing import Any
import uuid

from fastapi import APIRouter, Depends, HTTPException, status as http_status

from app import crud
from app.api.deps import CurrentUser, SessionDep, get_current_active_superuser, get_current_user
from app.models import (
    ProjectDetailsResponse,
    Subcontractor,
    SubcontractorCreate,
    SubcontractorPublic
)

router = APIRouter(
    prefix="/subcontractors",
    tags=["subcontractors"],
    dependencies=[Depends(get_current_user)],
)



@router.post("/", response_model=SubcontractorPublic, status_code=http_status.HTTP_201_CREATED)
def create_subcontractor( subcontractor: SubcontractorCreate, session: SessionDep) -> SubcontractorPublic:
    created = crud.create_subcontractor(session=session, subcontractor=subcontractor)
    return SubcontractorPublic.model_validate(created)

@router.get("/", response_model=list[SubcontractorPublic])
def list_subcontractors(
    session: SessionDep,
    current_user: CurrentUser,
) -> list[SubcontractorPublic]:
    subcontractors = crud.get_visible_subcontractors(
        session=session,
        employee_id=current_user.employee_id,
        is_superuser=current_user.is_superuser,
    )
    return [SubcontractorPublic.model_validate(sub) for sub in subcontractors]


@router.get("/{subcontractor_id}/projects", response_model=ProjectDetailsResponse)
def list_subcontractor_projects(
    subcontractor_id: uuid.UUID,
    session: SessionDep,
    current_user: CurrentUser,
) -> ProjectDetailsResponse:
    if not session.get(Subcontractor, subcontractor_id):
        raise HTTPException(status_code=404, detail="Subcontractor not found")

    projects = crud.get_visible_projects_for_subcontractor(
        session=session,
        subcontractor_id=subcontractor_id,
        employee_id=current_user.employee_id,
        is_superuser=current_user.is_superuser,
    )
    details = crud.build_project_details(session=session, projects=projects)
    return ProjectDetailsResponse(data=details, count=len(details))
