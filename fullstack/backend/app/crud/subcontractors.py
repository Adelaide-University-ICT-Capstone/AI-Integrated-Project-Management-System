from sqlmodel import Session, select
from datetime import date, datetime, timedelta


from app.models import (
    Subcontractor

)

def get_subcontractors(*, session: Session) -> list[Subcontractor]:
    return list(session.exec(select(Subcontractor)).all())