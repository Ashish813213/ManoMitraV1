"""
Quick test to verify NVIDIA API connectivity
Run this before starting the main service
"""
import os
from dotenv import load_dotenv

load_dotenv()

api_key = os.getenv("NVIDIA_API_KEY")
if not api_key:
    print("ERROR: NVIDIA_API_KEY not found in .env")
    exit(1)

print(f"API Key found: {api_key[:10]}...")

try:
    from openai import OpenAI
    client = OpenAI(
        base_url="https://integrate.api.nvidia.com/v1",
        api_key=api_key
    )
    
    print("Testing NVIDIA API connection...")
    completion = client.chat.completions.create(
        model="nvidia/nemotron-3-nano-omni-30b-a3b-reasoning",
        messages=[{"role": "user", "content": "Say hello"}],
        max_tokens=50
    )
    
    # Check if response is valid
    if completion and completion.choices and len(completion.choices) > 0:
        response = completion.choices[0].message.content
        print(f"SUCCESS! NVIDIA API responded: {response[:100]}")
    else:
        print(f"ERROR: Invalid response from NVIDIA API: {completion}")
        exit(1)
    
except Exception as e:
    print(f"ERROR connecting to NVIDIA API: {e}")
    print("The service will still start but may use fallback responses")
    exit(1)
