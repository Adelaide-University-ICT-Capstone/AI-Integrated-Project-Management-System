'''
Author: Leslie Nguyen 
Function: provide unit testing for subcontractor modules
'''

from datetime import date

from fastapi.testclient import TestClient
from sqlmodel import Session

from app import crud
from app.models import (
    Client,
    Employee,
    Project,
    ProjectAssignment,
    Subcontractor,
    UserCreate,
)
from tests.utils.user import user_authentication_headers
from tests.utils.utils import random_email, random_lower_string


def test_subcontractor_list_is_global_but_projects_are_employee_scoped(
    client: TestClient, db: Session
) -> None:
    employee = Employee(
        first_name="Scoped",
        last_name="Employee",
        full_name="Scoped Employee",
        email=random_email(),
    )
    db.add(employee)
    db.commit()
    db.refresh(employee)

    password = f"Password-{random_lower_string()[:8]}"
    user = crud.create_user(
        session=db,
        user_create=UserCreate(email=random_email(), password=password),
    )
    user.employee_id = employee.id
    db.add(user)
    db.commit()

    client_row = Client(
        client_name="Subcontractor Test Client",
        company_name="Subcontractor Test Company",
        billing_address="1 Test Street",
    )
    db.add(client_row)
    db.commit()
    db.refresh(client_row)

    visible_project = Project(
        job_number=f"JOB-SUB-VISIBLE-{random_lower_string()[:8]}",
        client_id=client_row.id,
        project_name="Visible Project",
        start_date=date(2026, 6, 1),
        due_date=date(2026, 6, 30),
        is_active=True,
    )
    hidden_project = Project(
        job_number=f"JOB-SUB-HIDDEN-{random_lower_string()[:8]}",
        client_id=client_row.id,
        project_name="Hidden Project",
        start_date=date(2026, 6, 1),
        due_date=date(2026, 6, 30),
        is_active=True,
    )
    db.add(visible_project)
    db.add(hidden_project)
    db.commit()
    db.refresh(visible_project)
    db.refresh(hidden_project)

    visible_subcontractor = Subcontractor(
        company_name=f"Visible Sub {random_lower_string()[:8]}",
        specialty="Survey",
    )
    hidden_subcontractor = Subcontractor(
        company_name=f"Hidden Sub {random_lower_string()[:8]}",
        specialty="Survey",
    )
    db.add(visible_subcontractor)
    db.add(hidden_subcontractor)
    db.commit()
    db.refresh(visible_subcontractor)
    db.refresh(hidden_subcontractor)

    db.add(
        ProjectAssignment(
            project_id=visible_project.id,
            employee_id=employee.id,
        )
    )
    db.add(
        ProjectAssignment(
            project_id=visible_project.id,
            subcontractor_id=visible_subcontractor.id,
        )
    )
    db.add(
        ProjectAssignment(
            project_id=hidden_project.id,
            subcontractor_id=hidden_subcontractor.id,
        )
    )
    db.commit()

    headers = user_authentication_headers(
        client=client,
        email=user.email,
        password=password,
    )

    subcontractors_response = client.get("/api/v1/subcontractors", headers=headers)
    assert subcontractors_response.status_code == 200
    subcontractor_ids = {row["id"] for row in subcontractors_response.json()}
    assert str(visible_subcontractor.id) in subcontractor_ids
    assert str(hidden_subcontractor.id) in subcontractor_ids

    visible_projects_response = client.get(
        f"/api/v1/subcontractors/{visible_subcontractor.id}/projects",
        headers=headers,
    )
    assert visible_projects_response.status_code == 200
    assert visible_projects_response.json()["count"] == 1
    assert visible_projects_response.json()["data"][0]["project_id"] == str(
        visible_project.id
    )

    hidden_projects_response = client.get(
        f"/api/v1/subcontractors/{hidden_subcontractor.id}/projects",
        headers=headers,
    )
    assert hidden_projects_response.status_code == 200
    assert hidden_projects_response.json()["count"] == 0
