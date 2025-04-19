#!/usr/bin/env python3

import os
import sys
import requests
import tempfile
from pymongo import MongoClient
from pymongo.collection import Collection
from bson import ObjectId
from dotenv import load_dotenv
import argparse

# Load environment variables from .env file
load_dotenv()

# MongoDB connection info
MONGODB_URI = os.getenv("MONGODB_URI", "mongodb://localhost:27017")
DB_NAME = os.getenv("DB_NAME", "claims-management")

# Processing endpoint
PROCESS_ENDPOINT = "https://hofhack-production.up.railway.app/process-pdfs"

def get_claim_files(claim_id):
    """
    Retrieves files associated with a claim from MongoDB GridFS
    
    Args:
        claim_id (str): The ID of the claim
        
    Returns:
        list: List of tuples (file_id, filename, binary_data)
    """
    print(f"Connecting to MongoDB at {MONGODB_URI}...")
    client = MongoClient(MONGODB_URI)
    db = client[DB_NAME]
    
    # First, find the claim to get associated file IDs
    claim = None
    
    try:
        # Try with ObjectId
        claim = db.claims.find_one({"_id": ObjectId(claim_id)})
    except:
        # Try with string ID
        claim = db.claims.find_one({"_id": claim_id})
    
    if not claim:
        # Try with claimId field
        claim = db.claims.find_one({"claimId": claim_id})
    
    if not claim:
        print(f"Error: No claim found with ID: {claim_id}")
        return []
    
    print(f"Found claim: {claim['_id']} (claimId: {claim.get('claimId', 'N/A')})")
    
    # Get file IDs from claim
    file_ids = []
    if 'service' in claim and 'uploadedFiles' in claim['service']:
        file_ids = claim['service']['uploadedFiles']
    
    if not file_ids:
        print("No files found for this claim.")
        return []
    
    print(f"Found {len(file_ids)} files associated with the claim.")
    
    # Retrieve each file from GridFS
    files = []
    fs_files = db.fs.files
    fs_chunks = db.fs.chunks
    
    for file_id in file_ids:
        # Convert string ID to ObjectId if needed
        try:
            obj_id = ObjectId(file_id)
        except:
            obj_id = file_id
            
        # Get file metadata
        file_metadata = fs_files.find_one({"_id": obj_id})
        if not file_metadata:
            print(f"Warning: File with ID {file_id} not found in GridFS")
            continue
            
        filename = file_metadata.get("filename", f"file_{file_id}.pdf")
        
        # Get all chunks for this file
        chunks = list(fs_chunks.find({"files_id": obj_id}).sort("n", 1))
        if not chunks:
            print(f"Warning: No chunks found for file {file_id}")
            continue
            
        # Combine chunks to get complete file data
        file_data = b''.join(chunk["data"] for chunk in chunks)
        
        # Add to results
        files.append((file_id, filename, file_data))
        print(f"Retrieved file: {filename} ({file_id}) - {len(file_data)} bytes")
    
    client.close()
    return files

def process_files(files):
    """
    Sends files to the processing endpoint
    
    Args:
        files (list): List of tuples (file_id, filename, binary_data)
        
    Returns:
        dict: API response
    """
    if not files:
        print("No files to process.")
        return None
    
    print(f"Sending {len(files)} files to {PROCESS_ENDPOINT} for processing...")
    
    # Create temporary directory to store files
    with tempfile.TemporaryDirectory() as temp_dir:
        # Save files to temp directory
        file_paths = []
        for file_id, filename, file_data in files:
            file_path = os.path.join(temp_dir, filename)
            with open(file_path, 'wb') as f:
                f.write(file_data)
            file_paths.append(file_path)
        
        # Prepare files for upload
        files_for_upload = [
            ('files', (os.path.basename(path), open(path, 'rb'), 'application/pdf'))
            for path in file_paths
        ]
        
        try:
            # Make POST request to process PDFs
            response = requests.post(PROCESS_ENDPOINT, files=files_for_upload)
            
            # Close file handles
            for f in files_for_upload:
                f[1][1].close()
                
            if response.status_code == 200:
                result = response.json()
                print("Files successfully processed!")
                return result
            else:
                print(f"Processing failed with status code: {response.status_code}")
                print(f"Response: {response.text}")
                return None
        except Exception as e:
            print(f"Error during processing: {str(e)}")
            return None

def main():
    # Parse command line arguments
    parser = argparse.ArgumentParser(description='Get and process PDF files for a claim')
    parser.add_argument('claim_id', help='The ID of the claim to process')
    args = parser.parse_args()
    
    # Get claim ID from arguments
    claim_id = args.claim_id
    
    # Get files for the claim
    files = get_claim_files(claim_id)
    if not files:
        print("No files found for processing. Exiting.")
        sys.exit(1)
    
    # Process the files
    result = process_files(files)
    if result:
        print("Files were successfully processed!")
        print("Result:", result)
    else:
        print("Failed to process files.")
        sys.exit(1)

if __name__ == "__main__":
    main() 