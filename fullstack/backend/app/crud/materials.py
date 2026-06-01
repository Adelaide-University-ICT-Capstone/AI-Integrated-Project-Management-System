import uuid
from sqlalchemy.orm import aliased
from sqlmodel import select
from app.models import (
    Material,
    ProjectAssignment,
    SubcontractorStatus,
)
from datetime import date
from sqlmodel import Session, select



def get_material_statuses(*, session: Session) -> list[str]:
    return [status.value for status in SubcontractorStatus]

def get_materials_by_due_date_and_status(
    *,
    session: Session,
    start: date | None = None,
    end: date | None = None,
    status: str | None = None,
    employee_id: uuid.UUID | None = None,
    is_superuser: bool = False,
) -> list[Material]:
    query = select(Material)

    if start is not None:
        query = query.where(Material.due_date >= start)
    if end is not None:
        query = query.where(Material.due_date <= end)
    if status is not None:
        query = query.where(Material.status == status)

    # if not superuser, restrict to materials where the current user is assigned to the project
    if not is_superuser:
        if not employee_id:
            return []
        query = query.join(
            ProjectAssignment,
            ProjectAssignment.project_id == Material.project_id
        ).where(ProjectAssignment.employee_id == employee_id)

    return list(session.exec(query).all())