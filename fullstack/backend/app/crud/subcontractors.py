import uuid

from sqlmodel import Session, col, select
from datetime import date, datetime, timedelta


from app.models import (
    ProjectAssignment,
    Subcontractor,
    SubcontractorCreate
)

def get_subcontractors(*, session: Session) -> list[Subcontractor]:
    return list(session.exec(select(Subcontractor)).all())


def get_visible_subcontractors(
    *,
    session: Session,
    employee_id: uuid.UUID | None,
    is_superuser: bool,
) -> list[Subcontractor]:
    if is_superuser:
        return get_subcontractors(session=session)

    if not employee_id:
        return []

    visible_project_ids = select(ProjectAssignment.project_id).where(
        ProjectAssignment.employee_id == employee_id
    )

    query = (
        select(Subcontractor)
        .join(ProjectAssignment, ProjectAssignment.subcontractor_id == Subcontractor.id)
        .where(col(ProjectAssignment.project_id).in_(visible_project_ids))
        .distinct()
    )

    return list(session.exec(query).all())


def create_subcontractor(*, session: Session, subcontractor: SubcontractorCreate) -> Subcontractor:
    db_subcontractor = Subcontractor.model_validate(subcontractor)
    session.add(db_subcontractor)
    session.commit()
    session.refresh(db_subcontractor)
    return db_subcontractor
