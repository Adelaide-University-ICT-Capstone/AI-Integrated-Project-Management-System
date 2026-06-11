import sentry_sdk
from fastapi import FastAPI
from fastapi.routing import APIRoute
from starlette.middleware.cors import CORSMiddleware

from app.api.main import api_router
from app.core.config import settings
from app.db.session import get_session
from app.db.initial_data import ensure_project_status_types, ensure_roles

import asyncio
from datetime import datetime, time, timedelta
from sqlmodel import Session
import zoneinfo
from app.api.routes.notifications import trigger_due_reminders, trigger_invoice_reminders
from app.db.session import get_session


def custom_generate_unique_id(route: APIRoute) -> str:
    return f"{route.tags[0]}-{route.name}"

# Authors: Jerry
# --- Added: Infinite asynchronous loop that triggers once every 24 hours ---
async def daily_deadline_checker():
    """
    Background worker running an hourly heartbeat check. It autonomously parses 
    and dispatches due date alerts once a day when midnight hits.
    """
    # Track the last date a notification batch was successfully processed
    # to prevent double-firing within the same midnight window.
    last_processed_date = None

    print("[Scheduler] Asynchronous hourly heartbeat checker activated successfully.")

    while True:
        adelaide_tz = zoneinfo.ZoneInfo("Australia/Adelaide")
        now = datetime.now(adelaide_tz)
        
        # Check condition: Trigger precisely at 07:30 Adelaide Time before workday starts 
        # have we not processed today's batch yet?
        if now.hour == 7 and now.minute == 30 and last_processed_date != now.date():
            print(f"[Scheduler] window detected at {now}. Initialising scanning process...")
            try:
                from fastapi import BackgroundTasks
                bg_tasks = BackgroundTasks()
                
                with get_session() as session:
                    trigger_due_reminders(background_tasks=bg_tasks, db=session)
                    
                await bg_tasks()
                
                # Update tracking flag to seal today's operation successfully
                last_processed_date = now.date()
                print(f"[Scheduler] Daily notification batch for {last_processed_date} routed successfully.")
            except Exception as exc:
                print(f"[Scheduler] Critical error encountered inside the background task runner: {exc}")

        # Heartbeat Sleep: Instead of sleeping for 24 hours straight, 
        # sleep for 60 seconds to ensure we never miss the target time window.
        await asyncio.sleep(60)

# Authors: Jerry
async def weekly_invoice_checker():
    """
    Background worker running an hourly heartbeat check. It autonomously parses 
    and dispatches invoice alerts once a week on Monday mornings.
    """
    last_processed_date = None
    print("[Scheduler] Asynchronous weekly invoice alert checker activated successfully.")

    while True:
        adelaide_tz = zoneinfo.ZoneInfo("Australia/Adelaide")
        now = datetime.now(adelaide_tz)
        
        # Check condition: Trigger precisely on Mondays at 07:30 AM Adelaide Time
        if now.weekday() == 0 and now.hour == 7 and now.minute == 30 and last_processed_date != now.date():
            print(f"[Scheduler] Weekly invoice check window detected at {now}. Initialising scanning process...")
            try:
                from fastapi import BackgroundTasks
                bg_tasks = BackgroundTasks()
                
                with get_session() as session:
                    trigger_invoice_reminders(background_tasks=bg_tasks, db=session)
                    
                await bg_tasks()
                
                last_processed_date = now.date()
                print(f"[Scheduler] Weekly invoice notification batch for {last_processed_date} processed.")
            except Exception as exc:
                print(f"[Scheduler] Critical error inside weekly invoice runner: {exc}")

        # Heartbeat Sleep
        await asyncio.sleep(60)





if settings.SENTRY_DSN and settings.ENVIRONMENT != "local":
    sentry_sdk.init(dsn=str(settings.SENTRY_DSN), enable_tracing=True)

app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    generate_unique_id_function=custom_generate_unique_id,
)

@app.on_event("startup")
async def startup_event():
    with get_session() as session:
        ensure_project_status_types(session)
        ensure_roles(session)

    #// Authors: Jerry
    # ==== Added: Bootstrap the daily midnight deadline checker background task ====
    asyncio.create_task(daily_deadline_checker())
    asyncio.create_task(weekly_invoice_checker())
        

# Set all CORS enabled origins
if settings.all_cors_origins:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.all_cors_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

app.include_router(api_router, prefix=settings.API_V1_STR)
