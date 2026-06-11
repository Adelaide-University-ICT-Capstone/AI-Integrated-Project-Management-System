# Author: Anh Ho
# Function: API endpoints for the AI Chatbot.

from fastapi import APIRouter, HTTPException
import logging

logger = logging.getLogger(__name__)

from app.api.deps import CurrentUser, SessionDep
from app.schemas.chatbot import ChatRequest, ChatResponse
from app.services.chatbot.orchestrator import handle_chat

router = APIRouter(prefix="/chatbot", tags=["chatbot"])


@router.post("/chat", response_model=ChatResponse)
async def chatbot_chat(payload: ChatRequest, session: SessionDep, current_user: CurrentUser):
    # Attempts to call the handle chat function to see if the chatbot is functioning.
    try:
        return await handle_chat(
            message=payload.message,
            project_id=payload.project_id,
            session=session,
            current_user=current_user,
        )

    # Handles error if the chatbot failed.
    except Exception as exc:
        logger.exception("Chatbot request failed")

        return ChatResponse(
            response="Sorry, I could not process your request right now.",
            command_used=None,
            command_data=None,
        )