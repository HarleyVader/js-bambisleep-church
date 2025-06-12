#!/usr/bin/env python3
"""
Simple test for the Python fetch server
"""

import json
import sys
import os
import asyncio

# Add the current directory to Python path
sys.path.insert(0, os.path.dirname(__file__))

async def test_fetch():
    """Test the fetch function directly"""
    # Import here to avoid issues
    from python_fetch_server_fixed import process_fetch_request
    
    request = {
        "url": "https://httpbin.org/get",
        "max_length": 500
    }
    
    print("Testing fetch request:")
    print(json.dumps(request, indent=2))
    print()
    
    try:
        result = await process_fetch_request(request)
        print("Result:")
        print(json.dumps(result, indent=2))
    except Exception as e:
        print(f"Error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(test_fetch())
