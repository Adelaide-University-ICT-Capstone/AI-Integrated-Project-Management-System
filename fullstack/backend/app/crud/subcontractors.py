import uuid

from sqlalchemy.orm import aliased
from sqlmodel import Session, col, select
from datetime import date, datetime, timedelta


from app.models import (
    Project,
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
    return get_subcontractors(session=session)


def get_visible_projects_for_subcontractor(
    *,
    session: Session,
    subcontractor_id: uuid.UUID,
    employee_id: uuid.UUID | None,
    is_superuser: bool,
) -> list[Project]:
    subcontractor_assignment = aliased(ProjectAssignment)

    query = (
        select(Project)
        .join(
            subcontractor_assignment,
            subcontractor_assignment.project_id == Project.id,
        )
        .where(subcontractor_assignment.subcontractor_id == subcontractor_id)
    )

    if not is_superuser:
        if not employee_id:
            return []

        employee_assignment = aliased(ProjectAssignment)
        query = query.join(
            employee_assignment,
            employee_assignment.project_id == Project.id,
        ).where(employee_assignment.employee_id == employee_id)

    return list(
        session.exec(
            query.order_by(col(Project.created_at).desc()).distinct()
        ).all()
    )


def create_subcontractor(*, session: Session, subcontractor: SubcontractorCreate) -> Subcontractor:
    db_subcontractor = Subcontractor.model_validate(subcontractor)
    session.add(db_subcontractor)
    session.commit()
    session.refresh(db_subcontractor)
    return db_subcontractor
