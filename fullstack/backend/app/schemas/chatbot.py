from pydantic import BaseModel
from typing import Any

class ChatRequest(BaseModel):
    message: str
    project_id: int | None = None

class ChatResponse(BaseModel):
    response: str
    command_used: str | None = None
    command_data: dict[str, Any] | None = None