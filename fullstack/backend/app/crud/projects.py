import uuid
from calendar import monthrange
from datetime import date
from decimal import Decimal

from app.crud.project_statuses import get_status_type

from sqlmodel import Session, col, func, or_, select

from app.models import (
    Client,
    Employee,
    Invoice,
    Project,
    ProjectAssignment,
    ProjectCreateRequest,
    ProjectDetail,
    ProjectMilestone,
    ProjectStatusType,
    ProjectSummary,
    ProjectUpdateRequest,
)

def get_or_create_client(
    *, session: Session, client_name: str, company_name: str | None, contact_email: str | None, billing_address: str | None
) -> Client:
    client = session.exec(select(Client).where(Client.client_name == client_name and Client.company_name == company_name)).first()
    if client:
        return client
    
    client = Client(
        client_name=client_name,
        contact_email=contact_email,
        company_name=company_name,
        billing_address=billing_address,
    )

    session.add(client)
    session.commit()
    session.refresh(client)
    return client

def get_project_by_job_number(*, session: Session, job_number: str) -> Project | None:
    return session.exec(select(Project).where(Project.job_number == job_number)).first()

def get_project_by_id(*, session: Session, project_id: uuid.UUID) -> Project | None:
    return session.get(Project, project_id)

def get_all_projects(*, session: Session) -> list[Project]:
    return list(
        session.exec(
            select(Project)
            .order_by(col(Project.created_at).desc())
        ).all()
    )



def create_project(*, session: Session, project_data: ProjectCreateRequest) -> Project:
    client = get_or_create_client(
        session=session,
        client_name=project_data.client_name,
        company_name=project_data.client_company,
        contact_email=project_data.client_contact,
        billing_address=project_data.client_address,
    )

    status_type = get_status_type(session=session, status_name="prelim")

    project = Project(
        job_number=project_data.job_number,
        client_id=client.id,
        current_status_id=status_type.id,
        project_name=project_data.project_name,
        project_type=project_data.project_types,
        full_address=project_data.client_address,
        date_received=project_data.date_received,
        fee_final=project_data.fee_estimate,
        start_date=project_data.start_date,
        due_date=project_data.due_date,
    )
    session.add(project)
    session.commit()
    session.refresh(project)
    return project


def build_project_details(*, session: Session, projects: list[Project]) -> list[ProjectDetail]:
    today = date.today()
    result = []
    for p in projects:
        client = session.get(Client, p.client_id) if p.client_id else None
        days = (today - p.start_date).days if p.start_date else None
        result.append(
            ProjectDetail(
                project_id=p.id,
                job_number=p.job_number,
                project_name=p.project_name,
                company_name=p.client.company_name if p.client else None,
                company_address=p.client.billing_address if p.client else None,
                client_name=p.client.client_name if p.client else None,
                status=p.current_status.status_name if p.current_status else None,
                start_date=p.start_date,
                due_date=p.due_date,
                date_received=p.created_at.date() if p.created_at else None,
                days_elapsed=days,
                fee_estimate=p.fee_final,
            )
        )
    return result



def get_projects_by_status(*, session: Session, status: str | None = None) -> list[Project]:
    query = select(Project)
    if status:
        query = query.join(ProjectStatusType).where(ProjectStatusType.status_name == status)
    return list(session.exec(query.order_by(col(Project.created_at).desc())).all())


def delete_project(*, session: Session, project_id: uuid.UUID) -> bool:
    project = session.get(Project, project_id)
    if not project:
        return False
    session.delete(project)
    session.commit()
    return True

def delete_all_projects(*, session: Session) -> int:
    deleted = session.exec(select(Project)).all()
    count = len(deleted)
    for project in deleted:
        session.delete(project)
    session.commit()
    return count

def update_project(*, session: Session, project_id: uuid.UUID, project_data: ProjectUpdateRequest) -> Project | None:
    project = session.get(Project, project_id)
    if not project:
        return None

    if project_data.status is not None:
        status_type = get_status_type(session=session, status_name=project_data.status)

        if not status_type:
            raise ValueError(f"Status type '{project_data.status}' does not exist.")
        project.current_status_id = status_type.id

    if project_data.project_name is not None:
        project.project_name = project_data.project_name
    if project_data.project_types is not None:
        project.project_type = project_data.project_types
    if project_data.date_received is not None:
        project.date_received = project_data.date_received
    if project_data.start_date is not None:
        project.start_date = project_data.start_date
    if project_data.due_date is not None:
        project.due_date = project_data.due_date
    if project_data.fee_estimate is not None:
        project.fee_final = project_data.fee_estimate

    session.add(project)
    session.commit()
    session.refresh(project)
    return project

# --------------------------------

def month_bounds(year: int, month: int) -> tuple[date, date]:
    _, last_day = monthrange(year, month)
    return date(year, month, 1), date(year, month, last_day)


def prev_month(year: int, month: int) -> tuple[int, int]:
    if month == 1:
        return year - 1, 12
    return year, month - 1


def get_project_manager(*, session: Session, project_id: uuid.UUID) -> str | None:
    employees = session.exec(
        select(Employee)
        .join(ProjectAssignment, ProjectAssignment.employee_id == Employee.id)
        .where(ProjectAssignment.project_id == project_id)
    ).all()
    if not employees:
        return None
    for emp in employees:
        if emp.role_title and "manager" in emp.role_title.lower():
            return emp.full_name or f"{emp.first_name} {emp.last_name}".strip()
    emp = employees[0]
    return emp.full_name or f"{emp.first_name} {emp.last_name}".strip()


def build_project_summaries(*, session: Session, projects: list[Project]) -> list[ProjectSummary]:
    today = date.today()
    result = []
    for p in projects:
        client = session.get(Client, p.client_id) if p.client_id else None
        days = (today - p.start_date).days if p.start_date else None
        result.append(
            ProjectSummary(
                project_id=p.id,
                project_name=p.project_name,
                client_name=client.client_name if client else None,
                project_manager_name=get_project_manager(session=session, project_id=p.id),
                days_since_started=days,
            )
        )
    return result


def get_all_active_projects(*, session: Session) -> list[Project]:
    return list(
        session.exec(
            select(Project)
            .where(Project.is_active == True)
            .order_by(col(Project.created_at).desc())
        ).all()
    )


def get_delayed_projects(*, session: Session) -> list[Project]:
    today = date.today()
    delayed_ids = session.exec(
        select(ProjectMilestone.project_id)
        .where(ProjectMilestone.due_date < today)
        .where(ProjectMilestone.is_complete == False)
        .distinct()
    ).all()
    if not delayed_ids:
        return []
    return list(
        session.exec(
            select(Project)
            .where(col(Project.id).in_(delayed_ids))
            .where(Project.is_active == True)
            .order_by(col(Project.created_at).desc())
        ).all()
    )


def get_overdue_projects(*, session: Session) -> list[Project]:
    today = date.today()
    return list(
        session.exec(
            select(Project)
            .where(Project.is_active == True)
            .where(Project.due_date < today)
            .where(Project.completion_date == None)
            .order_by(col(Project.due_date).asc())
        ).all()
    )


def get_projects_expected_by_date(*, session: Session, due_by: date) -> list[Project]:
    return list(
        session.exec(
            select(Project)
            .where(Project.is_active == True)
            .where(Project.due_date <= due_by)
            .where(Project.completion_date == None)
            .order_by(col(Project.due_date).asc())
        ).all()
    )


def count_active_projects(*, session: Session, start: date, end: date) -> int:
    return session.exec(
        select(func.count())
        .select_from(Project)
        .where(Project.is_active == True)
        .where(Project.start_date <= end)
        .where(or_(Project.completion_date == None, Project.completion_date >= start))
    ).one()


def count_completed_projects(*, session: Session, start: date, end: date) -> int:
    return session.exec(
        select(func.count())
        .select_from(Project)
        .where(Project.completion_date >= start)
        .where(Project.completion_date <= end)
    ).one()


def sum_invoices(*, session: Session, start: date, end: date) -> Decimal:
    total = session.exec(
        select(func.sum(Invoice.invoice_amount))
        .where(Invoice.invoice_date >= start)
        .where(Invoice.invoice_date <= end)
    ).one()
    return total or Decimal("0")
