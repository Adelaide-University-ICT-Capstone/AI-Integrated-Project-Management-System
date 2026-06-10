from sqlmodel import Session, select

from app.crud.project_statuses import (
    ALLOWED_PROJECT_STATUS_NAMES,
    create_status_type,
    get_status_type,
)
from app.models import Project, ProjectStatus, ProjectStatusType, Role


def ensure_project_status_types(session: Session) -> None:
    for status in ProjectStatus:
        try:
            status_type = get_status_type(session=session, status_name=status.value)
            if not status_type.is_active:
                status_type.is_active = True
                session.add(status_type)
        except ValueError:
            create_status_type(session=session, status_name=status.value)
    session.commit()

    prelim_status = get_status_type(
        session=session,
        status_name=ProjectStatus.prelim.value,
    )
    retired_statuses = [
        status_type
        for status_type in session.exec(select(ProjectStatusType)).all()
        if status_type.status_name not in ALLOWED_PROJECT_STATUS_NAMES
    ]

    for status_type in retired_statuses:
        projects = session.exec(
            select(Project).where(Project.current_status_id == status_type.id)
        ).all()
        for project in projects:
            project.current_status_id = prelim_status.id
            session.add(project)

        status_type.is_active = False
        session.add(status_type)

    session.commit()


def ensure_roles(session: Session) -> None:
    roles = ["drafter", "engineer", "project_manager"]

    for role_name in roles:
        exists = session.exec(
            select(Role).where(Role.role_name == role_name)
        ).first()

        if not exists:
            session.add(
                Role(
                    role_name=role_name,
                    description=f"{role_name} role",
                    is_active=True,
                )
            )

    session.commit()
# --------- Igie -----------
