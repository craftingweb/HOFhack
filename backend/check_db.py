#!/usr/bin/env python3

import os
import sys
from pymongo import MongoClient
from dotenv import load_dotenv
from datetime import datetime
from bson import ObjectId

# Load environment variables
load_dotenv()

# Get MongoDB connection string from environment variables
MONGODB_URI = os.getenv("MONGODB_URI", "mongodb://localhost:27017")

def check_db_connection():
    """Check connection to MongoDB"""
    print("Checking MongoDB connection...")
    
    try:
        # Connect to MongoDB
        client = MongoClient(MONGODB_URI, serverSelectionTimeoutMS=5000)
        
        # Check the connection
        client.admin.command('ismaster')
        print("✅ MongoDB connection successful!")
        return True
    except Exception as e:
        print(f"❌ MongoDB connection failed: {str(e)}")
        return False

def list_claims():
    """List all claims in the database"""
    print("\nFetching claims from database...")
    
    try:
        # Connect to MongoDB
        client = MongoClient(MONGODB_URI)
        db = client.get_database("claims-management")
        
        # Get all claims
        claims = list(db.claims.find({}))
        
        # Display results
        if not claims:
            print("No claims found in database.")
            return []
        
        print(f"\n📋 Found {len(claims)} claims:")
        for i, claim in enumerate(claims):
            claim_id = claim.get("_id")
            claim_ref = claim.get("claimId", "N/A")
            patient = claim.get("patient", {}).get("patientName", "Unknown")
            status = claim.get("status", "unknown")
            provider = claim.get("provider", {}).get("providerName", "Unknown")
            
            # Count uploaded files
            uploaded_files = claim.get("service", {}).get("uploadedFiles", [])
            file_count = len(uploaded_files)
            
            print(f"  {i+1}. ID: {claim_id}")
            print(f"     Reference: {claim_ref}")
            print(f"     Patient: {patient}")
            print(f"     Provider: {provider}")
            print(f"     Status: {status}")
            print(f"     Files: {file_count}")
            print("")
        
        return claims
    except Exception as e:
        print(f"❌ Error listing claims: {str(e)}")
        return []

def list_gridfs_files():
    """List all files in GridFS"""
    print("\nFetching files from GridFS...")
    
    try:
        # Connect to MongoDB
        client = MongoClient(MONGODB_URI)
        db = client.get_database("claims-management")
        fs = db.fs
        
        # Find files
        cursor = fs.files.find({})
        files = list(cursor)
        
        # Display results
        if not files:
            print("No files found in GridFS.")
            return
        
        print(f"\n📁 Found {len(files)} files in GridFS:")
        for i, file in enumerate(files):
            file_id = file["_id"]
            filename = file.get("filename", "unknown")
            upload_date = file.get("uploadDate", "unknown")
            metadata = file.get("metadata", {})
            
            claim_id = metadata.get("claim_id", "N/A")
            
            # Try to get claim details if claim_id exists
            claim_info = ""
            if claim_id != "N/A":
                try:
                    # Try with ObjectId
                    claim = None
                    try:
                        claim = db.claims.find_one({"_id": ObjectId(claim_id)})
                    except:
                        claim = db.claims.find_one({"_id": claim_id})
                    
                    if claim:
                        claim_ref = claim.get("claimId", "N/A")
                        patient = claim.get("patient", {}).get("patientName", "Unknown")
                        claim_info = f" (Claim: {claim_ref}, Patient: {patient})"
                except:
                    pass
            
            print(f"  {i+1}. ID: {file_id}")
            print(f"     Filename: {filename}")
            print(f"     Uploaded: {upload_date}")
            print(f"     Claim ID: {claim_id}{claim_info}")
            print(f"     User ID: {metadata.get('user_id', 'N/A')}")
            print(f"     Content Type: {metadata.get('content_type', 'unknown')}")
            print("")
    except Exception as e:
        print(f"❌ Error listing GridFS files: {str(e)}")

def main():
    """Main function"""
    print("🔍 MongoDB Claims & Files Inspector 🔍")
    print("-------------------------------------\n")
    
    # Check if MongoDB is accessible
    if not check_db_connection():
        print("\nPlease check your MongoDB configuration:")
        print(f"  Connection string: {MONGODB_URI}")
        print("  Make sure MongoDB is running and accessible.")
        return
    
    # List claims
    claims = list_claims()
    
    # List files
    list_gridfs_files()
    
    # Show summary
    print("\n📊 Database Summary:")
    print(f"  Claims: {len(claims)}")
    
    # Offer to run the direct upload tool
    print("\nNext steps:")
    print("  1. To upload a PDF file, run: python direct_upload_test.py")
    print("  2. To check API server status, run: python check_file_servers.py")

if __name__ == "__main__":
    main() 