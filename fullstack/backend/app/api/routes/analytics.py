from datetime import date, datetime, timedelta, timezone
from collections import defaultdict
from decimal import Decimal

from fastapi import APIRouter, Depends
from sqlmodel import Session, select

from app.api.deps import get_current_user, SessionDep
from app.models import (
    Project, ProjectMilestone, Material, TimeLog, Employee, Invoice, User
)

router = APIRouter(prefix="/analytics", tags=["analytics"])

ACTIVE_STATUSES = {
    "prelim", "in_progress", "on_hold"
}

def today() -> date:
    return datetime.now(timezone.utc).date()


def calculate_risk(project: Project, session: Session) -> dict:
    score = 0
    reasons = []
    now = today()

    milestones = session.exec(
        select(ProjectMilestone).where(ProjectMilestone.project_id == project.id)
    ).all()

    overdue = [m for m in milestones if m.due_date and m.due_date < now and not m.is_complete]
    if overdue:
        score += min(20 * len(overdue), 40)
        reasons.append(f"{len(overdue)} overdue milestone(s)")

    materials = session.exec(
        select(Material).where(Material.project_id == project.id)
    ).all()
    missing = [m for m in materials if m.status in ("N/A", "ordered")]
    if missing:
        score += min(25 * len(missing), 50)
        reasons.append(f"{len(missing)} missing material(s)")

    if project.due_date:
        days_left = (project.due_date - now).days
        if days_left < 0:
            score += 30
            reasons.append("Deadline passed")
        elif days_left <= 7:
            score += 20
            reasons.append(f"Due in {days_left} day(s)")
        elif days_left <= 14:
            score += 10
            reasons.append(f"Due in {days_left} day(s)")

    score = min(score, 100)
    level = "High" if score > 60 else "Medium" if score > 30 else "Low"
    return {"score": score, "level": level, "reasons": reasons}


@router.get("/dashboard-summary")
def dashboard_summary(session: SessionDep, current_user: User = Depends(get_current_user)):
    now = today()
    all_projects = session.exec(select(Project)).all()

    active = [
        p for p in all_projects
        if p.current_status and
        p.current_status.status_name.lower() in {s.lower() for s in ACTIVE_STATUSES}
    ]

    high_risk = sum(1 for p in active if calculate_risk(p, session)["level"] == "High")

    overdue_milestones = session.exec(
        select(ProjectMilestone).where(
            ProjectMilestone.due_date < now,
            ProjectMilestone.is_complete == False,
        )
    ).all()

    uninvoiced = [
        p for p in all_projects
        if p.current_status and
        p.current_status.status_name.lower() == "to_be_invoiced" and
        not p.invoices
    ]

    pending_materials = session.exec(
        select(Material).where(Material.status.in_(["N/A", "ordered"]))
    ).all()

    thirty_days_ago = now - timedelta(days=30)
    logs = session.exec(select(TimeLog).where(TimeLog.log_date >= thirty_days_ago)).all()
    employees = session.exec(select(Employee).where(Employee.is_active == True)).all()
    avg_hours = 0.0
    if employees and logs:
        by_emp = defaultdict(float)
        for log in logs:
            if log.employee_id:
                by_emp[log.employee_id] += float(log.hours_worked)
        avg_hours = round(sum(by_emp.values()) / len(employees), 1)

    return {
        "response_code": 200,
        "active_projects": len(active),
        "total_projects": len(all_projects),
        "high_risk_projects": high_risk,
        "overdue_tasks": len(overdue_milestones),
        "uninvoiced_projects": len(uninvoiced),
        "pending_materials": len(pending_materials),
        "avg_workload_hours": avg_hours,
    }


@router.get("/risks")
def risk_analytics(session: SessionDep, current_user: User = Depends(get_current_user)):
    now = today()
    projects = session.exec(select(Project).where(Project.is_active == True)).all()

    rows = []
    for p in projects:
        risk = calculate_risk(p, session)
        overdue_count = session.exec(
            select(ProjectMilestone).where(
                ProjectMilestone.project_id == p.id,
                ProjectMilestone.due_date < now,
                ProjectMilestone.is_complete == False,
            )
        ).all()
        rows.append({
            "project_id": str(p.id),
            "job_number": p.job_number,
            "job_title": p.job_title or p.project_name,
            "status": p.current_status.status_name if p.current_status else "Unknown",
            "due_date": p.due_date.isoformat() if p.due_date else None,
            "risk_score": risk["score"],
            "risk_level": risk["level"],
            "risk_reasons": risk["reasons"],
            "overdue_tasks": len(overdue_count),
        })

    rows.sort(key=lambda x: x["risk_score"], reverse=True)
    return {"response_code": 200, "risks": rows}


@router.get("/project-health")
def project_health(session: SessionDep, current_user: User = Depends(get_current_user)):
    projects = session.exec(select(Project)).all()

    status_dist: dict = defaultdict(int)
    for p in projects:
        label = p.current_status.status_name if p.current_status else "Unknown"
        status_dist[label] += 1

    milestones = session.exec(select(ProjectMilestone)).all()
    task_progress = {"todo": 0, "in_progress": 0, "review": 0, "done": 0}
    for m in milestones:
        if m.is_complete:
            task_progress["done"] += 1
        elif m.progress >= 75:
            task_progress["review"] += 1
        elif m.progress > 0:
            task_progress["in_progress"] += 1
        else:
            task_progress["todo"] += 1

    return {
        "response_code": 200,
        "total_projects": len(projects),
        "status_distribution": dict(status_dist),
        "task_progress": task_progress,
    }


@router.get("/workload")
def workload_analytics(session: SessionDep, current_user: User = Depends(get_current_user)):
    employees = session.exec(select(Employee).where(Employee.is_active == True)).all()
    logs = session.exec(select(TimeLog)).all()

    result = []
    for emp in employees:
        monthly: dict = defaultdict(float)
        total = 0.0
        for log in (l for l in logs if l.employee_id == emp.id):
            key = log.log_date.strftime("%b")
            monthly[key] += float(log.hours_worked)
            total += float(log.hours_worked)
        result.append({
            "user_id": str(emp.id),
            "name": emp.full_name or f"{emp.first_name} {emp.last_name}",
            "role": emp.role_title,
            "monthly": dict(monthly),
            "total_hours": round(total, 1),
            "overloaded": total > 160,
        })

    return {"response_code": 200, "workload": result}


@router.get("/revenue-leakage")
def revenue_leakage(session: SessionDep, current_user: User = Depends(get_current_user)):
    now = today()
    projects = session.exec(select(Project).where(Project.is_active == True)).all()

    rows = []
    total = Decimal("0")

    for p in projects:
        fee = p.fee_final or Decimal("0")
        invoiced = sum((inv.invoice_amount or Decimal("0")) for inv in p.invoices)
        leakage = fee - invoiced

        if leakage > 0 and p.current_status and \
           p.current_status.status_name.lower() in ("to_be_invoiced", "completed"):
            days_overdue = (now - p.updated_at.date()).days if p.updated_at else 0
            rows.append({
                "project_id": str(p.id),
                "job_number": p.job_number,
                "job_title": p.job_title or p.project_name,
                "status": p.current_status.status_name,
                "completion_date": p.completion_date.isoformat() if p.completion_date else None,
                "uninvoiced_revenue": float(leakage),
                "days_overdue": max(days_overdue, 0),
            })
            total += leakage

    return {"response_code": 200, "total_leakage": float(total), "uninvoiced_projects": rows}


@router.get("/material-delays")
def material_delays(session: SessionDep, current_user: User = Depends(get_current_user)):
    now = today()
    delayed = session.exec(
        select(Material).where(Material.status.in_(["N/A", "ordered"]))
    ).all()

    rows = []
    for m in delayed:
        p = m.project
        days_overdue = (now - m.ordered_date).days if m.ordered_date else 0
        rows.append({
            "material_id": str(m.id),
            "project_id": str(m.project_id),
            "project_name": p.job_title or p.project_name if p else "Unknown",
            "job_number": p.job_number if p else "Unknown",
            "material_name": m.name,
            "order_status": m.status,
            "ordered_date": m.ordered_date.isoformat() if m.ordered_date else None,
            "overdue_days": max(days_overdue, 0),
            "project_due_date": p.due_date.isoformat() if p and p.due_date else None,
        })

    rows.sort(key=lambda x: x["overdue_days"], reverse=True)
    return {"response_code": 200, "material_delays": rows}


@router.get("/deadline-trend")
def deadline_trend(session: SessionDep, current_user: User = Depends(get_current_user)):
    projects = session.exec(select(Project).where(Project.is_active == True)).all()
    trend = []

    for weeks_ago in range(6, -1, -1):
        label = (datetime.now(timezone.utc) - timedelta(weeks=weeks_ago)).strftime("%b %d")
        counts = {"week": label, "high": 0, "medium": 0, "low": 0}
        for p in projects:
            lvl = calculate_risk(p, session)["level"].lower()
            counts[lvl] += 1
        trend.append(counts)

    return {"response_code": 200, "trend": trend}
