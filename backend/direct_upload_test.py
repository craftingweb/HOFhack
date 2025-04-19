#!/usr/bin/env python3

import os
import sys
import uuid
import base64
import io
from datetime import datetime
from pymongo import MongoClient, ObjectId
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Get MongoDB connection string from environment
MONGODB_URI = os.getenv("MONGODB_URI", "mongodb://localhost:27017")

def create_simple_pdf(filename="test_doc.pdf"):
    """Create a simple PDF-like file for testing (without requiring reportlab)"""
    print(f"Creating test file: {filename}")
    
    # Create a simple text file with PDF-like header
    content = f"""%PDF-1.4
1 0 obj
<< /Title (Test PDF Document)
   /Author (Automated Test)
   /Subject (Testing File Upload)
   /Keywords (test, pdf, upload)
   /Creator (direct_upload_test.py)
   /CreationDate ({datetime.now().isoformat()})
>>
endobj
2 0 obj
<< /Type /Catalog
   /Pages 3 0 R
>>
endobj
3 0 obj
<< /Type /Pages
   /Kids [4 0 R]
   /Count 1
>>
endobj
4 0 obj
<< /Type /Page
   /Parent 3 0 R
   /Resources << >>
   /Contents 5 0 R
>>
endobj
5 0 obj
<< /Length 68 >>
stream
BT
/F1 24 Tf
100 700 Td
(Test PDF - {datetime.now().strftime("%Y-%m-%d %H:%M:%S")}) Tj
ET
stream
endobj
xref
0 6
0000000000 65535 f
0000000010 00000 n
0000000179 00000 n
0000000228 00000 n
0000000284 00000 n
0000000354 00000 n
trailer
<< /Root 2 0 R
   /Info 1 0 R
   /Size 6
>>
startxref
474
%%EOF
"""
    
    # Write to file
    with open(filename, 'w') as f:
        f.write(content)
    
    print(f"Created test file: {filename} ({len(content)} bytes)")
    return filename

def direct_upload_to_gridfs(file_path, claim_id=None, user_id=None):
    """Upload a file directly to MongoDB GridFS"""
    print(f"Uploading {file_path} directly to MongoDB GridFS...")
    
    try:
        # Connect to MongoDB
        client = MongoClient(MONGODB_URI)
        db = client.get_database("claims-management")
        
        # Check if the claim exists if claim_id is provided
        if claim_id:
            claim = db.claims.find_one({"_id": claim_id})
            if not claim:
                # Try with ObjectId
                try:
                    claim = db.claims.find_one({"_id": ObjectId(claim_id)})
                except:
                    pass
                
            if not claim:
                print(f"Warning: Claim with ID {claim_id} not found")
                create_claim = input("Create a test claim? (y/n): ").lower() == 'y'
                if create_claim:
                    claim_id = create_test_claim(db)
                    if not claim_id:
                        return False
                else:
                    return False
        
        # Read the file
        with open(file_path, 'rb') as f:
            file_data = f.read()
        
        # Create GridFS bucket
        fs = db.fs
        
        # Prepare metadata
        filename = os.path.basename(file_path)
        content_type = "application/pdf"
        
        metadata = {
            "filename": filename,
            "content_type": content_type,
            "uploaded_at": datetime.now(),
        }
        
        if claim_id:
            metadata["claim_id"] = claim_id
        
        if user_id:
            metadata["user_id"] = user_id
        
        # Insert file directly into GridFS files collection
        file_id = fs.files.insert_one({
            "filename": filename,
            "chunkSize": 261120,
            "uploadDate": datetime.now(),
            "metadata": metadata
        }).inserted_id
        
        # Split data into chunks
        chunk_size = 261120  # Default GridFS chunk size
        chunks = [file_data[i:i+chunk_size] for i in range(0, len(file_data), chunk_size)]
        
        # Insert chunks
        for i, chunk in enumerate(chunks):
            fs.chunks.insert_one({
                "files_id": file_id,
                "n": i,
                "data": chunk
            })
        
        print(f"✅ Successfully uploaded file to GridFS with ID: {file_id}")
        
        # Update claim if claim_id provided
        if claim_id:
            result = db.claims.update_one(
                {"_id": ObjectId(claim_id) if isinstance(claim_id, str) else claim_id},
                {"$push": {"service.uploadedFiles": str(file_id)}}
            )
            
            if result.modified_count:
                print(f"✅ Updated claim {claim_id} with new file ID")
            else:
                print(f"⚠️ Failed to update claim {claim_id} with new file ID")
        
        return str(file_id)
        
    except Exception as e:
        print(f"❌ Error uploading file to GridFS: {str(e)}")
        return None

def create_test_claim(db):
    """Create a test claim for file upload testing"""
    print(f"Creating test claim...")
    
    # Sample claim data
    claim_data = {
        "provider": {
            "providerType": "Individual",
            "providerName": "Dr. Test Provider",
            "networkStatus": "in-network"
        },
        "patient": {
            "patientName": "Test Patient",
            "patientInsuranceProvider": "Test Insurance Co."
        },
        "service": {
            "serviceType": "Therapy Session",
            "serviceDate": datetime.now().strftime("%Y-%m-%d"),
            "totalCharge": "150.00",
            "placeOfService": "Office",
            "paymentCollected": "50.00",
            "uploadedFiles": []
        },
        "submittedAt": datetime.now().isoformat(),
        "status": "submitted",
        "claimId": f"TEST-{uuid.uuid4().hex[:8].upper()}"
    }
    
    try:
        result = db.claims.insert_one(claim_data)
        claim_id = result.inserted_id
        print(f"✅ Created test claim with ID: {claim_id}")
        return claim_id
    except Exception as e:
        print(f"❌ Error creating test claim: {str(e)}")
        return None

def list_gridfs_files(claim_id=None):
    """List all files in GridFS, optionally filtered by claim_id"""
    try:
        # Connect to MongoDB
        client = MongoClient(MONGODB_URI)
        db = client.get_database("claims-management")
        fs = db.fs
        
        # Prepare query
        query = {}
        if claim_id:
            query["metadata.claim_id"] = claim_id
        
        # Find files
        cursor = fs.files.find(query)
        
        # Display results
        print("\n📁 Files in GridFS:")
        count = 0
        
        for file in cursor:
            count += 1
            file_id = file["_id"]
            filename = file.get("filename", "unknown")
            upload_date = file.get("uploadDate", "unknown")
            metadata = file.get("metadata", {})
            
            print(f"  {count}. ID: {file_id}")
            print(f"     Filename: {filename}")
            print(f"     Uploaded: {upload_date}")
            print(f"     Claim ID: {metadata.get('claim_id', 'N/A')}")
            print(f"     User ID: {metadata.get('user_id', 'N/A')}")
            print("")
        
        if count == 0:
            print("  No files found.")
        
        return count
    except Exception as e:
        print(f"❌ Error listing GridFS files: {str(e)}")
        return 0

def main():
    """Main function"""
    print("📄 Direct GridFS File Upload Tool 📄")
    print("This tool uploads files directly to MongoDB GridFS, bypassing the API")
    print("-------------------------------------------------------------")
    
    # Get command line arguments
    claim_id = None
    file_path = None
    user_id = "test-user"
    
    if len(sys.argv) > 1:
        # First arg could be claim ID or file path
        if os.path.exists(sys.argv[1]):
            file_path = sys.argv[1]
        else:
            claim_id = sys.argv[1]
    
    if len(sys.argv) > 2 and not file_path:
        file_path = sys.argv[2]
    
    # If no file path provided or file doesn't exist, create a test file
    if not file_path or not os.path.exists(file_path):
        file_path = create_simple_pdf()
    
    # If no claim ID provided, ask user
    if not claim_id:
        show_claims = input("Do you want to see existing claims? (y/n): ").lower() == 'y'
        if show_claims:
            try:
                client = MongoClient(MONGODB_URI)
                db = client.get_database("claims-management")
                claims = list(db.claims.find({}))
                
                if not claims:
                    print("No claims found in database.")
                else:
                    print("\nAvailable claims:")
                    for i, claim in enumerate(claims):
                        claim_id = claim.get("_id")
                        claim_ref = claim.get("claimId", "N/A")
                        patient = claim.get("patient", {}).get("patientName", "Unknown")
                        print(f"  {i+1}. ID: {claim_id} (Ref: {claim_ref}, Patient: {patient})")
                    
                    choice = input("\nEnter claim number to use, or press Enter to create new: ")
                    if choice.isdigit() and 0 < int(choice) <= len(claims):
                        claim_id = str(claims[int(choice)-1]["_id"])
            except Exception as e:
                print(f"Error fetching claims: {e}")
        
        if not claim_id:
            create_new = input("Create a new test claim? (y/n): ").lower() == 'y'
            if create_new:
                try:
                    client = MongoClient(MONGODB_URI)
                    db = client.get_database("claims-management")
                    claim_id = create_test_claim(db)
                except Exception as e:
                    print(f"Error creating claim: {e}")
    
    # Upload the file
    file_id = direct_upload_to_gridfs(file_path, claim_id, user_id)
    
    if file_id:
        # List all files (including the newly uploaded one)
        list_gridfs_files(claim_id)
    
if __name__ == "__main__":
    main() 