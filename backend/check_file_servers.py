#!/usr/bin/env python3

import requests
import sys
import time
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

def check_server(url, name="Server"):
    """Check if a server is running at the specified URL"""
    print(f"Checking {name} at {url}...")
    
    try:
        start_time = time.time()
        response = requests.get(url, timeout=5)
        elapsed = time.time() - start_time
        
        if response.status_code < 500:
            print(f"✅ {name} is running (responded in {elapsed:.2f}s with status {response.status_code})")
            return True
        else:
            print(f"❌ {name} returned an error (status {response.status_code})")
            return False
    except requests.exceptions.ConnectionError:
        print(f"❌ {name} is not accessible - connection error")
        return False
    except requests.exceptions.Timeout:
        print(f"❌ {name} is not responding (timeout after 5s)")
        return False
    except Exception as e:
        print(f"❌ {name} check failed: {str(e)}")
        return False

def check_file_servers():
    """Check all file upload servers"""
    print("🔍 Checking file upload servers...\n")
    
    # Define servers to check
    servers = [
        {
            "url": "http://localhost:8000/docs",
            "name": "Main API Server"
        },
        {
            "url": "http://localhost:8001/docs",
            "name": "Test Upload Server"
        }
    ]
    
    # Check each server
    results = []
    for server in servers:
        result = check_server(server["url"], server["name"])
        results.append((server["name"], result))
        print("")
    
    # Summary
    print("\n📊 Server Status Summary:")
    all_running = True
    for name, status in results:
        status_text = "✅ Running" if status else "❌ Not running"
        all_running = all_running and status
        print(f"  {name}: {status_text}")
    
    # Overall status
    if all_running:
        print("\n✅ All servers are running!")
    else:
        print("\n⚠️ Some servers are not running!")
        print("Here's what you can do:")
        print("  1. Start the main API server: python run_api.py")
        print("  2. Start the test upload server: python run_files_test.py")
    
    return all_running

def main():
    print("🔧 File Upload Servers Diagnostic Tool\n")
    check_file_servers()

if __name__ == "__main__":
    main() 