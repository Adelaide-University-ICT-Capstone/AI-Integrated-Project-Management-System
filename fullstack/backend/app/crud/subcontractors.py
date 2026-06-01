import uuid

from sqlalchemy.orm import aliased
from sqlmodel import Session, col, select, func
from datetime import date, datetime, timedelta


from app.models import (
    Project,
    ProjectAssignment,
    Subcontractor,
    SubcontractorCreate,
    SubcontractorUpdate,
    Material,
    TimeLog,
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

def update_subcontractor(
    *,
    session: Session,
    db_subcontractor: Subcontractor,
    subcontractor_update: SubcontractorUpdate,
) -> Subcontractor:
    update_data = subcontractor_update.model_dump(exclude_unset=True)

    for field, value in update_data.items():
        setattr(db_subcontractor, field, value)

    session.add(db_subcontractor)
    session.commit()
    session.refresh(db_subcontractor)
    return db_subcontractor


def subcontractor_usage_counts(
    *,
    session: Session,
    subcontractor_id: uuid.UUID,
) -> dict[str, int]:
    assignment_count = session.exec(
        select(func.count())
        .select_from(ProjectAssignment)
        .where(ProjectAssignment.subcontractor_id == subcontractor_id)
    ).one()

    material_count = session.exec(
        select(func.count())
        .select_from(Material)
        .where(Material.subcontractor_id == subcontractor_id)
    ).one()

    time_log_count = session.exec(
        select(func.count())
        .select_from(TimeLog)
        .where(TimeLog.subcontractor_id == subcontractor_id)
    ).one()

    return {
        "assignments": assignment_count,
        "materials": material_count,
        "time_logs": time_log_count,
    }


def delete_subcontractor(
    *,
    session: Session,
    subcontractor: Subcontractor,
) -> None:
    session.delete(subcontractor)
    session.commit()