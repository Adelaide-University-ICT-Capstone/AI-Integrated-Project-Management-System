# ---- Igie -----
import uuid

from fastapi import APIRouter, HTTPException, status
from sqlmodel import select

from app.api.deps import CurrentUser, SessionDep
from app.models import (
    Project,
    ProjectAssignment,
    Role,
    User,
    WorkforceAssignmentRequest,
    WorkforceDeleteRequest,
    WorkforceAssignmentResponse,
    WorkforcePostResponse,
    WorkforcePatchResponse,
    WorkforceDeleteResponse,
    AuditLog,
)

router = APIRouter(tags=["workforce allocation"])


def check_project_permission(
    session: SessionDep,
    project_id: uuid.UUID,
    current_user: CurrentUser,
) -> Project:
    project = session.get(Project, project_id)

    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    if current_user.is_superuser:
        return project

    raise HTTPException(
        status_code=403,
        detail="Only the project owner or superuser can manage workforce allocation",
    )


def get_user_employee_id(session: SessionDep, user_id: uuid.UUID) -> uuid.UUID:
    user = session.get(User, user_id)

    if not user:
        raise HTTPException(status_code=404, detail=f"User not found: {user_id}")

    if not user.employee_id:
        raise HTTPException(
            status_code=404,
            detail=f"User is not linked to an employee: {user_id}",
        )

    return user.employee_id


def check_role_exists(session: SessionDep, role_id: uuid.UUID) -> Role:
    role = session.get(Role, role_id)

    if not role:
        raise HTTPException(status_code=404, detail=f"Role not found: {role_id}")

    if not role.is_active:
        raise HTTPException(status_code=400, detail=f"Role is inactive: {role_id}")

    return role


def to_assignment_response(
    assignment: ProjectAssignment,
) -> WorkforceAssignmentResponse:
    return WorkforceAssignmentResponse(
        id=assignment.id,
        project_id=assignment.project_id,
        employee_id=assignment.employee_id,
        role_id=assignment.role_id,
        created_at=assignment.created_at,
    )


def write_audit_log(
    session: SessionDep,
    action: str,
    project_id: uuid.UUID,
    target_user_ids: list[uuid.UUID],
    performed_by: uuid.UUID,
    changes: dict[str, object],
) -> None:
    audit_log = AuditLog(
        action=action,
        project_id=project_id,
        target_user_ids=[str(user_id) for user_id in target_user_ids],
        performed_by=performed_by,
        changes=changes,
    )

    session.add(audit_log)


@router.post(
    "/project/{project_id}/workforce-allocate",
    response_model=WorkforcePostResponse,
    status_code=status.HTTP_201_CREATED,
)
def assign_workforce(
    project_id: uuid.UUID,
    data: list[WorkforceAssignmentRequest],
    session: SessionDep,
    current_user: CurrentUser,
):
    check_project_permission(session, project_id, current_user)

    if not data:
        raise HTTPException(status_code=400, detail="Request body cannot be empty")

    created_assignments: list[ProjectAssignment] = []

    for item in data:
        employee_id = get_user_employee_id(session, item.user_id)
        check_role_exists(session, item.role_id)

        existing_assignment = session.exec(
            select(ProjectAssignment).where(
                ProjectAssignment.project_id == project_id,
                ProjectAssignment.employee_id == employee_id,
            )
        ).first()

        if existing_assignment:
            raise HTTPException(
                status_code=409,
                detail=f"User is already assigned to this project: {item.user_id}",
            )

        assignment = ProjectAssignment(
            project_id=project_id,
            employee_id=employee_id,
            role_id=item.role_id,
        )

        session.add(assignment)
        created_assignments.append(assignment)
    
    write_audit_log(
        session=session,
        action="assign",
        project_id=project_id,
        target_user_ids=[item.user_id for item in data],
        performed_by=current_user.id,
        changes={
            "assigned": [
                {
                    "user_id": str(item.user_id),
                    "role_id": str(item.role_id),
                }
                for item in data
            ]
        },
)

    session.commit()

    for assignment in created_assignments:
        session.refresh(assignment)

    return WorkforcePostResponse(
        assigned=len(created_assignments),
        data=[to_assignment_response(assignment) for assignment in created_assignments],
    )


@router.patch(
    "/project/{project_id}/workforce-allocate",
    response_model=WorkforcePatchResponse,
)
def update_workforce_roles(
    project_id: uuid.UUID,
    data: list[WorkforceAssignmentRequest],
    session: SessionDep,
    current_user: CurrentUser,
):
    check_project_permission(session, project_id, current_user)

    if not data:
        raise HTTPException(status_code=400, detail="Request body cannot be empty")

    updated_assignments: list[ProjectAssignment] = []

    for item in data:
        employee_id = get_user_employee_id(session, item.user_id)
        check_role_exists(session, item.role_id)

        assignment = session.exec(
            select(ProjectAssignment).where(
                ProjectAssignment.project_id == project_id,
                ProjectAssignment.employee_id == employee_id,
            )
        ).first()

        if not assignment:
            raise HTTPException(
                status_code=404,
                detail=f"Existing assignment not found for user: {item.user_id}",
            )

        assignment.role_id = item.role_id
        session.add(assignment)
        updated_assignments.append(assignment)

    write_audit_log(
    session=session,
    action="update_role",
    project_id=project_id,
    target_user_ids=[item.user_id for item in data],
    performed_by=current_user.id,
    changes={
        "updated": [
            {
                "user_id": str(item.user_id),
                "new_role_id": str(item.role_id),
            }
            for item in data
        ]
    },
)

    session.commit()

    for assignment in updated_assignments:
        session.refresh(assignment)

    return WorkforcePatchResponse(
        updated=len(updated_assignments),
        data=[to_assignment_response(assignment) for assignment in updated_assignments],
    )


@router.delete(
    "/project/{project_id}/workforce-allocate",
    response_model=WorkforceDeleteResponse,
)
def remove_workforce(
    project_id: uuid.UUID,
    data: WorkforceDeleteRequest,
    session: SessionDep,
    current_user: CurrentUser,
):
    check_project_permission(session, project_id, current_user)

    if not data.user_ids:
        raise HTTPException(status_code=400, detail="user_ids cannot be empty")

    removed_count = 0

    for user_id in data.user_ids:
        employee_id = get_user_employee_id(session, user_id)

        assignment = session.exec(
            select(ProjectAssignment).where(
                ProjectAssignment.project_id == project_id,
                ProjectAssignment.employee_id == employee_id,
            )
        ).first()

        if not assignment:
            raise HTTPException(
                status_code=404,
                detail=f"Assignment not found for user: {user_id}",
            )

        session.delete(assignment)
        removed_count += 1

    write_audit_log(
    session=session,
    action="remove",
    project_id=project_id,
    target_user_ids=data.user_ids,
    performed_by=current_user.id,
    changes={
        "removed_user_ids": [str(user_id) for user_id in data.user_ids]
    },
)
    
    session.commit()

    return WorkforceDeleteResponse(
        removed=removed_count,
        message="Workforce allocation updated successfully",
    )

# ---- Igie -----