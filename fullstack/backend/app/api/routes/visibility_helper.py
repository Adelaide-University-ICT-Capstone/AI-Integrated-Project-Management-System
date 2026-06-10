
import uuid

from fastapi import HTTPException

from app import crud
from app.crud.workforce_allocate import (
    get_assignment
)

from app.api.deps import CurrentUser, SessionDep
from app.models import (
    Project
)


# Authors: Leslie 
def check_project_view_permission(
    session: SessionDep,
    project_id: uuid.UUID,
    current_user: CurrentUser,
) -> Project:
    ''' Help check project view permission for project visibility, return project if has permission, otherwise raise 403 or 404 '''
    project = session.get(Project, project_id)

    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    if current_user.is_superuser:
        return project

    if not current_user.employee_id:
        raise HTTPException(status_code=403, detail="Project access denied")

    assignment = get_assignment(
        session=session,
        project_id=project_id,
        employee_id=current_user.employee_id,
    )

    if assignment:
        return project

    raise HTTPException(status_code=403, detail="Project access denied")