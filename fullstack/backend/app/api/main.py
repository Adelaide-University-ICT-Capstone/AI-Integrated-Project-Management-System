from fastapi import APIRouter

from app.api.routes import login, projects, roles, statuses, users, utils, materials
from app.core.config import settings

api_router = APIRouter()
api_router.include_router(login.router)
api_router.include_router(users.router)
api_router.include_router(projects.router)
api_router.include_router(utils.router)
api_router.include_router(roles.router, prefix="/roles", tags=["roles"])
api_router.include_router(statuses.router)
api_router.include_router(materials.router)
# if settings.ENVIRONMENT == "local":
#     api_router.include_router(private.router)
