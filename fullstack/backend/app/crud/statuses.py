from sqlmodel import Session, select
from datetime import date, datetime, timedelta


from app.models import (
    ProjectStatusType
)


def get_all_status_types(*, session: Session) -> list[ProjectStatusType]:
    return list(session.exec(select(ProjectStatusType)).all())

def get_status_by_id(*, session: Session, status_id: uuid.UUID) -> ProjectStatusType | None:
    return session.get(ProjectStatusType, status_id)
