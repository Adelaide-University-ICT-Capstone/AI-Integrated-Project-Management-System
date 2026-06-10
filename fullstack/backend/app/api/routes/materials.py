from datetime import date
from typing import Any
import uuid

from fastapi import APIRouter, Depends, HTTPException, status as http_status

from app import crud
from app.api.deps import SessionDep, get_current_user, CurrentUser
from app.models import (
    MaterialPublic,
    MaterialCreate,
    MaterialUpdate,
    Message,
    Subcontractor,
)
from app.api.routes.visibility_helper import check_project_view_permission

router = APIRouter(
    tags=["materials"],
    dependencies=[Depends(get_current_user)],
)


@router.get(
    "/materials/",
    response_model=list[MaterialPublic],
)
def get_materials_by_due_date(
    session: SessionDep,
    current_user: CurrentUser,
    start: date | None = None,
    end: date | None = None,
    status: str | None = None
) -> list[MaterialPublic]:
    materials = crud.get_materials_by_due_date_and_status(
        session=session,
        start=start,
        end=end,
        status=status,
        employee_id=current_user.employee_id,
        is_superuser=current_user.is_superuser,
    )
    return [MaterialPublic.model_validate(material) for material in materials]

# Authors: Leslie
@router.get("/projects/{project_id}/materials/{material_id}", response_model=MaterialPublic)
def get_material(
    project_id: uuid.UUID,
    material_id: uuid.UUID,
    session: SessionDep,
    current_user: CurrentUser,
) -> MaterialPublic:
    ''' View a particular material order in the project. User must be assigned to this project to view the order'''
    check_project_view_permission(session, project_id, current_user)
    project = crud.get_project_by_id(session=session, project_id=project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    material = crud.get_material(session=session, material_id=material_id)
    if not material or material.project_id != project_id:
        raise HTTPException(status_code=404, detail="Material not found")

    return MaterialPublic.model_validate(material)

# Authors: Leslie
@router.get("/projects/{project_id}/materials", response_model=list[MaterialPublic], status_code=http_status.HTTP_200_OK)
def get_materials_from_project(project_id: uuid.UUID, session: SessionDep, current_user: CurrentUser) -> list[MaterialPublic]:
    ''' View a list of material orders in the project. User must be assigned to this project to view the order'''
    check_project_view_permission(session, project_id, current_user)
    project = crud.get_project_by_id(session=session, project_id=project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    materials = crud.get_materials_by_project_id(session=session, project_id=project_id)
    return [MaterialPublic.model_validate(material) for material in materials]

# Authors: Leslie
@router.post("/projects/{project_id}/materials", response_model=MaterialPublic, status_code=http_status.HTTP_201_CREATED)
def create_material_for_project(project_id: uuid.UUID, material: MaterialCreate, session: SessionDep, current_user: CurrentUser) -> MaterialPublic:
    ''' Create a material order in the project. User must be assigned to this project to create an order for the project.'''
    check_project_view_permission(session, project_id, current_user)
    # Add validation for subcontractor_id if provided
    if material.subcontractor_id and not session.get(Subcontractor, material.subcontractor_id):
        raise HTTPException(status_code=404, detail="Subcontractor not found")
    created = crud.create_material(session=session, project_id=project_id, material_data=material)
    return MaterialPublic.model_validate(created)

# Authors: Leslie
@router.patch("/projects/{project_id}/materials/{material_id}", response_model=MaterialPublic)
def update_material_for_project(project_id: uuid.UUID, material_id: uuid.UUID, material: MaterialUpdate, session: SessionDep, current_user: CurrentUser) -> MaterialPublic:
    ''' Update a material order in the project. User must be assigned to this project.'''
    check_project_view_permission(session, project_id, current_user)
    # Add validation for subcontractor_id if provided
    available_statuses = crud.get_material_statuses(session=session)
    if material.status and material.status not in available_statuses:
        raise HTTPException(status_code=400, detail="Please choose a valid material status: " + ", ".join(available_statuses))

    if material.subcontractor_id and not session.get(Subcontractor, material.subcontractor_id):
        raise HTTPException(status_code=404, detail="Subcontractor not found")
    
    existing = crud.get_material(session=session, material_id=material_id)  # Assuming you add this
    if not existing or existing.project_id != project_id:
        raise HTTPException(status_code=404, detail="Material not found")

    updated = crud.update_material(session=session, material=existing, updates=material.model_dump(exclude_unset=True))
    return MaterialPublic.model_validate(updated)

# Authors: Leslie
@router.delete("/projects/{project_id}/materials/{material_id}", response_model=Message)
def delete_material_from_project(project_id: uuid.UUID, material_id: uuid.UUID, session: SessionDep, current_user: CurrentUser) -> Message:
    ''' Delete a material order in the project. User must be assigned to this project.'''
    check_project_view_permission(session, project_id, current_user)
    project = crud.get_project_by_id(session=session, project_id=project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found") 
    material = crud.get_material(session=session, material_id=material_id)
    if not material or material.project_id != project_id:
        raise HTTPException(status_code=404, detail="Material not found")
    crud.delete_material(session=session, material=material)
    return Message(message="Material deleted successfully")
