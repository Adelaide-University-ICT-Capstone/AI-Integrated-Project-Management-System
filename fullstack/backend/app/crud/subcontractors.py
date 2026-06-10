''' 
File Author: Leslie
Functions: provide create/update/read/delete endpoints for subcontractors module 
'''


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

# Authors: Leslie
def get_visible_projects_for_subcontractor(
    *,
    session: Session,
    subcontractor_id: uuid.UUID,
    employee_id: uuid.UUID | None,
    is_superuser: bool,
) -> list[Project]:
    ''' Get all projects associated with a subcontractor, only if the project is assigned to the user '''
    subcontractor_assignment = aliased(ProjectAssignment)

    query = (
        select(Project)
        .join(
            subcontractor_assignment,
            subcontractor_assignment.project_id == Project.id,
        )
        .where(subcontractor_assignment.subcontractor_id == subcontractor_id)
    )

    # If the user is not a superuser, only return projects that are assigned to the user
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

# Authors: Leslie
def create_subcontractor(*, session: Session, subcontractor: SubcontractorCreate) -> Subcontractor:
    ''' Create a new subcontractor and return its details '''
    db_subcontractor = Subcontractor.model_validate(subcontractor)
    session.add(db_subcontractor)
    session.commit()
    session.refresh(db_subcontractor)
    return db_subcontractor

# Authors: Leslie
def update_subcontractor(
    *,
    session: Session,
    db_subcontractor: Subcontractor,
    subcontractor_update: SubcontractorUpdate,
) -> Subcontractor:
    ''' Update a subcontractor and return the updated details '''
    update_data = subcontractor_update.model_dump(exclude_unset=True)

    for field, value in update_data.items():
        setattr(db_subcontractor, field, value)

    session.add(db_subcontractor)
    session.commit()
    session.refresh(db_subcontractor)
    return db_subcontractor

# Authors: Leslie
def subcontractor_usage_counts(
    *,
    session: Session,
    subcontractor_id: uuid.UUID,
) -> dict[str, int]:
    ''' Get the count of how many times a subcontractor is used across different tables '''
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

# Authors: Leslie
def delete_subcontractor(
    *,
    session: Session,
    subcontractor: Subcontractor,
) -> None:
    ''' Delete a subcontractor if it is not in use, otherwise raise an error '''
    session.delete(subcontractor)
    session.commit()