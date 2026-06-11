# Author: Anh Ho
# Function: Dashboard schema model.

from pydantic import BaseModel


class AIAlert(BaseModel):
    id: str
    severity: str
    message: str
    project: str
    action: str


class AIAlertsResponse(BaseModel):
    alerts: list[AIAlert]