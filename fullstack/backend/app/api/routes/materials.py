from datetime import date
from typing import Any
import uuid

from fastapi import APIRouter, Depends, HTTPException, status as http_status

from app import crud
from app.api.deps import SessionDep, get_current_active_superuser, get_current_user, CurrentUser
from app.models import (
    MaterialPublic,
)

router = APIRouter(
    prefix="/materials",
    tags=["materials"],
    dependencies=[Depends(get_current_user)],
)


@router.get(
    "/",
    response_model=list[MaterialPublic],
)
def get_materials_by_due_date(
    session: SessionDep,
    current_user: CurrentUser,
    start: date | None = None,
    end: date | None = None,
    status: str | None = None
) -> list[MaterialPublic]:
    materials = crud.get_materials_by_due_date_and_status(
        session=session,
        start=start,
        end=end,
        status=status,
        employee_id=current_user.employee_id,
        is_superuser=current_user.is_superuser,
    )
    return [MaterialPublic.model_validate(material) for material in materials]


