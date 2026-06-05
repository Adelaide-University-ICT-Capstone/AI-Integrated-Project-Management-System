import json
from app.services.chatbot.llm import ask_llm
from app.services.chatbot.commands import COMMANDS

COMMAND_DESCRIPTIONS = """
Available commands:

1. get_visible_projects_summary
Use when the user asks for all projects, project summaries,
or project overviews.

Arguments: {}

2. get_project_details
Use when the user asks about a specific project's status, due date, progress, invoice status, client, or general details.
The project can be identified by UUID, job number, or exact project name.
Arguments: {"project_identifier": "string"}

3. get_overdue_projects
Use when the user asks:

- Which projects are overdue?
- What projects have passed their due date?
- Which projects need urgent attention?

Arguments: {}

4. get_delayed_projects
Use when the user asks:

- Which projects are delayed?
- What projects are behind schedule?
- What projects are at risk?

Arguments: {}

5. get_projects_due_soon
Use when the user asks:

- What projects are due soon?
- What projects are due this week?
- What deadlines are coming up?

Arguments:
{
  "days": 7
}

6. get_project_tasks
Use when the user asks about tasks, milestones, remaining work, or task progress for a specific project.
The project can be identified by UUID, job number, or exact project name.
Arguments: {"project_identifier": "string"}

7. get_invoice_summary
Use when the user asks about invoice totals, monthly invoice summary, revenue this month, or comparison with last month.
Arguments: {}
"""

async def choose_command(message: str, project_id: int | None):
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
"""

    raw = ask_llm(prompt)

    try:
        return json.loads(raw)
    except json.JSONDecodeError:
        return {"command": None, "arguments": {}}


async def handle_chat(
    message: str,
    project_id: str | None,
    session,
    current_user,
):
    decision = await choose_command(message, project_id)

    command_name = decision.get("command")
    arguments = decision.get("arguments", {})

    command_data = None

    if command_name in COMMANDS:
        if command_name == "get_project_status":
            if "project_id" not in arguments:
                arguments["project_id"] = project_id

        command_data = await COMMANDS[command_name](
    session=session,
    current_user=current_user,
    **arguments,
)

    final_prompt = f"""
You are an AI assistant for a project management system.

Rules:
- Answer only using the provided command data.
- Do not invent project details.
- If the command data is missing, say you do not have enough information.
- Keep the answer concise and practical.
    

User question:
{message}

Command used:
{command_name}

Command data:
{json.dumps(command_data, indent=2, default=str)}
"""

    response = ask_llm(final_prompt)

    return {
        "response": response,
        "command_used": command_name,
        "command_data": command_data
    }