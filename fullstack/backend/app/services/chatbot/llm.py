import logging
import os

from openai import OpenAI

logger = logging.getLogger(__name__)

client = OpenAI(
    api_key=os.getenv("OPENAI_API_KEY")
)


def ask_llm(prompt: str) -> str | None:
    try:
        response = client.responses.create(
            model="gpt-4.1-mini",
            input=prompt,
        )

        return response.output_text

    except Exception:
        logger.exception("OpenAI request failed")
        return None