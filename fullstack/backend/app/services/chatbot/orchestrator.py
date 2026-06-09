import json
import logging
from typing import Any

from app.services.chatbot.commands import COMMANDS
from app.services.chatbot.llm import ask_llm

logger = logging.getLogger(__name__)

MAX_COMMANDS = 1

# Descriptions of all the commands.
COMMAND_DESCRIPTIONS = """
Available commands:

1. get_visible_projects_summary
Use when the user asks for all projects, project summaries, or project overviews.
Arguments: {}

2. get_project_details
Use when the user asks about a specific project's status, due date, progress, invoice status, client, or general details.
The project can be identified by UUID, job number, or exact project name.
Arguments: {"project_identifier": "string"}

3. get_overdue_projects
Use when the user asks which projects are overdue, past their due date, or need urgent attention.
Arguments: {}

4. get_delayed_projects
Use when the user asks which projects are delayed, behind schedule, at risk, or blocked.
Arguments: {}

5. get_projects_due_soon
Use when the user asks what projects are due soon, due this week, or have upcoming deadlines.
Arguments: {"days": 7}

6. get_project_tasks
Use when the user asks about tasks, milestones, remaining work, or task progress for a specific project.
The project can be identified by UUID, job number, or exact project name.
Arguments: {"project_identifier": "string"}

7. get_invoice_summary
Use when the user asks about invoice totals, monthly invoice summary, revenue this month, or comparison with last month.
Arguments: {}
"""

# Function for safely loading JSON and handling error if the JSON is unsuitable.
def safe_json_loads(raw: str | None) -> dict[str, Any]:
    if not raw:
        return {"command": None, "arguments": {}}

    try:
        parsed = json.loads(raw)
        if not isinstance(parsed, dict):
            return {"command": None, "arguments": {}}
        return parsed
    except json.JSONDecodeError:
        logger.warning("LLM returned invalid JSON for command selection: %s", raw)
        return {"command": None, "arguments": {}}

# Sends a prompt to the LLM asking them to choose the appropriate commands for the user's message.
async def choose_command(message: str, project_id: str | None) -> dict[str, Any]:
    prompt = f"""
You are deciding which backend command to call.

User message:
{message}

Current project_id, if provided:
{project_id}

{COMMAND_DESCRIPTIONS}

Return ONLY valid JSON in this format:
{{
  "command": "command_name",
  "arguments": {{}}
}}

If no command is useful, return:
{{
  "command": null,
  "arguments": {{}}
}}

Rules:
- Do not invent command names.
- Use only commands listed above.
- Use the minimum data needed.
"""

    try:
        raw = ask_llm(prompt)
    except Exception:
        logger.exception("LLM command-selection call failed")
        return {"command": None, "arguments": {}}

    return safe_json_loads(raw)

# Executes the functions for the correct commmands.
async def execute_command(command_name: str | None, arguments: dict[str, Any], session, current_user) -> dict[str, Any] | None:
    # Checks to command name is eligible.
    if not command_name:
        return None

    if command_name not in COMMANDS:
        logger.warning("Unknown chatbot command requested: %s", command_name)
        return {
            "success": False,
            "error": f"Unknown command: {command_name}",
        }

    # Tries the command and returns the result if succesful.
    try:
        result = await COMMANDS[command_name](
            session=session,
            current_user=current_user,
            **arguments,
        )

        return {
            "success": True,
            "command": command_name,
            "arguments": arguments,
            "data": result,
        }

    # Handles error if the command was called invalidly.
    except TypeError as exc:
        logger.exception("Chatbot command argument error: %s", command_name)
        return {
            "success": False,
            "command": command_name,
            "arguments": arguments,
            "error": "The selected command was called with invalid arguments.",
            "details": str(exc),
        }

    # Handles error if the command fails.
    except Exception as exc:
        logger.exception("Chatbot command failed: %s", command_name)
        return {
            "success": False,
            "command": command_name,
            "arguments": arguments,
            "error": "The selected command failed while retrieving project data.",
            "details": str(exc),
        }

# Generates answer message to be sent to the user by prompting the AI with the data.
async def generate_final_response(message: str, command_name: str | None, command_result: dict[str, Any] | None) -> str:
    if command_result is None:
        return "I do not have enough information to answer that question using the available project commands."

    final_prompt = f"""
You are an AI assistant for a project management system.

Rules:
- Answer only using the provided command result.
- Do not invent project details.
- If the command result contains an error, explain it briefly and safely.
- Keep the answer concise and practical.

User question:
{message}

Command used:
{command_name}

Command result:
{json.dumps(command_result, indent=2, default=str)}
"""

    try:
        response = ask_llm(final_prompt)
    except Exception:
        logger.exception("LLM final-response call failed")
        return "I retrieved the project data, but I could not generate an AI summary right now."

    if not response:
        return "I retrieved the project data, but I could not generate an AI summary right now."

    return response

# Main function that handles the chat using all the functions.
async def handle_chat(message: str, project_id: str | None, session, current_user,):
    # Chooses the appropriate commands.
    decision = await choose_command(message, project_id)

    # Saves the command and arguments.
    command_name = decision.get("command")
    arguments = decision.get("arguments", {})

    if not isinstance(arguments, dict):
        arguments = {}

    # Executes the command chosen by the LLM.
    command_result = await execute_command(
        command_name=command_name,
        arguments=arguments,
        session=session,
        current_user=current_user,
    )

    # Prompts the AI for the final result using the results of the command.
    response = await generate_final_response(
        message=message,
        command_name=command_name,
        command_result=command_result,
    )

    # Returns the response as well as the command name and result.
    return {
        "response": response,
        "command_used": command_name,
        "command_data": command_result,
    }