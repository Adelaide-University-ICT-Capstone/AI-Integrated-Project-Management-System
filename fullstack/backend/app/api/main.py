from fastapi import APIRouter
 
from app.api.routes import login, projects, users, utils, statuses, project_subtasks
from app.core.config import settings
from app.api.routes import workforce_allocate
 
api_router = APIRouter()
api_router.include_router(login.router)
api_router.include_router(users.router)
api_router.include_router(projects.router)
api_router.include_router(utils.router)
api_router.include_router(statuses.router)
api_router.include_router(workforce_allocate.router)
api_router.include_router(project_subtasks.router)
 
# if settings.ENVIRONMENT == "local":
#     api_router.include_router(private.router)
