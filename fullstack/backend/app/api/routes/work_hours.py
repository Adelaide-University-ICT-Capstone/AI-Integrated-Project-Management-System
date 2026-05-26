# --------------------------------------------------------------------------- Igie
# Work Hours Routes
# Allows admin/superuser users to add, update, remove, and view employee
# project work hours. Analytics dashboard reads totals from time_logs.

import uuid
from datetime import date, timedelta
from decimal import Decimal

from fastapi import APIRouter, HTTPException
from sqlmodel import func, select

from app.api.deps import CurrentUser, SessionDep
from app.models import (
    Employee,
    EmployeeHoursSummary,
    ProjectAssignment,
    ProjectHoursAnalyticsResponse,
    ProjectWorkHoursResponse,
    Role,
    TimeLog,
    WorkHoursUpsert,
)

router = APIRouter(prefix="/project", tags=["work-hours"])


def check_work_hours_permission(current_user: CurrentUser) -> None:
    """Only SUPERUSER or admin accounts can manage project work hours."""
    if current_user.is_superuser:
        return

    if current_user.full_name and "admin" in current_user.full_name.lower():
        return

    raise HTTPException(
        status_code=403,
        detail="Only admin or superuser accounts can manage project work hours.",
    )


def get_week_start(work_date: date) -> date:
    """Return Monday of the selected week."""
    return work_date - timedelta(days=work_date.weekday())


def get_existing_time_log(
    *,
    session: SessionDep,
    project_id: uuid.UUID,
    employee_id: uuid.UUID,
    work_date: date,
    task_id: uuid.UUID | None,
) -> TimeLog | None:
    """Find an existing time log for the same project, employee, date, and optional task."""
    query = select(TimeLog).where(
        TimeLog.project_id == project_id,
        TimeLog.employee_id == employee_id,
        TimeLog.log_date == work_date,
    )

    if task_id is None:
        query = query.where(TimeLog.task_id.is_(None))
    else:
        query = query.where(TimeLog.task_id == task_id)

    return session.exec(query).first()


def check_employee_assigned_to_project(
    *,
    session: SessionDep,
    project_id: uuid.UUID,
    employee_id: uuid.UUID,
) -> None:
    """Make sure hours are only recorded for employees assigned to the project."""
    assignment = session.exec(
        select(ProjectAssignment).where(
            ProjectAssignment.project_id == project_id,
            ProjectAssignment.employee_id == employee_id,
        )
    ).first()

    if not assignment:
        raise HTTPException(
            status_code=404,
            detail="Employee is not assigned to this project.",
        )


@router.post("/{project_id}/work-hours/add", response_model=ProjectWorkHoursResponse)
def add_project_work_hours(
    *,
    session: SessionDep,
    current_user: CurrentUser,
    project_id: uuid.UUID,
    payload: WorkHoursUpsert,
) -> ProjectWorkHoursResponse:
    """
    Add hours to an employee's existing daily project hours.
    If no time log exists, create a new one.
    """

    check_work_hours_permission(current_user)
    check_employee_assigned_to_project(
        session=session,
        project_id=project_id,
        employee_id=payload.employee_id,
    )

    existing_log = get_existing_time_log(
        session=session,
        project_id=project_id,
        employee_id=payload.employee_id,
        work_date=payload.work_date,
        task_id=payload.task_id,
    )

    if existing_log:
        existing_log.hours_worked = existing_log.hours_worked + payload.hours_worked
        existing_log.description = payload.description or existing_log.description
        session.add(existing_log)
        session.commit()
        session.refresh(existing_log)

        return ProjectWorkHoursResponse(
            id=existing_log.id,
            project_id=existing_log.project_id,
            employee_id=existing_log.employee_id,
            task_id=existing_log.task_id,
            work_date=existing_log.log_date,
            hours_worked=existing_log.hours_worked,
            message="Work hours added to existing total successfully.",
        )

    new_log = TimeLog(
        project_id=project_id,
        employee_id=payload.employee_id,
        task_id=payload.task_id,
        log_date=payload.work_date,
        hours_worked=payload.hours_worked,
        description=payload.description,
    )

    session.add(new_log)
    session.commit()
    session.refresh(new_log)

    return ProjectWorkHoursResponse(
        id=new_log.id,
        project_id=new_log.project_id,
        employee_id=new_log.employee_id,
        task_id=new_log.task_id,
        work_date=new_log.log_date,
        hours_worked=new_log.hours_worked,
        message="Work hours added successfully.",
    )


@router.patch("/{project_id}/work-hours/update", response_model=ProjectWorkHoursResponse)
def update_project_work_hours(
    *,
    session: SessionDep,
    current_user: CurrentUser,
    project_id: uuid.UUID,
    payload: WorkHoursUpsert,
) -> ProjectWorkHoursResponse:
    """
    Replace an employee's existing daily project hours.
    This does not add on top; it overwrites the matching time log.
    """

    check_work_hours_permission(current_user)
    check_employee_assigned_to_project(
        session=session,
        project_id=project_id,
        employee_id=payload.employee_id,
    )

    existing_log = get_existing_time_log(
        session=session,
        project_id=project_id,
        employee_id=payload.employee_id,
        work_date=payload.work_date,
        task_id=payload.task_id,
    )

    if not existing_log:
        raise HTTPException(
            status_code=404,
            detail="No work hours found for this employee on the selected date.",
        )

    existing_log.hours_worked = payload.hours_worked
    existing_log.description = payload.description
    session.add(existing_log)
    session.commit()
    session.refresh(existing_log)

    return ProjectWorkHoursResponse(
        id=existing_log.id,
        project_id=existing_log.project_id,
        employee_id=existing_log.employee_id,
        task_id=existing_log.task_id,
        work_date=existing_log.log_date,
        hours_worked=existing_log.hours_worked,
        message="Work hours updated successfully.",
    )


@router.delete("/{project_id}/work-hours/remove", response_model=dict)
def remove_project_work_hours(
    *,
    session: SessionDep,
    current_user: CurrentUser,
    project_id: uuid.UUID,
    employee_id: uuid.UUID,
    work_date: date,
    task_id: uuid.UUID | None = None,
) -> dict:
    """Remove an employee's work-hour entry for a project/date/task."""

    check_work_hours_permission(current_user)
    check_employee_assigned_to_project(
        session=session,
        project_id=project_id,
        employee_id=employee_id,
    )

    existing_log = get_existing_time_log(
        session=session,
        project_id=project_id,
        employee_id=employee_id,
        work_date=work_date,
        task_id=task_id,
    )

    if not existing_log:
        raise HTTPException(
            status_code=404,
            detail="No work hours found for this employee on the selected date.",
        )

    session.delete(existing_log)
    session.commit()

    return {
        "message": "Work hours removed successfully.",
        "project_id": str(project_id),
        "employee_id": str(employee_id),
        "work_date": str(work_date),
    }


@router.get("/{project_id}/work-hours/analytics", response_model=ProjectHoursAnalyticsResponse)
def get_project_work_hours_analytics(
    *,
    session: SessionDep,
    current_user: CurrentUser,
    project_id: uuid.UUID,
    selected_date: date,
) -> ProjectHoursAnalyticsResponse:
    """
    Return total work hours per employee for the selected day,
    selected week, and selected month.
    Used by the analytics dashboard.
    """

    week_start = get_week_start(selected_date)
    week_end = week_start + timedelta(days=7)

    month_start = selected_date.replace(day=1)

    if selected_date.month == 12:
        month_end = selected_date.replace(year=selected_date.year + 1, month=1, day=1)
    else:
        month_end = selected_date.replace(month=selected_date.month + 1, day=1)

    assignments = session.exec(
        select(ProjectAssignment, Employee, Role)
        .join(Employee, ProjectAssignment.employee_id == Employee.id)
        .join(Role, ProjectAssignment.role_id == Role.id, isouter=True)
        .where(ProjectAssignment.project_id == project_id)
    ).all()

    results: list[EmployeeHoursSummary] = []

    for assignment, employee, role in assignments:
        day_hours = session.exec(
            select(func.coalesce(func.sum(TimeLog.hours_worked), 0)).where(
                TimeLog.project_id == project_id,
                TimeLog.employee_id == employee.id,
                TimeLog.log_date == selected_date,
            )
        ).one_or_none() or Decimal("0.00")

        week_hours = session.exec(
            select(func.coalesce(func.sum(TimeLog.hours_worked), 0)).where(
                TimeLog.project_id == project_id,
                TimeLog.employee_id == employee.id,
                TimeLog.log_date >= week_start,
                TimeLog.log_date < week_end,
            )
        ).one_or_none() or Decimal("0.00")

        month_hours = session.exec(
            select(func.coalesce(func.sum(TimeLog.hours_worked), 0)).where(
                TimeLog.project_id == project_id,
                TimeLog.employee_id == employee.id,
                TimeLog.log_date >= month_start,
                TimeLog.log_date < month_end,
            )
        ).one_or_none() or Decimal("0.00")

        results.append(
            EmployeeHoursSummary(
                employee_id=employee.id,
                employee_name=employee.full_name
                or f"{employee.first_name} {employee.last_name}",
                role_name=role.role_name if role else None,
                day_hours=Decimal(day_hours),
                week_hours=Decimal(week_hours),
                month_hours=Decimal(month_hours),
            )
        )

    return ProjectHoursAnalyticsResponse(
        project_id=project_id,
        data=results,
        count=len(results),
    )

# --------------------------------------------------------------------------- Igie