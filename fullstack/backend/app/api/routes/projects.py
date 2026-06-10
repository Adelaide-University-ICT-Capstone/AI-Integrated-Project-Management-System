from datetime import date, datetime
from typing import Any
import uuid

from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from fastapi import status as http_status
from sqlmodel import select

from app import crud
from app.crud.workforce_allocate import (
    get_assignment
)

from app.api.deps import CurrentUser, SessionDep, get_current_active_superuser, get_current_user
from app.api.routes.workforce_allocate import check_project_permission
from app.models import (
    Project,
    AssignmentWithRole,
    Employee,
    MaterialPublic,
    MaterialCreate,
    MaterialUpdate,
    MonthlyCountResponse,
    MonthlyInvoiceResponse,
    ProjectAssignment,
    ProjectDetailsResponse,
    ProjectDetailWithRoles,
    ProjectMilestonePublic,
    ProjectMilestoneTreeCreate,
    ProjectMilestoneUpdate,
    ProjectPublic,
    ProjectSummary,
    ProjectTaskManagementResponse,
    ProjectTaskPublic,
    ProjectTaskTreeCreate,
    ProjectTaskTreeUpdate,
    ProjectTasksPublic,
    ProjectUpdate,
    ProjectUpdateRequest,
    ProjectsListResponse,
    ProjectCreateRequest,
    ProjectCreateResponse,
    ProjectDetail,
    Message,
    Subcontractor,
    SubcontractorStatus
)

from app.api.routes.notifications import send_project_update_notification

router = APIRouter(
    prefix="/projects",
    tags=["projects"],
    dependencies=[Depends(get_current_user)],
)

# Authors: Leslie 
def check_project_view_permission(
    session: SessionDep,
    project_id: uuid.UUID,
    current_user: CurrentUser,
) -> Project:
    ''' Help check project view permission for project visibility, return project if has permission, otherwise raise 403 or 404 '''
    project = session.get(Project, project_id)

    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    if current_user.is_superuser:
        return project

    if not current_user.employee_id:
        raise HTTPException(status_code=403, detail="Project access denied")

    assignment = get_assignment(
        session=session,
        project_id=project_id,
        employee_id=current_user.employee_id,
    )

    if assignment:
        return project

    raise HTTPException(status_code=403, detail="Project access denied")



# Authors: Leslie 
def create_project(project: ProjectCreateRequest, session: SessionDep) -> ProjectCreateResponse:
    ''' Create a new project after validating job_number uniqueness, return the created project's id and a success message '''
    existing_project = crud.get_project_by_job_number(session=session, job_number=project.job_number)
    if existing_project:
        raise HTTPException(
            status_code=409,
            detail="A project with this job_number already exists",
        )
    
    created_project = crud.create_project(session=session, project_data=project)
    return ProjectCreateResponse(project_id=created_project.id, message="Project created successfully")


# Author: Leslie    
@router.get("", response_model=ProjectDetailsResponse)
def list_projects(
    session: SessionDep,
    current_user: CurrentUser,
    status: str | None = None,
) -> ProjectDetailsResponse:
    '''List projects with optional status filter, return project details and total count. Superusers see all projects, regular users see only assigned projects '''
    projects = crud.get_visible_projects(
        session=session,
        employee_id=current_user.employee_id if current_user.employee_id else None,
        is_superuser=current_user.is_superuser,
        status=status,
    )
    details = crud.build_project_details(session=session, projects=projects)
    return ProjectDetailsResponse(data=details, count=len(details))

# Authors: Leslie
@router.get("/{project_id}", response_model=ProjectDetail)
def get_project_by_id(session: SessionDep, project_id: uuid.UUID, current_user: CurrentUser) -> ProjectDetail:
    ''' Get project details by id, check view permission first, return 403 if no permission, 404 if not found '''
    check_project_view_permission(session, project_id, current_user)
    project = crud.get_project_by_id(session=session, project_id=project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return ProjectDetail(
        project_id=project.id,
        job_number=project.job_number,
        project_name=project.project_name,
        address=project.full_address,
        company_name=project.client.company_name if project.client else None,
        company_address=project.client.billing_address if project.client else None,
        client_name=project.client.client_name if project.client else None,
        status=project.current_status.status_name if project.current_status else None,
        current_status_id=project.current_status_id,
        start_date=project.start_date,
        due_date=project.due_date,
        days_elapsed=(date.today() - project.created_at.date()).days if project.created_at else None,
        completion_percent=crud.calculate_project_completion_percent(session=session, project=project),
        is_invoiced=crud.is_project_invoiced(session=session, project=project),
        project_tab=crud.get_project_tab(session=session, project=project),
        fee_estimate=project.fee_final,
    )

# Authors:
@router.get(
    "/due-date",
    response_model=ProjectDetailsResponse,
)
def get_projects_by_due_date(
    session: SessionDep,
    start: date,
    end: date,
) -> ProjectDetailsResponse:
    projects = crud.get_projects_by_due_date(session=session, start=start, end=end)
    details = crud.build_project_details(session=session, projects=projects)
    return ProjectDetailsResponse(data=details, count=len(details))


@router.get(
    "/tasks",
    response_model=ProjectTasksPublic,
)
def get_tasks(
    session: SessionDep,
    current_user: CurrentUser,
    status: str | None = None,
    start: date | None = None,
    end: date | None = None,
) -> ProjectTasksPublic:
    tasks = crud.get_tasks(
        session=session,
        status=status,
        start=start,
        end=end,
        employee_id=current_user.employee_id,
        filter_by_employee=not current_user.is_superuser,
    )
    return ProjectTasksPublic(
        data=[ProjectTaskPublic.model_validate(task) for task in tasks],
        count=len(tasks),
    )


@router.get(
    "/{project_id}/with-roles",
    response_model=ProjectDetailWithRoles,
)
def get_project_with_roles(session: SessionDep, current_user: CurrentUser, project_id: uuid.UUID) -> ProjectDetailWithRoles:
    check_project_view_permission(session, project_id, current_user)
    project = crud.get_project_by_id(session=session, project_id=project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    assignments: list[AssignmentWithRole] = []
    for assignment in project.assignments:
        if assignment.employee:
            full_name = (
                assignment.employee.full_name
                or f"{assignment.employee.first_name} {assignment.employee.last_name}".strip()
            )
            assignments.append(
                AssignmentWithRole(
                    employee_name=full_name,
                    role_name=assignment.role.role_name if assignment.role else None,
                    role_in_project=assignment.allocation_notes,
                )
            )

    return ProjectDetailWithRoles(
        project_id=project.id,
        job_number=project.job_number,
        project_name=project.project_name,
        contract_title=project.contract_title,
        agent=project.agent,
        job_title=project.job_title,
        address=project.full_address,
        company_name=project.client.company_name if project.client else None,
        company_address=project.client.billing_address if project.client else None,
        client_name=project.client.client_name if project.client else None,
        status=project.current_status.status_name if project.current_status else None,
        start_date=project.start_date,
        due_date=project.due_date,
        days_elapsed=(date.today() - project.created_at.date()).days if project.created_at else None,
        completion_percent=crud.calculate_project_completion_percent(session=session, project=project),
        is_invoiced=crud.is_project_invoiced(session=session, project=project),
        project_tab=crud.get_project_tab(session=session, project=project),
        assignments=assignments,
    )


@router.get(
    "/{project_id}/task-management",
    response_model=ProjectTaskManagementResponse,
)
def get_project_task_management(session: SessionDep, current_user: CurrentUser, project_id: uuid.UUID) -> ProjectTaskManagementResponse:
    check_project_view_permission(session, project_id, current_user)
    project = crud.get_project_by_id(session=session, project_id=project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    milestones = crud.get_project_task_management(
        session=session,
        project_id=project_id,
        employee_id=current_user.employee_id,
        filter_by_employee=not current_user.is_superuser,
    )
    return ProjectTaskManagementResponse(project_id=project_id, milestones=milestones)


@router.post(
    "/{project_id}/milestones",
    response_model=ProjectMilestonePublic,
    status_code=http_status.HTTP_201_CREATED,
)
def create_project_milestone(
    project_id: uuid.UUID,
    milestone: ProjectMilestoneTreeCreate,
    session: SessionDep,
    current_user: CurrentUser,
) -> ProjectMilestonePublic:
    check_project_permission(session, project_id, current_user)

    created = crud.create_project_milestone(
        session=session,
        project_id=project_id,
        milestone_data=milestone,
    )
    return ProjectMilestonePublic.model_validate(created)


@router.patch(
    "/{project_id}/milestones/{milestone_id}",
    response_model=ProjectMilestonePublic,
)
def update_project_milestone(
    project_id: uuid.UUID,
    milestone_id: uuid.UUID,
    milestone: ProjectMilestoneUpdate,
    session: SessionDep,
    current_user: CurrentUser,
) -> ProjectMilestonePublic:
    check_project_permission(session, project_id, current_user)

    existing = crud.get_project_milestone(session=session, milestone_id=milestone_id)
    if not existing or existing.project_id != project_id:
        raise HTTPException(status_code=404, detail="Milestone not found")

    updated = crud.update_project_milestone(
        session=session,
        milestone=existing,
        updates=milestone.model_dump(exclude_unset=True),
    )
    return ProjectMilestonePublic.model_validate(updated)


@router.delete(
    "/{project_id}/milestones/{milestone_id}",
    response_model=Message,
)
def delete_project_milestone(
    project_id: uuid.UUID,
    milestone_id: uuid.UUID,
    session: SessionDep,
    current_user: CurrentUser,
) -> Message:
    check_project_permission(session, project_id, current_user)

    existing = crud.get_project_milestone(session=session, milestone_id=milestone_id)
    if not existing or existing.project_id != project_id:
        raise HTTPException(status_code=404, detail="Milestone not found")

    crud.delete_project_milestone(session=session, milestone=existing)
    return Message(message="Milestone deleted successfully")


@router.post(
    "/{project_id}/milestones/{milestone_id}/tasks",
    response_model=ProjectTaskPublic,
    status_code=http_status.HTTP_201_CREATED,
)
def create_project_task(
    project_id: uuid.UUID,
    milestone_id: uuid.UUID,
    task: ProjectTaskTreeCreate,
    session: SessionDep,
    current_user: CurrentUser,
) -> ProjectTaskPublic:
    check_project_permission(session, project_id, current_user)

    milestone = crud.get_project_milestone(session=session, milestone_id=milestone_id)
    if not milestone or milestone.project_id != project_id:
        raise HTTPException(status_code=404, detail="Milestone not found")

    if task.parent_task_id:
        parent_task = crud.get_project_task(session=session, task_id=task.parent_task_id)
        if not parent_task or parent_task.milestone_id != milestone_id:
            raise HTTPException(status_code=400, detail="Parent task must belong to the same milestone")

    if task.assigned_employee_id:
        employee = session.get(Employee, task.assigned_employee_id)
        if not employee:
            raise HTTPException(status_code=404, detail="Assignee not found")
        in_project = session.exec(
            select(ProjectAssignment).where(
                ProjectAssignment.project_id == project_id,
                ProjectAssignment.employee_id == task.assigned_employee_id,
            )
        ).first()
        if not in_project:
            raise HTTPException(status_code=400, detail="Assignee is not a member of this project's workforce")

    created = crud.create_project_task(
        session=session,
        milestone_id=milestone_id,
        task_data=task,
    )
    return ProjectTaskPublic.model_validate(created)


@router.delete(
    "/{project_id}/milestones/{milestone_id}/tasks/{task_id}",
    response_model=Message,
)
def delete_project_task(
    project_id: uuid.UUID,
    milestone_id: uuid.UUID,
    task_id: uuid.UUID,
    session: SessionDep,
    current_user: CurrentUser,
) -> Message:
    check_project_permission(session, project_id, current_user)

    milestone = crud.get_project_milestone(session=session, milestone_id=milestone_id)
    if not milestone or milestone.project_id != project_id:
        raise HTTPException(status_code=404, detail="Milestone not found")

    existing = crud.get_project_task(session=session, task_id=task_id)
    if not existing or existing.milestone_id != milestone_id:
        raise HTTPException(status_code=404, detail="Task not found")

    crud.delete_project_task(session=session, task=existing)
    return Message(message="Task deleted successfully")


@router.patch(
    "/{project_id}/tasks/{task_id}",
    response_model=ProjectTaskPublic,
)
def update_project_task(
    project_id: uuid.UUID,
    task_id: uuid.UUID,
    task: ProjectTaskTreeUpdate,
    session: SessionDep,
    current_user: CurrentUser,
) -> ProjectTaskPublic:
    check_project_view_permission(session, project_id, current_user)

    existing = crud.get_project_task(session=session, task_id=task_id)
    if not existing:
        raise HTTPException(status_code=404, detail="Task not found")

    milestone = crud.get_project_milestone(session=session, milestone_id=existing.milestone_id)
    if not milestone or milestone.project_id != project_id:
        raise HTTPException(status_code=404, detail="Task not found")

    if task.parent_task_id:
        parent_task = crud.get_project_task(session=session, task_id=task.parent_task_id)
        if not parent_task or parent_task.milestone_id != existing.milestone_id:
            raise HTTPException(status_code=400, detail="Parent task must belong to the same milestone")
        if parent_task.id == existing.id:
            raise HTTPException(status_code=400, detail="Task cannot be its own parent")

    if task.assigned_employee_id:
        employee = session.get(Employee, task.assigned_employee_id)
        if not employee:
            raise HTTPException(status_code=404, detail="Assignee not found")
        in_project = session.exec(
            select(ProjectAssignment).where(
                ProjectAssignment.project_id == project_id,
                ProjectAssignment.employee_id == task.assigned_employee_id,
            )
        ).first()
        if not in_project:
            raise HTTPException(status_code=400, detail="Assignee is not a member of this project's workforce")

    updated = crud.update_project_task(
        session=session,
        task=existing,
        updates=task.model_dump(exclude_unset=True),
    )
    return ProjectTaskPublic.model_validate(updated)


# Authors: Leslie
@router.delete("/{project_id}")
def delete_project(project_id: uuid.UUID, current_user: CurrentUser, session: SessionDep):
    ''' Check project delete permission and delete the project if exists, otherwise raise 403 or 404 '''
    check_project_permission(session, project_id, current_user)
    if not crud.delete_project(session=session, project_id=project_id):
        raise HTTPException(status_code=http_status.HTTP_404_NOT_FOUND, detail="Project not found")
    return {"message": "Project deleted successfully"}

# Authors: Leslie
@router.delete("")
def delete_all_projects(session: SessionDep, current_user: CurrentUser):
    ''' Only superusers can delete all projects, return the count of deleted projects '''
    if not current_user.is_superuser:
        raise HTTPException(status_code=403, detail="Only superusers can delete all projects")
    count = crud.delete_all_projects(session=session)
    return {"message": f"Successfully deleted {count} projects"}


# Authors: Leslie, Jerry
# ... Leslie: update project endpoint to check view permission if only updating status, otherwise check edit permission
# ... Jerry: check if status is changed and send notification to assigned workforce
@router.patch("/{project_id}", response_model=ProjectPublic)
def update_project(
    project_id: uuid.UUID,
    project: ProjectUpdateRequest,
    session: SessionDep,
    current_user: CurrentUser,
    background_tasks: BackgroundTasks,
) -> ProjectPublic:
    '''' Update project with provided fields, check permissions based on whether status is being updated, send notification if status changed '''
    update_data = project.model_dump(exclude_unset=True)
    
    # if only updating status, check view permission, otherwise check edit permission
    if set(update_data) <= {"current_status_id"}:
        check_project_view_permission(session, project_id, current_user)
    else:
        check_project_permission(session, project_id, current_user)

    existing = crud.get_project_by_id(session=session, project_id=project_id)
    if not existing:
        raise HTTPException(status_code=http_status.HTTP_404_NOT_FOUND, detail="Project not found")
    
    old_status_id = existing.current_status_id

    try:    
        updated = crud.update_project(session=session, project=existing, updates=update_data)
        
        # Check if status changed and send notification to assigned workforce
        if project.current_status_id and project.current_status_id != old_status_id:
            send_project_update_notification(
                db=session,
                background_tasks=background_tasks,
                project_name=existing.project_name,
                job_number=existing.job_number,
                project_id=project_id
            )

    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc))

    return ProjectPublic.model_validate(updated)


@router.get("/{project_id}/materials/{material_id}", response_model=MaterialPublic)
def get_material(
    project_id: uuid.UUID,
    material_id: uuid.UUID,
    session: SessionDep,
    current_user: CurrentUser,
) -> MaterialPublic:
    
    check_project_view_permission(session, project_id, current_user)
    project = crud.get_project_by_id(session=session, project_id=project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    material = crud.get_material(session=session, material_id=material_id)
    if not material or material.project_id != project_id:
        raise HTTPException(status_code=404, detail="Material not found")

    return MaterialPublic.model_validate(material)

@router.get("/{project_id}/materials", response_model=list[MaterialPublic], status_code=http_status.HTTP_200_OK)
def get_materials_from_project(project_id: uuid.UUID, session: SessionDep, current_user: CurrentUser) -> list[MaterialPublic]:
    check_project_view_permission(session, project_id, current_user)
    project = crud.get_project_by_id(session=session, project_id=project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    materials = crud.get_materials_by_project_id(session=session, project_id=project_id)
    return [MaterialPublic.model_validate(material) for material in materials]

@router.post("/{project_id}/materials", response_model=MaterialPublic, status_code=http_status.HTTP_201_CREATED)
def create_material_for_project(project_id: uuid.UUID, material: MaterialCreate, session: SessionDep, current_user: CurrentUser) -> MaterialPublic:
    check_project_view_permission(session, project_id, current_user)
    # Add validation for subcontractor_id if provided
    if material.subcontractor_id and not session.get(Subcontractor, material.subcontractor_id):
        raise HTTPException(status_code=404, detail="Subcontractor not found")
    created = crud.create_material(session=session, project_id=project_id, material_data=material)
    return MaterialPublic.model_validate(created)

@router.patch("/{project_id}/materials/{material_id}", response_model=MaterialPublic)
def update_material_for_project(project_id: uuid.UUID, material_id: uuid.UUID, material: MaterialUpdate, session: SessionDep, current_user: CurrentUser) -> MaterialPublic:
    check_project_view_permission(session, project_id, current_user)
    # Add validation for subcontractor_id if provided
    available_statuses = crud.get_material_statuses(session=session)
    if material.status and material.status not in available_statuses:
        raise HTTPException(status_code=400, detail="Please choose a valid material status: " + ", ".join(available_statuses))

    if material.subcontractor_id and not session.get(Subcontractor, material.subcontractor_id):
        raise HTTPException(status_code=404, detail="Subcontractor not found")
    
    existing = crud.get_material(session=session, material_id=material_id)  # Assuming you add this
    updated = crud.update_material(session=session, material=existing, updates=material.model_dump(exclude_unset=True))
    return MaterialPublic.model_validate(updated)


@router.delete("/{project_id}/materials/{material_id}", response_model=Message)
def delete_material_from_project(project_id: uuid.UUID, material_id: uuid.UUID, session: SessionDep, current_user: CurrentUser) -> Message:
    check_project_view_permission(session, project_id, current_user)
    project = crud.get_project_by_id(session=session, project_id=project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found") 
    material = crud.get_material(session=session, material_id=material_id)
    if not material or material.project_id != project_id:
        raise HTTPException(status_code=404, detail="Material not found")
    crud.delete_material(session=session, material=material)
    return Message(message="Material deleted successfully")

# --------------------------------


@router.get(
    "/all-project",
    dependencies=[Depends(get_current_active_superuser)],
    response_model=ProjectsListResponse,
)
def get_all_active_projects(session: SessionDep) -> Any:
    projects = crud.get_all_active_projects(session=session)
    summaries = crud.build_project_summaries(session=session, projects=projects)
    return ProjectsListResponse(data=summaries, count=len(summaries))


@router.get(
    "/delay-project",
    dependencies=[Depends(get_current_active_superuser)],
    response_model=ProjectsListResponse,
)
def get_delayed_projects(session: SessionDep) -> Any:
    projects = crud.get_delayed_projects(session=session)
    summaries = crud.build_project_summaries(session=session, projects=projects)
    return ProjectsListResponse(data=summaries, count=len(summaries))


@router.get(
    "/current-project-num",
    dependencies=[Depends(get_current_active_superuser)],
    response_model=MonthlyCountResponse,
)
def get_current_project_count(session: SessionDep) -> Any:
    today = date.today()
    cur_start, cur_end = crud.month_bounds(today.year, today.month)
    prev_start, prev_end = crud.month_bounds(*crud.prev_month(today.year, today.month))
    return MonthlyCountResponse(
        current_month=crud.count_active_projects(session=session, start=cur_start, end=cur_end),
        previous_month=crud.count_active_projects(session=session, start=prev_start, end=prev_end),
    )


@router.get(
    "/completed-project",
    dependencies=[Depends(get_current_active_superuser)],
    response_model=MonthlyCountResponse,
)
def get_completed_project_count(session: SessionDep) -> Any:
    today = date.today()
    cur_start, cur_end = crud.month_bounds(today.year, today.month)
    prev_start, prev_end = crud.month_bounds(*crud.prev_month(today.year, today.month))
    return MonthlyCountResponse(
        current_month=crud.count_completed_projects(session=session, start=cur_start, end=cur_end),
        previous_month=crud.count_completed_projects(session=session, start=prev_start, end=prev_end),
    )


@router.get(
    "/invoice-bill",
    dependencies=[Depends(get_current_active_superuser)],
    response_model=MonthlyInvoiceResponse,
)
def get_invoice_bill(session: SessionDep) -> Any:
    today = date.today()
    cur_start, cur_end = crud.month_bounds(today.year, today.month)
    prev_start, prev_end = crud.month_bounds(*crud.prev_month(today.year, today.month))
    return MonthlyInvoiceResponse(
        current_month_total=crud.sum_invoices(session=session, start=cur_start, end=cur_end),
        previous_month_total=crud.sum_invoices(session=session, start=prev_start, end=prev_end),
    )


@router.get("/overdue", response_model=ProjectDetailsResponse)
def get_overdue_projects(session: SessionDep) -> Any:
    projects = crud.get_overdue_projects(session=session)
    details = crud.build_project_details(session=session, projects=projects)
    return ProjectDetailsResponse(data=details, count=len(details))


@router.get("/expected-to-finish/{date_str}", response_model=ProjectDetailsResponse)
def get_projects_expected_to_finish(session: SessionDep, date_str: str) -> Any:
    try:
        due_by = datetime.strptime(date_str, "%d-%m-%Y").date()
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid date format. Use dd-mm-yyyy")
    projects = crud.get_projects_expected_by_date(session=session, due_by=due_by)
    details = crud.build_project_details(session=session, projects=projects)
    return ProjectDetailsResponse(data=details, count=len(details))




