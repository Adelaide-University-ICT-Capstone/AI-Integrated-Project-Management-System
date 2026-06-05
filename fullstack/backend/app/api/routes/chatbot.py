from fastapi import APIRouter

from app.api.deps import CurrentUser, SessionDep
from app.schemas.chatbot import ChatRequest, ChatResponse
from app.services.chatbot.orchestrator import handle_chat

router = APIRouter(prefix="/chatbot", tags=["chatbot"])


@router.post("/chat", response_model=ChatResponse)
async def chatbot_chat(
    payload: ChatRequest,
    session: SessionDep,
    current_user: CurrentUser,
):
    return await handle_chat(
        message=payload.message,
        project_id=payload.project_id,
        session=session,
        current_user=current_user,
    )