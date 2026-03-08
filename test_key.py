import os
from dotenv import load_dotenv

load_dotenv()
key = os.getenv("GOOGLE_API_KEY")

if key is None:
    print("❌ ERROR: Your .env file was NOT found or is empty.")
else:
    print(f"✅ SUCCESS: Found key starting with: {key[:8]}...")