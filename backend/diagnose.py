#!/usr/bin/env python3

import requests
import sys
import os
import json
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

def check_backend(base_url="http://localhost:8000"):
    """Test backend endpoints to diagnose issues"""
    print(f"🔍 Diagnosing backend at {base_url}...")
    
    endpoints_to_check = [
        # Basic endpoints
        {'url': '/', 'method': 'GET', 'name': 'Root endpoint'},
        {'url': '/docs', 'method': 'GET', 'name': 'Swagger docs'},
        
        # Claims endpoints
        {'url': '/claims', 'method': 'GET', 'name': 'Claims list endpoint'},
        
        # File endpoints
        {'url': '/claims/mock-claim/files', 'method': 'GET', 'name': 'Get claim files endpoint'},
    ]
    
    issues_found = 0
    
    print("\n🧪 Testing API endpoints...\n")
    
    for endpoint in endpoints_to_check:
        try:
            url = f"{base_url}{endpoint['url']}"
            print(f"Testing: {endpoint['method']} {url} ({endpoint['name']})")
            
            if endpoint['method'] == 'GET':
                response = requests.get(url, timeout=5)
            
            # Status 404 for mock-claim is expected, so handle it specially
            if "mock-claim" in url and response.status_code == 404:
                print(f"✅ {endpoint['name']} is accessible (404 for mock ID is expected)")
                continue
                
            if response.status_code < 500:
                print(f"✅ {endpoint['name']} is accessible (status: {response.status_code})")
            else:
                print(f"❌ {endpoint['name']} is returning server error (status: {response.status_code})")
                issues_found += 1
                
        except requests.RequestException as e:
            print(f"❌ {endpoint['name']} is not accessible: {str(e)}")
            issues_found += 1
        
        print("")
    
    # Summary
    if issues_found == 0:
        print("\n✅ Diagnosis complete - no major issues found with API endpoints")
    else:
        print(f"\n❌ Diagnosis complete - {issues_found} issues found with API endpoints")
        print("""
Recommended actions:
1. Check that the server is running properly
2. Ensure all routers are registered in main.py
3. Verify that claims_api.py has all required endpoints defined
4. Restart the server with `python run_api.py`
""")

def main():
    """Run the diagnostic script"""
    print("🔧 Running backend diagnostics...\n")
    
    # Get port from arguments or use default
    base_url = "http://localhost:8000"
    if len(sys.argv) > 1:
        port = sys.argv[1]
        base_url = f"http://localhost:{port}"
    
    check_backend(base_url)

if __name__ == "__main__":
    main() 