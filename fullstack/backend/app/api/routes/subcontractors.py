
''' 
File Author: Leslie
Functions: provide create/update/read/delete endpoints for subcontractors module 
'''
from datetime import date
from typing import Any
import uuid

from fastapi import APIRouter, Depends, HTTPException, status as http_status

from app import crud
from app.api.deps import CurrentUser, SessionDep, get_current_active_superuser, get_current_user
from app.models import (
    Message,
    ProjectDetailsResponse,
    Subcontractor,
    SubcontractorCreate,
    SubcontractorPublic,
    SubcontractorUpdate
)

router = APIRouter(
    prefix="/subcontractors",
    tags=["subcontractors"],
    dependencies=[Depends(get_current_user)],
)


# Authors: Leslie
@router.post("/", response_model=SubcontractorPublic, status_code=http_status.HTTP_201_CREATED)
def create_subcontractor( subcontractor: SubcontractorCreate, session: SessionDep) -> SubcontractorPublic:
    ''' Create a new subcontractor and return its details '''
    created = crud.create_subcontractor(session=session, subcontractor=subcontractor)
    return SubcontractorPublic.model_validate(created)

# Authors: Leslie
@router.patch("/{subcontractor_id}", response_model=SubcontractorPublic)
def update_subcontractor(
    subcontractor_id: uuid.UUID,
    subcontractor_update: SubcontractorUpdate,
    session: SessionDep,
    current_user: CurrentUser,
) -> SubcontractorPublic:
    ''' Update a subcontractor and return the updated details '''
    db_subcontractor = session.get(Subcontractor, subcontractor_id)
    if not db_subcontractor:
        raise HTTPException(status_code=404, detail="Subcontractor not found")

    updated = crud.update_subcontractor(
        session=session,
        db_subcontractor=db_subcontractor,
        subcontractor_update=subcontractor_update
    )
    return SubcontractorPublic.model_validate(updated)

# Authors: Leslie
@router.get("/", response_model=list[SubcontractorPublic])
def list_subcontractors(
    session: SessionDep,
    current_user: CurrentUser,
) -> list[SubcontractorPublic]:
    ''' List all subcontractors '''
    subcontractors = crud.get_subcontractors(
        session=session
    )
    return [SubcontractorPublic.model_validate(sub) for sub in subcontractors]


# Authors: Leslie
@router.delete("/{subcontractor_id}", response_model=Message)
def delete_subcontractor(
    subcontractor_id: uuid.UUID,
    session: SessionDep,
) -> Message:
    ''' Delete a subcontractor if it is not in use, otherwise raise an error '''
    subcontractor = session.get(Subcontractor, subcontractor_id)
    if not subcontractor:
        raise HTTPException(status_code=404, detail="Subcontractor not found")

    usage = crud.subcontractor_usage_counts(
        session=session,
        subcontractor_id=subcontractor_id,
    )

    if any(usage.values()):
        raise HTTPException(
            status_code=400,
            detail=(
                "Subcontractor is in use and cannot be deleted. "
                f"Assignments: {usage['assignments']}, "
                f"materials: {usage['materials']}, "
                f"time logs: {usage['time_logs']}."
            ),
        )

    crud.delete_subcontractor(session=session, subcontractor=subcontractor)
    return Message(message="Subcontractor deleted successfully")


# Authors: Leslie
@router.get("/{subcontractor_id}/projects", response_model=ProjectDetailsResponse)
def list_subcontractor_projects(
    subcontractor_id: uuid.UUID,
    session: SessionDep,
    current_user: CurrentUser,
) -> ProjectDetailsResponse:
    ''' List all projects associated with a subcontractor, only if the project is assigned to the user '''
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
