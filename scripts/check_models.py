import google.generativeai as genai
import os
from dotenv import load_dotenv

load_dotenv('.env.local')
genai.configure(api_key=os.environ.get("GEMINI_API_KEY"))

print("Listing available models...")
try:
    for m in genai.list_models():
        if 'generateContent' in m.supported_generation_methods:
            print(m.name)
except Exception as e:
    print(f"Error listing models: {e}")
