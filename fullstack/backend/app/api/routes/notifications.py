from datetime import date, timedelta, datetime
import zoneinfo
from typing import Any
import uuid

from fastapi import APIRouter, Depends, BackgroundTasks, HTTPException
from sqlmodel import Session, select
from sqlalchemy import or_

from app.api.deps import get_current_active_superuser, get_db
from app.core.config import settings
from app.models import (
    Message, 
    Project, 
    ProjectMilestone, 
    ProjectTask, 
    ProjectStatus,
    User,
    Employee, 
    ProjectAssignment
)
from app.utils import send_email, render_email_template, EmailData

from sqlalchemy import event
from app.models import Project

router = APIRouter(prefix="/notifications", tags=["notifications"])

def generate_due_reminder_email(
    items_data: list, 
    reminder_type: str = "Deadline Alert"
) -> EmailData:
    """
    Generate an HTML email for due date reminders using a table structure.
    """
    project_name = settings.PROJECT_NAME
    subject = f"{project_name} - {reminder_type}"
    
    table_rows = "".join([
        f"<tr>"
        f"<td style='padding:8px; border:1px solid #ddd;'>{item['name']}</td>"
        f"<td style='padding:8px; border:1px solid #ddd;'>{item['category']}</td>"
        f"<td style='padding:8px; border:1px solid #ddd;'>{item['date']}</td>"
        f"<td style='padding:8px; border:1px solid #ddd;'>{item['days_left']} days</td>"
        f"</tr>" for item in items_data
    ])

    html_content = f"""
    <html>
        <body style="font-family: Arial, sans-serif; color: #333;">
            <h2>{project_name} Due Date Reminders</h2>
            <p>The following items are approaching their deadlines (14, 7, 3, or 0 days remaining):</p>
            <table style='border-collapse: collapse; width: 100%; border: 1px solid #ddd;'>
                <thead>
                    <tr style='background-color: #f2f2f2;'>
                        <th style='padding:8px; border:1px solid #ddd; text-align:left;'>Name</th>
                        <th style='padding:8px; border:1px solid #ddd; text-align:left;'>Type</th>
                        <th style='padding:8px; border:1px solid #ddd; text-align:left;'>Due Date</th>
                        <th style='padding:8px; border:1px solid #ddd; text-align:left;'>Remaining</th>
                    </tr>
                </thead>
                <tbody>{table_rows}</tbody>
            </table>
        </body>
    </html>
    """
    return EmailData(html_content=html_content, subject=subject)

# =========================================================================
# 1. Deadline Reminders (Refactored to loop through users and check toggle)
# =========================================================================
@router.post(
    "/trigger-reminders/",
    dependencies=[Depends(get_current_active_superuser)],
    status_code=202,
    response_model=Message
)
def trigger_due_reminders(
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
) -> Message:
    """
    Detect upcoming deadlines and queue personalised reminders strictly for users 
    assigned to those specific projects and who have enabled notifications.
    """
    try:
        from app.models import ProjectAssignment, ProjectStatus, Project, User, Employee
        
        adelaide_tz = zoneinfo.ZoneInfo("Australia/Adelaide")
        today = datetime.now(adelaide_tz).date()
        target_dates = [today + timedelta(days=i) for i in [0, 3, 7, 14]]

        # 1. Evaluate Project Due Dates to build a map of user_email -> list of their due projects
        excluded_statuses = [ProjectStatus.completed_invoiced.value, ProjectStatus.hold.value]
        project_stmt = select(Project).where(
            Project.due_date.in_(target_dates),
            Project.is_active == True
        )
        due_projects = db.exec(project_stmt).all()
        
        if not due_projects:
            return Message(message="No items matching the scheduled intervals for today.")

        # Dictionary to group personalized items: { user_email: [project_item_1, project_item_2] }
        user_reminders_map = {}

        for p in due_projects:
            if p.current_status and p.current_status.status_name not in excluded_statuses:
                project_item = {
                    "name": p.project_name or p.job_number,
                    "category": "Project",
                    "date": str(p.due_date),
                    "days_left": (p.due_date - today).days
                }
                
                # 🔔 Core Logic: Track down stakeholders assigned to this specific project
                assignment_stmt = select(User).join(
                    Employee, User.employee_id == Employee.id
                ).join(
                    ProjectAssignment, ProjectAssignment.employee_id == Employee.id
                ).where(
                    ProjectAssignment.project_id == p.id,
                    User.is_active == True,
                    User.pref_deadline_reminders == True  # Check their notification toggle loop
                )
                assigned_users = db.exec(assignment_stmt).all()
                
                # Group the project item under each assigned user's email account
                for user in assigned_users:
                    user_reminders_map.setdefault(user.email, []).append(project_item)

        if not user_reminders_map:
            return Message(message="Reminders detected, but no assigned users have enabled Deadline Reminders.")

        if settings.emails_enabled:
            # 2. Dispatch customized layouts tailored strictly to each individual user's workload
            for email_recipient, items in user_reminders_map.items():
                email_data = generate_due_reminder_email(items_data=items)
                if background_tasks is not None:
                    background_tasks.add_task(
                        send_email,
                        email_to=email_recipient,
                        subject=email_data.subject,
                        html_content=email_data.html_content
                    )
                else:
                    # Execute direct call when background_tasks parameter is explicitly passed as None
                    send_email(
                        email_to=email_recipient,
                        subject=email_data.subject,
                        html_content=email_data.html_content
                    )
            return Message(message=f"Success: Dispatched personalized reminders to {len(user_reminders_map)} distinct users.")
        
        return Message(message="Found items, but email service is globally disabled.")

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal Server Error: {str(e)}")


# =========================================================================
# Added: Centralized Email Notification Triggers with Preference Verification
# =========================================================================


# =========================================================================
# 2. REAL INTEGRATION CORE FUNCTIONS (Invoked by Extension Handlers)
# =========================================================================

def send_project_update_notification(
    db: Session, 
    background_tasks: BackgroundTasks, 
    project_name: str, 
    job_number: str,
    project_id: uuid.UUID | None = None
):
    """
    Core sender for Project Status Updates. 
    Strictly queries active users assigned to this specific project who have enabled updates.
    """
    if not settings.emails_enabled:
        return
        
    print(f"[Event Trigger] Project status update detected for {job_number}. Preparing notifications...")
    
    stmt = select(User).join(
        Employee, User.employee_id == Employee.id
    ).join(
        ProjectAssignment, ProjectAssignment.employee_id == Employee.id
    ).where(
        ProjectAssignment.project_id == project_id,
        User.is_active == True,
        User.pref_project_updates == True
    )

    users = db.exec(stmt).all()
    
    if not users:
        print("[Event Trigger] No users have enabled pref_project_updates notification toggle.")
        return

    project_name_app = settings.PROJECT_NAME
    subject = f"{project_name_app} - Project Tracking Metrics Updated [{job_number}]"
    
    html_content = f"""
    <html>
        <body style="font-family: Arial, sans-serif; color: #333; line-height: 1.6;">
            <div style="max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; padding: 20px; border-radius: 5px;">
                <h2 style="color: #2c3e50; border-bottom: 2px solid #34495e; padding-bottom: 10px;">
                    📋 Project Status Updated
                </h2>
                <p>Hello Team Member,</p>
                <p>Please be informed that the operational metrics or status tracking of a project has been updated:</p>
                
                <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
                    <tr>
                        <td style="padding: 8px; font-weight: bold; width: 30%;">Project Name:</td>
                        <td style="padding: 8px;">{project_name}</td>
                    </tr>
                    <tr>
                        <td style="padding: 8px; font-weight: bold;">Job Number:</td>
                        <td style="padding: 8px;"><code>{job_number}</code></td>
                    </tr>
                </table>
                
                <p style="font-size: 0.9em; color: #7f8c8d; margin-top: 30px; border-top: 1px solid #eee; padding-top: 10px;">
                    This is an automated operational alert generated by {project_name_app}. If you wish to unsubscribe, please adjust your profile notification preferences.
                </p>
            </div>
        </body>
    </html>
    """

    for user in users:
        background_tasks.add_task(
            send_email,
            email_to=user.email,
            subject=subject,
            html_content=html_content
        )
    print(f"[Event Trigger] Successfully queued project update notification for {len(users)} users.")


def send_task_assignment_notification(
    db: Session, 
    background_tasks: BackgroundTasks, 
    user_id: uuid.UUID, 
    task_name: str
):
    """
    Core sender for Task/Workforce Assignments. 
    Verifies target user toggle preferences before packaging and dispatching email payloads.
    """
    if not settings.emails_enabled:
        return
        
    print(f"[Event Trigger] Checking task assignment eligibility for User ID: {user_id}...")
    
    # Verify the specific user exists, is active, and wants assignment alerts
    user = db.get(User, user_id)
    if not (user and user.is_active and user.pref_task_assignments):
        print(f"[Event Trigger] User {user_id} is inactive or has disabled pref_task_assignments.")
        return
        
    project_name_app = settings.PROJECT_NAME
    subject = f"{project_name_app} - New Project Allocation Registered"
    
    # 🚀 REAL CONTENT UPGRADE: Beautiful, professional full HTML email layout
    html_content = f"""
    <html>
        <body style="font-family: Arial, sans-serif; color: #333; line-height: 1.6;">
            <div style="max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; padding: 20px; border-radius: 5px;">
                <h2 style="color: #27ae60; border-bottom: 2px solid #27ae60; padding-bottom: 10px;">
                    🚀 Workforce Allocation Update
                </h2>
                <p>Hello {user.full_name or 'Team Member'},</p>
                <p>You have been officially allocated onto a new professional tracking workflow inside the system:</p>
                
                <div style="background-color: #f9f9f9; border-left: 4px solid #27ae60; padding: 15px; margin: 20px 0; border-radius: 4px;">
                    <strong>Allocation Context:</strong><br>
                    <span style="color: #27ae60; font-size: 1.1em;">{task_name}</span>
                </div>
                
                <p>Please log into your dashboard to inspect your tracking metrics, project milestones, and log your daily work hours.</p>
                
                <p style="font-size: 0.9em; color: #7f8c8d; margin-top: 30px; border-top: 1px solid #eee; padding-top: 10px;">
                    This is an automated operational alert generated by {project_name_app}. If you wish to opt-out of these assignment alerts, please update your profile settings.
                </p>
            </div>
        </body>
    </html>
    """

    background_tasks.add_task(
        send_email,
        email_to=user.email,
        subject=subject,
        html_content=html_content
    )
    print(f"[Event Trigger] Successfully queued task allocation email for {user.email}.")



def send_task_removal_notification(
    db: Session, 
    background_tasks: BackgroundTasks, 
    user_id: uuid.UUID, 
    task_name: str
):
    """
    Core sender for Task/Workforce Removals. 
    Verifies target user toggle preferences before packaging and dispatching email payloads.
    """
    if not settings.emails_enabled:
        return
        
    print(f"[Event Trigger] Checking task removal eligibility for User ID: {user_id}...")
    
    user = db.get(User, user_id)
    if not (user and user.is_active and user.pref_task_assignments):
        print(f"[Event Trigger] User {user_id} is inactive or has disabled pref_task_assignments.")
        return
        
    project_name_app = settings.PROJECT_NAME
    subject = f"{project_name_app} - Project Allocation Removed"
    
    html_content = f"""
    <html>
        <body style="font-family: Arial, sans-serif; color: #333; line-height: 1.6;">
            <div style="max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; padding: 20px; border-radius: 5px;">
                <h2 style="color: #c0392b; border-bottom: 2px solid #c0392b; padding-bottom: 10px;">
                    ⚠️ Workforce Allocation Removed
                </h2>
                <p>Hello {user.full_name or 'Team Member'},</p>
                <p>Your professional allocation has been removed from the following tracking workflow:</p>
                
                <div style="background-color: #f9f9f9; border-left: 4px solid #c0392b; padding: 15px; margin: 20px 0; border-radius: 4px;">
                    <strong>Allocation Context:</strong><br>
                    <span style="color: #c0392b; font-size: 1.1em;">{task_name}</span>
                </div>
                
                <p>Please contact your project manager if this change was unexpected.</p>
            </div>
        </body>
    </html>
    """

    background_tasks.add_task(
        send_email,
        email_to=user.email,
        subject=subject,
        html_content=html_content
    )
    print(f"[Event Trigger] Successfully queued task removal email for {user.email}.")

# =========================================================================
# 3. Standby Stubs (Placeholders for Future Sprints)
# =========================================================================

def send_invoice_alert_notification(db: Session, background_tasks: BackgroundTasks, invoice_number: str, status: str):
    """Placeholder trigger for Invoice Alert notifications."""
    if not settings.emails_enabled:
        return
        
    stmt = select(User).where(User.is_active == True, User.pref_invoice_alerts == True)
    users = db.exec(stmt).all()
    
    for user in users:
        background_tasks.add_task(
            send_email,
            email_to=user.email,
            subject=f"Invoice Update Notification - {invoice_number}",
            html_content=f"<p>Invoice <strong>{invoice_number}</strong> status has shifted to: <strong>{status}</strong>.</p>"
        )


def send_weekly_report_notification(db: Session, background_tasks: BackgroundTasks, report_summary: str):
    """Placeholder trigger for Weekly Performance Summary Report notifications."""
    if not settings.emails_enabled:
        return
        
    stmt = select(User).where(User.is_active == True, User.pref_weekly_reports == True)
    users = db.exec(stmt).all()
    
    for user in users:
        background_tasks.add_task(
            send_email,
            email_to=user.email,
            subject="Your Weekly Activity Summary Report",
            html_content=f"<h3>Weekly Performance Summary</h3><p>{report_summary}</p>"
        )




def send_invoice_alert_notification(db: Session, background_tasks: BackgroundTasks, invoice_number: str, status: str):
    """
    Trigger Invoice Alerts. Dispatches emails to users subscribed to payment states updates.
    """
    if not settings.emails_enabled:
        return
        
    stmt = select(User).where(User.is_active == True, User.pref_invoice_alerts == True)
    users = db.exec(stmt).all()
    
    for user in users:
        background_tasks.add_task(
            send_email,
            email_to=user.email,
            subject=f"Invoice Update Notification - {invoice_number}",
            html_content=f"<p>Invoice <strong>{invoice_number}</strong> status has shifted to: <strong>{status}</strong>.</p>"
        )


def send_weekly_report_notification(db: Session, background_tasks: BackgroundTasks, report_summary: str):
    """
    Trigger Weekly Summary Report notification distribution loop.
    """
    if not settings.emails_enabled:
        return
        
    stmt = select(User).where(User.is_active == True, User.pref_weekly_reports == True)
    users = db.exec(stmt).all()
    
    for user in users:
        background_tasks.add_task(
            send_email,
            email_to=user.email,
            subject="Your Weekly Activity Summary Report",
            html_content=f"<h3>Weekly Performance Summary</h3><p>{report_summary}</p>"
        )