from fastapi import APIRouter
 
from app.api.routes import invoices, login, projects, users, utils, statuses
from app.core.config import settings
 
api_router = APIRouter()
api_router.include_router(login.router)
api_router.include_router(users.router)
api_router.include_router(projects.router)
api_router.include_router(invoices.router)
api_router.include_router(utils.router)
api_router.include_router(statuses.router)
 
 
# if settings.ENVIRONMENT == "local":
#     api_router.include_router(private.router)
