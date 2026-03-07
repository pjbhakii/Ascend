from google import genai

# PUT YOUR REAL API KEY IN THE QUOTES BELOW
client = genai.Client(api_key="YOUR_API_KEY_HERE") 

print("Attempting to connect to Google...")
response = client.models.generate_content(model='gemini-2.5-flash', contents='Say the word "Hello" and nothing else.')
print(f"The AI says: {response.text}")