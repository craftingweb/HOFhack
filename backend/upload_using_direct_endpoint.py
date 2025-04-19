#!/usr/bin/env python3

import requests
import os
import time
import sys

# Claim ID to use (same as in upload-pdfs.js)
CLAIM_ID = '6803989cb5170ea2ce83b047'

# File paths - these are the same files used in upload-pdfs.js
PDF_FILES = [
    '/Users/wesleylu/Desktop/hofhack/backend/Patient 1 - OCD Inpatient Request.pdf',
    '/Users/wesleylu/Desktop/hofhack/backend/Patient 2 - Anxiety Treatment Request.pdf',
    '/Users/wesleylu/Desktop/hofhack/backend/Patient 3 - Medication Prescription Request (1).pdf'
]

# Direct upload endpoint URL
UPLOAD_URL = 'http://localhost:8002/direct-upload'

def check_server_running():
    """Check if the direct upload server is running"""
    try:
        response = requests.get('http://localhost:8002/health')
        if response.status_code == 200:
            print("Direct upload server is running!")
            return True
        else:
            print(f"Server responded with status code: {response.status_code}")
            return False
    except requests.exceptions.ConnectionError:
        print("Could not connect to the direct upload server")
        return False

def upload_files():
    """Upload the PDF files to the direct upload endpoint"""
    # Check that all files exist
    for file_path in PDF_FILES:
        if not os.path.exists(file_path):
            print(f"Error: File not found: {file_path}")
            return False
    
    # Prepare files for upload
    files = []
    for file_path in PDF_FILES:
        file_name = os.path.basename(file_path)
        files.append(
            ('files', (file_name, open(file_path, 'rb'), 'application/pdf'))
        )
    
    # Prepare form data with claim_id
    data = {'claim_id': CLAIM_ID}
    
    print(f"Uploading {len(files)} files to {UPLOAD_URL} for claim {CLAIM_ID}...")
    
    # Send POST request to upload files
    try:
        response = requests.post(
            UPLOAD_URL,
            files=files,
            data=data
        )
        
        # Process response
        if response.status_code == 200:
            result = response.json()
            if 'success' in result and result['success']:
                print(f"Successfully uploaded {len(result['file_ids'])} files!")
                print(f"File IDs: {', '.join(result['file_ids'])}")
                for file_detail in result['files']:
                    print(f"  - {file_detail['filename']} ({file_detail['file_id']})")
                return True
            else:
                print(f"Upload failed: {result.get('error', 'Unknown error')}")
                return False
        else:
            print(f"Upload failed with status code: {response.status_code}")
            return False
    except Exception as e:
        print(f"Error during upload: {str(e)}")
        return False
    finally:
        # Close all file handles
        for file_tuple in files:
            file_tuple[1][1].close()

def main():
    """Main function to upload files"""
    # Wait for server to be ready
    tries = 0
    while tries < 5:
        if check_server_running():
            break
        print("Waiting for server to start...")
        time.sleep(2)
        tries += 1
    
    if tries == 5:
        print("Timed out waiting for server to start")
        print("Please make sure direct_upload_endpoint.py is running")
        sys.exit(1)
    
    # Upload the files
    if upload_files():
        print("All files uploaded successfully!")
    else:
        print("Failed to upload all files")
        sys.exit(1)

if __name__ == "__main__":
    main() 