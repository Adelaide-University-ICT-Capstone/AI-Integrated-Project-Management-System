from datetime import date
from typing import Any
import uuid

from fastapi import APIRouter, Depends, HTTPException, status

from app import crud
from app.api.deps import SessionDep, get_current_active_superuser
from app.models import (
    ProjectStatusTypePublic,
)

router = APIRouter(prefix="/statuses", tags=["statuses"])


# Authors: Leslie
@router.get(
    "",
    response_model=list[ProjectStatusTypePublic],
)
def get_project_statuses(session: SessionDep) -> list[ProjectStatusTypePublic]:
    ''' Retrieve all project status types '''
    status_types = crud.get_all_status_types(session=session)
    return [ProjectStatusTypePublic.model_validate(status_type) for status_type in status_types]
