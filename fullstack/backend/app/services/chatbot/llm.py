import logging
import os

from openai import OpenAI

# Import Logging and openAI key.
logger = logging.getLogger(__name__)

client = OpenAI(
    api_key=os.getenv("OPENAI_API_KEY")
)

# Function to send a prompt for LLM.
def ask_llm(prompt: str) -> str | None:
    # Tries to send a prompt to the LLM.
    try:
        response = client.responses.create(
            model="gpt-4.1-mini",
            input=prompt,
        )

        return response.output_text
    # On failure, log as error and send None.
    except Exception:
        logger.exception("OpenAI request failed")
        return None