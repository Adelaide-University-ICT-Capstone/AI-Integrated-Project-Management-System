from datetime import date
from decimal import Decimal

from fastapi.testclient import TestClient
from sqlmodel import Session, select

from app import crud
from app.models import (
    Client,
    Employee,
    Invoice,
    Project,
    ProjectAssignment,
    ProjectMilestone,
    ProjectStatusType,
    ProjectTask,
    Role,
    User,
    UserCreate,
)
from tests.utils.user import user_authentication_headers
from tests.utils.utils import random_lower_string


def test_projects_require_authentication(client: TestClient) -> None:
    response = client.get("/api/v1/projects")

    assert response.status_code == 401


def get_prelim_status(db: Session) -> ProjectStatusType:
    status = db.exec(
        select(ProjectStatusType).where(ProjectStatusType.status_name == "prelim")
    ).first()
    assert status is not None
    return status

# ------------------------- Start Leslie's Testing ------------------ # 
# Test project's create/read/update/delete operations 
def create_employee_user(
    *,
    client: TestClient,
    db: Session,
    email_prefix: str,
) -> tuple[Employee, dict[str, str]]:
    ''' Create employee for testing '''
    marker = random_lower_string()[:8]
    employee = Employee(
        first_name=email_prefix.title(),
        last_name="User",
        full_name=f"{email_prefix.title()} User",
        email=f"{email_prefix}-employee-{marker}@example.com",
    )
    db.add(employee)
    db.commit()
    db.refresh(employee)

    password = f"Password-{marker}"
    user = crud.create_user(
        session=db,
        user_create=UserCreate(
            email=f"{email_prefix}-{marker}@example.com",
            password=password,
        ),
    )
    user.employee_id = employee.id
    db.add(user)
    db.commit()

    headers = user_authentication_headers(
        client=client,
        email=user.email,
        password=password,
    )
    return employee, headers


def create_project_role(db: Session, role_name: str) -> Role:
    role = db.exec(select(Role).where(Role.role_name == role_name)).first()
    if role:
        return role

    role = Role(
        role_name=role_name,
        description=f"{role_name} test role",
        is_active=True,
    )
    db.add(role)
    db.commit()
    db.refresh(role)
    return role


def create_project_status(db: Session, status_name: str) -> ProjectStatusType:
    status = db.exec(
        select(ProjectStatusType).where(ProjectStatusType.status_name == status_name)
    ).first()
    if status:
        return status

    return crud.create_status_type(session=db, status_name=status_name)


def create_project_record(
    *,
    db: Session,
    name: str,
    job_prefix: str,
) -> Project:
    client_row = Client(
        client_name=f"{name} Client {random_lower_string()[:8]}",
        company_name=f"{name} Company",
        billing_address=f"{name} Billing Address",
    )
    db.add(client_row)
    db.commit()
    db.refresh(client_row)

    status = get_prelim_status(db)
    project = Project(
        job_number=f"{job_prefix}-{random_lower_string()[:8]}",
        client_id=client_row.id,
        current_status_id=status.id,
        project_name=name,
        start_date=date(2026, 7, 1),
        due_date=date(2026, 8, 1),
        is_active=True,
    )
    db.add(project)
    db.commit()
    db.refresh(project)
    return project


def project_create_payload(job_number: str, project_name: str) -> dict[str, str]:
    return {
        "job_number": job_number,
        "project_types": "civil",
        "project_name": project_name,
        "client_name": "CRUD Client",
        "client_company": "CRUD Company",
        "client_contact": "crud@example.com",
        "client_address": "10 CRUD Street",
        "address": "20 Project Road",
        "fee_estimate": "1250.00",
        "date_received": "2026-07-01",
        "start_date": "2026-07-02",
        "due_date": "2026-08-01",
    }


def test_project_create_read_update_delete(
    client: TestClient, superuser_token_headers: dict[str, str], db: Session
) -> None:
    get_prelim_status(db)
    job_number = f"JOB-CRUD-{random_lower_string()[:8]}"

    create_response = client.post(
        "/api/v1/projects",
        headers=superuser_token_headers,
        json=project_create_payload(job_number, "CRUD Project"),
    )

    assert create_response.status_code == 200
    project_id = create_response.json()["project_id"]
    assert create_response.json()["message"] == "Project created successfully"

    read_response = client.get(
        f"/api/v1/projects/{project_id}",
        headers=superuser_token_headers,
    )
    assert read_response.status_code == 200
    read_payload = read_response.json()
    assert read_payload["job_number"] == job_number
    assert read_payload["project_name"] == "CRUD Project"
    assert read_payload["company_name"] == "CRUD Company"
    assert read_payload["client_name"] == "CRUD Client"

    update_response = client.patch(
        f"/api/v1/projects/{project_id}",
        headers=superuser_token_headers,
        json={
            "project_name": "CRUD Project Updated",
            "client_name": "Updated CRUD Client",
            "client_company": "Updated CRUD Company",
            "address": "30 Updated Road",
            "fee_estimate": "2500.00",
        },
    )
    assert update_response.status_code == 200
    update_payload = update_response.json()
    assert update_payload["id"] == project_id
    assert update_payload["project_name"] == "CRUD Project Updated"
    assert update_payload["full_address"] == "30 Updated Road"
    assert update_payload["fee_final"] == "2500.00"

    updated_project = db.get(Project, project_id)
    assert updated_project is not None
    assert updated_project.client is not None
    assert updated_project.client.client_name == "Updated CRUD Client"
    assert updated_project.client.company_name == "Updated CRUD Company"

    delete_response = client.delete(
        f"/api/v1/projects/{project_id}",
        headers=superuser_token_headers,
    )
    assert delete_response.status_code == 200
    assert delete_response.json()["message"] == "Project deleted successfully"

    missing_response = client.get(
        f"/api/v1/projects/{project_id}",
        headers=superuser_token_headers,
    )
    assert missing_response.status_code == 404


def test_project_visibility_and_operations_are_restricted_to_admins_and_project_managers(
    client: TestClient, superuser_token_headers: dict[str, str], db: Session
) -> None:
    member, member_headers = create_employee_user(
        client=client,
        db=db,
        email_prefix="project-member",
    )
    manager, manager_headers = create_employee_user(
        client=client,
        db=db,
        email_prefix="project-manager",
    )
    outsider, outsider_headers = create_employee_user(
        client=client,
        db=db,
        email_prefix="project-outsider",
    )
    assert outsider.id

    engineer_role = create_project_role(db, f"engineer-{random_lower_string()[:8]}")
    manager_role = create_project_role(db, "project_manager")
    member_status = create_project_status(
        db,
        f"member-status-{random_lower_string()[:8]}",
    )
    visible_project = create_project_record(
        db=db,
        name="Visible Restricted Project",
        job_prefix="JOB-VISIBLE",
    )
    hidden_project = create_project_record(
        db=db,
        name="Hidden Restricted Project",
        job_prefix="JOB-HIDDEN",
    )

    db.add(
        ProjectAssignment(
            project_id=visible_project.id,
            employee_id=member.id,
            role_id=engineer_role.id,
        )
    )
    db.add(
        ProjectAssignment(
            project_id=visible_project.id,
            employee_id=manager.id,
            role_id=manager_role.id,
        )
    )
    db.commit()

    member_list_response = client.get("/api/v1/projects", headers=member_headers)
    assert member_list_response.status_code == 200
    member_project_ids = {
        row["project_id"] for row in member_list_response.json()["data"]
    }
    assert str(visible_project.id) in member_project_ids
    assert str(hidden_project.id) not in member_project_ids

    member_read_response = client.get(
        f"/api/v1/projects/{visible_project.id}",
        headers=member_headers,
    )
    assert member_read_response.status_code == 200
    assert member_read_response.json()["project_id"] == str(visible_project.id)

    member_hidden_response = client.get(
        f"/api/v1/projects/{hidden_project.id}",
        headers=member_headers,
    )
    assert member_hidden_response.status_code == 403

    outsider_list_response = client.get("/api/v1/projects", headers=outsider_headers)
    assert outsider_list_response.status_code == 200
    outsider_project_ids = {
        row["project_id"] for row in outsider_list_response.json()["data"]
    }
    assert str(visible_project.id) not in outsider_project_ids
    assert str(hidden_project.id) not in outsider_project_ids

    outsider_read_response = client.get(
        f"/api/v1/projects/{visible_project.id}",
        headers=outsider_headers,
    )
    assert outsider_read_response.status_code == 403

    member_update_response = client.patch(
        f"/api/v1/projects/{visible_project.id}",
        headers=member_headers,
        json={"project_name": "Member Should Not Update"},
    )
    assert member_update_response.status_code == 403
    db.refresh(visible_project)
    assert visible_project.project_name == "Visible Restricted Project"

    member_status_response = client.patch(
        f"/api/v1/projects/{visible_project.id}",
        headers=member_headers,
        json={"current_status_id": str(member_status.id)},
    )
    assert member_status_response.status_code == 200
    assert member_status_response.json()["current_status_id"] == str(member_status.id)

    member_mixed_update_response = client.patch(
        f"/api/v1/projects/{visible_project.id}",
        headers=member_headers,
        json={
            "project_name": "Member Should Not Update Metadata With Status",
            "current_status_id": str(member_status.id),
        },
    )
    assert member_mixed_update_response.status_code == 403
    db.refresh(visible_project)
    assert visible_project.project_name == "Visible Restricted Project"
    assert visible_project.current_status_id == member_status.id

    outsider_update_response = client.patch(
        f"/api/v1/projects/{visible_project.id}",
        headers=outsider_headers,
        json={"project_name": "Outsider Should Not Update"},
    )
    assert outsider_update_response.status_code == 403

    outsider_status_response = client.patch(
        f"/api/v1/projects/{visible_project.id}",
        headers=outsider_headers,
        json={"current_status_id": str(member_status.id)},
    )
    assert outsider_status_response.status_code == 403

    manager_update_response = client.patch(
        f"/api/v1/projects/{visible_project.id}",
        headers=manager_headers,
        json={"project_name": "Manager Updated Project"},
    )
    assert manager_update_response.status_code == 200
    assert manager_update_response.json()["project_name"] == "Manager Updated Project"

    admin_hidden_response = client.get(
        f"/api/v1/projects/{hidden_project.id}",
        headers=superuser_token_headers,
    )
    assert admin_hidden_response.status_code == 200

    admin_update_response = client.patch(
        f"/api/v1/projects/{hidden_project.id}",
        headers=superuser_token_headers,
        json={"project_name": "Admin Updated Hidden Project"},
    )
    assert admin_update_response.status_code == 200
    assert admin_update_response.json()["project_name"] == "Admin Updated Hidden Project"

    member_delete_response = client.delete(
        f"/api/v1/projects/{visible_project.id}",
        headers=member_headers,
    )
    assert member_delete_response.status_code == 403

    manager_delete_response = client.delete(
        f"/api/v1/projects/{visible_project.id}",
        headers=manager_headers,
    )
    assert manager_delete_response.status_code == 200

    admin_delete_response = client.delete(
        f"/api/v1/projects/{hidden_project.id}",
        headers=superuser_token_headers,
    )
    assert admin_delete_response.status_code == 200
# --------------------- End Leslie's testing -------------------- # 

def test_get_project_with_roles(
    client: TestClient, superuser_token_headers: dict[str, str], db: Session
) -> None:
    role_name = f"Project Engineer {random_lower_string()[:8]}"
    job_number = f"JOB-ROLES-{random_lower_string()[:8]}"
    role = Role(role_name=role_name, description="Engineer role", is_active=True)
    db.add(role)
    db.commit()
    db.refresh(role)

    employee = Employee(
        first_name="Alice",
        last_name="Nguyen",
        full_name="Alice Nguyen",
        role_id=role.id,
        is_active=True,
    )
    db.add(employee)
    db.commit()
    db.refresh(employee)

    client_row = Client(
        client_name="Test Client",
        company_name="Test Company",
        billing_address="123 Test Street",
    )
    db.add(client_row)
    db.commit()
    db.refresh(client_row)

    status = get_prelim_status(db)

    project = Project(
        job_number=job_number,
        client_id=client_row.id,
        current_status_id=status.id,
        project_name="Metadata with Roles",
        start_date=date.today(),
        due_date=date.today(),
        is_active=True,
    )
    db.add(project)
    db.commit()
    db.refresh(project)

    assignment = ProjectAssignment(
        project_id=project.id,
        employee_id=employee.id,
        allocation_notes="Project Manager",
    )
    db.add(assignment)
    db.commit()

    response = client.get(
        f"/api/v1/projects/{project.id}/with-roles",
        headers=superuser_token_headers,
    )

    assert response.status_code == 200
    payload = response.json()
    assert payload["project_id"] == str(project.id)
    assert payload["job_number"] == job_number
    assert payload["company_name"] == "Test Company"
    assert payload["company_address"] == "123 Test Street"
    assert payload["client_name"] == "Test Client"
    assert payload["status"] == "prelim"
    assert len(payload["assignments"]) == 1
    assert payload["assignments"][0]["employee_name"] == "Alice Nguyen"
    assert payload["assignments"][0]["role_name"] == role_name
    assert payload["assignments"][0]["role_in_project"] == "Project Manager"


def test_create_project_creates_default_milestones_without_tasks(
    client: TestClient, superuser_token_headers: dict[str, str], db: Session
) -> None:
    job_number = f"JOB-TASK-{random_lower_string()[:8]}"
    get_prelim_status(db)

    response = client.post(
        "/api/v1/projects",
        headers=superuser_token_headers,
        json={
            "job_number": job_number,
            "project_types": "civil",
            "project_name": "Task Management Project",
            "client_name": "Task Client",
            "client_company": "Task Company",
            "client_contact": "task@example.com",
            "client_address": "10 Task Street",
            "fee_estimate": "12.50",
            "date_received": str(date(2026, 5, 1)),
            "start_date": str(date(2026, 5, 2)),
            "due_date": str(date(2026, 6, 1)),
            "preliminary_due_date": str(date(2026, 5, 15)),
            "design_due_date": str(date(2026, 6, 1)),
        },
    )

    assert response.status_code == 200
    project_id = response.json()["project_id"]

    task_response = client.get(
        f"/api/v1/projects/{project_id}/task-management",
        headers=superuser_token_headers,
    )

    assert task_response.status_code == 200
    payload = task_response.json()
    assert payload["project_id"] == project_id
    assert len(payload["milestones"]) == 2
    assert payload["milestones"][0]["milestone_name"] == "Preliminary Design & Documentation"
    assert payload["milestones"][0]["due_date"] == "2026-05-15"
    assert payload["milestones"][1]["milestone_name"] == "Design & Documentation"
    assert payload["milestones"][1]["due_date"] == "2026-06-01"
    assert payload["milestones"][0]["tasks"] == []
    assert payload["milestones"][1]["tasks"] == []
    materials_response = client.get(
        f"/api/v1/projects/{project_id}/materials",
        headers=superuser_token_headers,
    )
    assert materials_response.status_code == 200
    assert [material["name"] for material in materials_response.json()] == [
        "Soil Testing",
        "Survey",
        "Timber Framing",
    ]
    detail_response = client.get(
        f"/api/v1/projects/{project_id}",
        headers=superuser_token_headers,
    )
    assert detail_response.status_code == 200
    detail_payload = detail_response.json()
    assert detail_payload["contract_title"] is None
    assert detail_payload["project_tab"] == "in_progress"
    assert detail_payload["completion_percent"] == "0.00"


def test_create_project_subtask_under_main_task(
    client: TestClient, superuser_token_headers: dict[str, str], db: Session
) -> None:
    role_name = f"Engineer Task Nested {random_lower_string()[:8]}"
    job_number = f"JOB-TASK-{random_lower_string()[:8]}"
    role = Role(role_name=role_name, description="Engineer role", is_active=True)
    db.add(role)
    db.commit()
    db.refresh(role)

    client_row = Client(
        client_name="Nested Client",
        company_name="Nested Company",
        billing_address="50 Nested Avenue",
    )
    db.add(client_row)
    db.commit()
    db.refresh(client_row)

    status = get_prelim_status(db)

    project = Project(
        job_number=job_number,
        client_id=client_row.id,
        current_status_id=status.id,
        project_name="Nested Task Project",
        start_date=date(2026, 5, 1),
        due_date=date(2026, 6, 1),
        is_active=True,
    )
    db.add(project)
    db.commit()
    db.refresh(project)

    milestone = ProjectMilestone(
        project_id=project.id,
        milestone_name="Preliminary Design & Documentation",
        due_date=date(2026, 5, 12),
        display_order=1,
    )
    db.add(milestone)
    db.commit()
    db.refresh(milestone)

    parent_task_response = client.post(
        f"/api/v1/projects/{project.id}/milestones/{milestone.id}/tasks",
        headers=superuser_token_headers,
        json={
            "task_name": "Siteworks Plan Design",
            "due_date": "2026-05-10",
        },
    )
    assert parent_task_response.status_code == 201
    parent_task_id = parent_task_response.json()["id"]

    child_task_response = client.post(
        f"/api/v1/projects/{project.id}/milestones/{milestone.id}/tasks",
        headers=superuser_token_headers,
        json={
            "task_name": "Footing Design & Documentation",
            "parent_task_id": parent_task_id,
            "due_date": "2026-05-11",
            "assigned_role_id": str(role.id),
            "allocated_hours": "18.50",
        },
    )

    assert child_task_response.status_code == 201
    child_payload = child_task_response.json()
    assert child_payload["task_name"] == "Footing Design & Documentation"
    assert child_payload["assigned_role_id"] == str(role.id)
    assert child_payload["allocated_hours"] == "18.50"

    task_response = client.get(
        f"/api/v1/projects/{project.id}/task-management",
        headers=superuser_token_headers,
    )
    assert task_response.status_code == 200
    payload = task_response.json()
    root_task = payload["milestones"][0]["tasks"][0]
    assert root_task["task_name"] == "Siteworks Plan Design"
    assert len(root_task["children"]) == 1
    assert root_task["children"][0]["task_name"] == "Footing Design & Documentation"
    assert root_task["children"][0]["assigned_role_name"] == role_name
    assert root_task["children"][0]["allocated_hours"] == "18.50"
    assert "subcontractor_name" not in root_task["children"][0]
    assert "subcontractor_status" not in root_task["children"][0]


def test_normal_user_only_sees_directly_assigned_tasks(
    client: TestClient, superuser_token_headers: dict[str, str], db: Session
) -> None:
    marker = random_lower_string()[:8]
    owner_email = f"task-visibility-owner-{marker}@example.com"
    owner_employee_email = f"task-visibility-owner-employee-{marker}@example.com"
    other_employee_email = f"task-visibility-other-employee-{marker}@example.com"
    job_number = f"JOB-TASK-VIS-{marker}"
    client_name = f"Task Visibility Client {marker}"

    created_project_id = None
    created_client_id = None
    created_user_id = None
    created_employee_ids: list = []

    try:
        status = get_prelim_status(db)
        client_row = Client(
            client_name=client_name,
            company_name="Task Visibility Company",
        )
        db.add(client_row)
        db.commit()
        db.refresh(client_row)
        created_client_id = client_row.id

        project = Project(
            job_number=job_number,
            client_id=client_row.id,
            current_status_id=status.id,
            project_name="Task Visibility Project",
            start_date=date(2026, 5, 1),
            due_date=date(2026, 6, 1),
            is_active=True,
        )
        db.add(project)
        db.commit()
        db.refresh(project)
        created_project_id = project.id

        owner_employee = Employee(
            first_name="Task",
            last_name="Owner",
            full_name="Task Owner",
            email=owner_employee_email,
        )
        other_employee = Employee(
            first_name="Task",
            last_name="Other",
            full_name="Task Other",
            email=other_employee_email,
        )
        db.add(owner_employee)
        db.add(other_employee)
        db.commit()
        db.refresh(owner_employee)
        db.refresh(other_employee)
        created_employee_ids.extend([owner_employee.id, other_employee.id])

        owner_password = random_lower_string()
        owner_user = crud.create_user(
            session=db,
            user_create=UserCreate(
                email=owner_email,
                password=owner_password,
                full_name="Task Owner",
            ),
        )
        created_user_id = owner_user.id
        owner_user.employee_id = owner_employee.id
        db.add(owner_user)
        db.add(ProjectAssignment(project_id=project.id, employee_id=owner_employee.id))
        db.add(ProjectAssignment(project_id=project.id, employee_id=other_employee.id))
        db.commit()

        milestone = ProjectMilestone(
            project_id=project.id,
            milestone_name="Task Visibility Milestone",
            display_order=1,
        )
        db.add(milestone)
        db.commit()
        db.refresh(milestone)

        db.add(
            ProjectTask(
                milestone_id=milestone.id,
                task_name="Owner task",
                assigned_employee_id=owner_employee.id,
                milestone_status="todo",
            )
        )
        db.add(
            ProjectTask(
                milestone_id=milestone.id,
                task_name="Other task",
                assigned_employee_id=other_employee.id,
                milestone_status="todo",
            )
        )
        db.add(
            ProjectTask(
                milestone_id=milestone.id,
                task_name="Unassigned task",
                milestone_status="todo",
            )
        )
        db.commit()

        owner_headers = user_authentication_headers(
            client=client,
            email=owner_email,
            password=owner_password,
        )

        owner_task_response = client.get(
            f"/api/v1/projects/{project.id}/task-management",
            headers=owner_headers,
        )
        assert owner_task_response.status_code == 200
        owner_tasks = owner_task_response.json()["milestones"][0]["tasks"]
        assert [task["task_name"] for task in owner_tasks] == ["Owner task"]
        assert owner_tasks[0]["assigned_employee_id"] == str(owner_employee.id)

        owner_global_response = client.get(
            "/api/v1/projects/tasks",
            headers=owner_headers,
        )
        assert owner_global_response.status_code == 200
        assert {task["task_name"] for task in owner_global_response.json()["data"]} == {
            "Owner task"
        }

        admin_task_response = client.get(
            f"/api/v1/projects/{project.id}/task-management",
            headers=superuser_token_headers,
        )
        assert admin_task_response.status_code == 200
        admin_tasks = admin_task_response.json()["milestones"][0]["tasks"]
        assert {task["task_name"] for task in admin_tasks} == {
            "Owner task",
            "Other task",
            "Unassigned task",
        }
    finally:
        if created_project_id:
            project = db.get(Project, created_project_id)
            if project:
                db.delete(project)
                db.commit()
        if created_user_id:
            user = db.get(User, created_user_id)
            if user:
                db.delete(user)
                db.commit()
        for employee_id in created_employee_ids:
            employee = db.get(Employee, employee_id)
            if employee:
                db.delete(employee)
                db.commit()
        if created_client_id:
            client_row = db.get(Client, created_client_id)
            if client_row:
                db.delete(client_row)
                db.commit()


def test_delete_project_milestone_removes_tasks(
    client: TestClient, superuser_token_headers: dict[str, str], db: Session
) -> None:
    status = get_prelim_status(db)

    client_row = Client(
        client_name=f"Delete Milestone Client {random_lower_string()[:8]}",
        company_name="Delete Milestone Company",
    )
    db.add(client_row)
    db.commit()
    db.refresh(client_row)

    project = Project(
        job_number=f"JOB-DEL-MILESTONE-{random_lower_string()[:8]}",
        client_id=client_row.id,
        current_status_id=status.id,
        project_name="Delete Milestone Project",
        start_date=date(2026, 5, 1),
        due_date=date(2026, 6, 1),
        is_active=True,
    )
    db.add(project)
    db.commit()
    db.refresh(project)

    milestone = ProjectMilestone(
        project_id=project.id,
        milestone_name="Design & Documentation",
        due_date=date(2026, 5, 12),
        display_order=1,
    )
    db.add(milestone)
    db.commit()
    db.refresh(milestone)
    milestone_id = milestone.id

    task = ProjectTask(
        milestone_id=milestone_id,
        task_name="Documentation task",
        due_date=date(2026, 5, 11),
    )
    db.add(task)
    db.commit()

    response = client.delete(
        f"/api/v1/projects/{project.id}/milestones/{milestone_id}",
        headers=superuser_token_headers,
    )

    assert response.status_code == 200
    assert response.json() == {"message": "Milestone deleted successfully"}
    db.expire_all()
    assert db.get(ProjectMilestone, milestone_id) is None
    assert db.exec(
        select(ProjectTask).where(ProjectTask.milestone_id == milestone_id)
    ).all() == []


def test_project_tabs_are_grouped_by_completion_and_invoice_state(
    client: TestClient, superuser_token_headers: dict[str, str], db: Session
) -> None:
    status = get_prelim_status(db)

    client_row = Client(
        client_name=f"Tabs Client {random_lower_string()[:8]}",
        company_name="Tabs Company",
    )
    db.add(client_row)
    db.commit()
    db.refresh(client_row)

    projects: dict[str, Project] = {}
    for key in ("progress", "invoice", "completed"):
        project = Project(
            job_number=f"JOB-TAB-{key}-{random_lower_string()[:8]}",
            client_id=client_row.id,
            current_status_id=status.id,
            project_name=f"Tab {key}",
            start_date=date(2026, 5, 1),
            due_date=date(2026, 6, 1),
            is_active=True,
        )
        db.add(project)
        db.commit()
        db.refresh(project)
        projects[key] = project

        completed = key in {"invoice", "completed"}
        milestone = ProjectMilestone(
            project_id=project.id,
            milestone_name="Design & Documentation",
            due_date=date(2026, 6, 1),
            is_complete=completed,
            completion_date=date(2026, 6, 1) if completed else None,
            display_order=1,
        )
        db.add(milestone)
        db.commit()
        db.refresh(milestone)

        db.add(
            ProjectMilestone(
                project_id=project.id,
                milestone_name="Preliminary Design & Documentation",
                due_date=date(2026, 5, 15),
                is_complete=completed,
                completion_date=date(2026, 5, 15) if completed else None,
                display_order=2,
            )
        )
        db.add(
            ProjectMilestone(
                project_id=project.id,
                milestone_name="Documentation Review",
                due_date=date(2026, 5, 20),
                is_complete=completed,
                completion_date=date(2026, 5, 20) if completed else None,
                display_order=3,
            )
        )
        db.commit()

    db.add(
        Invoice(
            project_id=projects["completed"].id,
            invoice_number=f"INV-{random_lower_string()[:8]}",
            invoice_date=date(2026, 6, 2),
            invoice_amount=Decimal("1000.00"),
        )
    )
    db.commit()

    in_progress_response = client.get(
        "/api/v1/projects?tab=in_progress",
        headers=superuser_token_headers,
    )
    to_be_invoiced_response = client.get(
        "/api/v1/projects?tab=to_be_invoiced",
        headers=superuser_token_headers,
    )
    completed_response = client.get(
        "/api/v1/projects?tab=completed",
        headers=superuser_token_headers,
    )

    assert in_progress_response.status_code == 200
    assert to_be_invoiced_response.status_code == 200
    assert completed_response.status_code == 200

    in_progress_ids = {item["project_id"] for item in in_progress_response.json()["data"]}
    to_be_invoiced_ids = {item["project_id"] for item in to_be_invoiced_response.json()["data"]}
    completed_ids = {item["project_id"] for item in completed_response.json()["data"]}

    assert str(projects["progress"].id) in in_progress_ids
    assert str(projects["invoice"].id) in to_be_invoiced_ids
    assert str(projects["completed"].id) in completed_ids
