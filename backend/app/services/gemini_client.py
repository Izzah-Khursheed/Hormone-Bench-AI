import os
import google.generativeai as genai
from app.config import settings

# Configure Gemini API Key
genai.configure(api_key=getattr(settings, "GOOGLE_API_KEY", os.getenv("GOOGLE_API_KEY")))

def generate_response(prompt: str, model_name: str = "gemini-3.5-flash") -> str:
    """
    Utility function to generate LLM responses using Google Gemini API.
    """
    try:
        model = genai.GenerativeModel(model_name)
        response = model.generate_content(prompt)
        return response.text
    except Exception as e:
        return f"Error generating response from Gemini API: {str(e)}"