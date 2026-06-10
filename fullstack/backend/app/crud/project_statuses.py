''' 
File Author: Leslie Nguyen
Functions: provide create/update/read/delete operations for project statuses 
'''

from sqlmodel import Session, select

from app.models import (
    ProjectStatus,
    ProjectStatusType,
)

ALLOWED_PROJECT_STATUS_NAMES = tuple(status.value for status in ProjectStatus)


# Authors: Leslie
def get_status_type(*, session: Session, status_name: str) -> ProjectStatusType:
    ''' Retrieve status by status name'''
    status_type = session.exec(
        select(ProjectStatusType).where(ProjectStatusType.status_name == status_name)
    ).first()

    if not status_type:
        raise ValueError(f"Status type '{status_name}' does not exist.")

    return status_type

# Authors: Leslie
def create_status_type(*, session: Session, status_name: str) -> ProjectStatusType:
    ''' Make a new status '''
    status_type = session.exec(
        select(ProjectStatusType).where(ProjectStatusType.status_name == status_name)
    ).first()
    if status_type:
        raise ValueError(f"Status type '{status_name}' already exists.")

    status_type = ProjectStatusType(status_name=status_name)
    session.add(status_type)
    session.commit()
    session.refresh(status_type)
    return status_type


# Authors: Leslie
def get_all_status_types(*, session: Session) -> list[ProjectStatusType]:
    ''' Retrieve all possible statuses'''
    status_types = list(
        session.exec(
            select(ProjectStatusType).where(
                ProjectStatusType.status_name.in_(ALLOWED_PROJECT_STATUS_NAMES),
                ProjectStatusType.is_active.is_(True),
            )
        ).all()
    )
    return sorted(
        status_types,
        key=lambda status_type: ALLOWED_PROJECT_STATUS_NAMES.index(
            status_type.status_name
        ),
    )
