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
from collections import defaultdict

# Load environment variables from .env file
load_dotenv()

# MongoDB connection info
MONGODB_URI = os.getenv("MONGODB_URI", "mongodb://localhost:27017")
DB_NAME = os.getenv("DB_NAME", "claims-management")

# Processing endpoint
PROCESS_ENDPOINT = "https://hofhack-production.up.railway.app/process-pdfs"

# Specific file IDs from the image
DEFAULT_FILE_IDS = [
    "6803b95d3d46504de8b76c93",  # Patient 1 - OCD Inpatient Request.pdf
    "6803b95e3d46504de8b76c95",  # Patient 2 - Anxiety Treatment Request.pdf
    "6803b95e3d46504de8b76c97",  # Patient 3 - Medication Prescription Request (1).pdf
]

def get_files_by_ids(file_ids):
    """
    Retrieves files from MongoDB GridFS by their IDs and groups them by claim ID
    
    Args:
        file_ids (list): List of file IDs to retrieve
        
    Returns:
        dict: Dictionary with claim_ids as keys and lists of file tuples as values
              Each file tuple is (file_id, filename, binary_data, metadata)
    """
    print(f"Connecting to MongoDB at {MONGODB_URI}...")
    client = MongoClient(MONGODB_URI)
    db = client[DB_NAME]
    
    # Dictionary to store files grouped by claim ID
    files_by_claim = defaultdict(list)
    
    # Retrieve each file from GridFS
    fs_files = db.fs.files
    fs_chunks = db.fs.chunks
    
    for file_id in file_ids:
        print(f"Retrieving file with ID: {file_id}")
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
        
        # Extract metadata
        metadata = file_metadata.get("metadata", {})
        claim_id = metadata.get("claim_id", "unknown_claim")
        
        # Log metadata for debugging
        print(f"File metadata: {metadata}")
        
        # Get all chunks for this file
        chunks = list(fs_chunks.find({"files_id": obj_id}).sort("n", 1))
        if not chunks:
            print(f"Warning: No chunks found for file {file_id}")
            continue
            
        # Combine chunks to get complete file data
        file_data = b''.join(chunk["data"] for chunk in chunks)
        
        # Add to results, grouped by claim ID
        files_by_claim[claim_id].append((file_id, filename, file_data, metadata))
        print(f"Retrieved file: {filename} ({file_id}) - {len(file_data)} bytes, Claim ID: {claim_id}")
    
    client.close()
    return files_by_claim

def search_files_by_claim(claim_id):
    """
    Searches for files in GridFS that are associated with a specific claim ID
    
    Args:
        claim_id (str): The claim ID to search for
        
    Returns:
        list: List of file IDs associated with the claim
    """
    print(f"Searching for files associated with claim ID: {claim_id}")
    client = MongoClient(MONGODB_URI)
    db = client[DB_NAME]
    
    # Search GridFS files collection for files with this claim ID in metadata
    fs_files = db.fs.files
    files = list(fs_files.find({"metadata.claim_id": claim_id}))
    
    file_ids = [str(file["_id"]) for file in files]
    print(f"Found {len(file_ids)} files with claim ID {claim_id}")
    
    client.close()
    return file_ids

def process_files_for_claim(claim_id, files):
    """
    Processes files for a specific claim
    
    Args:
        claim_id (str): The claim ID
        files (list): List of file tuples (file_id, filename, binary_data, metadata)
        
    Returns:
        dict: API response
    """
    if not files:
        print(f"No files to process for claim {claim_id}.")
        return None
    
    print(f"Processing {len(files)} files for claim {claim_id}...")
    
    # Create temporary directory to store files
    with tempfile.TemporaryDirectory() as temp_dir:
        # Save files to temp directory
        file_paths = []
        for file_id, filename, file_data, _ in files:
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
            print(f"Sending {len(files)} files to {PROCESS_ENDPOINT} for processing...")
            response = requests.post(
                PROCESS_ENDPOINT,
                files=files_for_upload,
                data={'claim_id': claim_id}  # Include claim_id in the request
            )
            
            # Close file handles
            for f in files_for_upload:
                f[1][1].close()
                
            if response.status_code == 200:
                result = response.json()
                print(f"Files for claim {claim_id} successfully processed!")
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
    parser = argparse.ArgumentParser(description='Process PDF files by file ID or claim ID')
    parser.add_argument('--file-ids', nargs='+', help='File IDs to process (space-separated)')
    parser.add_argument('--claim-id', help='Claim ID to search for and process files')
    args = parser.parse_args()
    
    if args.claim_id:
        # If claim ID is provided, search for files with that claim ID
        file_ids = search_files_by_claim(args.claim_id)
        if not file_ids:
            print(f"No files found for claim ID {args.claim_id}. Exiting.")
            sys.exit(1)
    else:
        # Otherwise use provided file IDs or default ones
        file_ids = args.file_ids if args.file_ids else DEFAULT_FILE_IDS
    
    print(f"Processing files with IDs: {', '.join(file_ids)}")
    
    # Get files and group them by claim ID
    files_by_claim = get_files_by_ids(file_ids)
    
    if not files_by_claim:
        print("No files found for processing. Exiting.")
        sys.exit(1)
    
    # Process files for each claim
    results = {}
    for claim_id, files in files_by_claim.items():
        print(f"\nProcessing files for claim: {claim_id}")
        for file_id, filename, _, _ in files:
            print(f"  - {filename} ({file_id})")
        
        result = process_files_for_claim(claim_id, files)
        results[claim_id] = result
    
    # Report results
    print("\nProcessing Summary:")
    for claim_id, result in results.items():
        if result:
            print(f"Claim {claim_id}: Successfully processed")
        else:
            print(f"Claim {claim_id}: Failed to process")
    
    # Check if any processing failed
    if any(result is None for result in results.values()):
        print("Some files failed to process.")
        sys.exit(1)
    else:
        print("All files processed successfully!")

if __name__ == "__main__":
    main() 