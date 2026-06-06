# app/services/chatbot/llm.py

import os
import json
from openai import OpenAI



def ask_llm(prompt: str) -> str:
    client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
    response = client.responses.create(
        model="gpt-4.1-mini",
        input=prompt
    )

    return response.output_text