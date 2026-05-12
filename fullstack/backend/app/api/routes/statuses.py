from datetime import date
from typing import Any
import uuid

from fastapi import APIRouter, Depends, HTTPException, status

from app import crud
from app.api.deps import SessionDep, get_current_active_superuser
from app.models import (
    MonthlyCountResponse,
    MonthlyInvoiceResponse,
    ProjectDetailsResponse,
    ProjectStatusTypePublic,
    ProjectSummary,
    ProjectUpdateRequest,
    ProjectsListResponse,
    ProjectCreateRequest,
    ProjectCreateResponse,
    ProjectDetail,
    Message
)

router = APIRouter(prefix="/statuses", tags=["statuses"])


@router.get(
    "",
    response_model=list[ProjectStatusTypePublic],
)
def get_project_statuses(session: SessionDep) -> list[ProjectStatusTypePublic]:
    status_types = crud.get_all_status_types(session=session)
    return status_types