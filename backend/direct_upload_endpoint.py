#!/usr/bin/env python3

from fastapi import FastAPI, File, UploadFile, Form, Query
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Optional
import os
from dotenv import load_dotenv
import uvicorn
from datetime import datetime
from pymongo import MongoClient
from pymongo.collection import Collection
from bson import ObjectId

# Load environment variables from .env file
load_dotenv()

# Get MongoDB connection string from environment
MONGODB_URI = os.getenv("MONGODB_URI", "mongodb://localhost:27017")
DB_NAME = os.getenv("DB_NAME", "claims-management")

app = FastAPI(title="Direct File Upload API")

# Add CORS middleware to allow requests from the frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Database connection
client = MongoClient(MONGODB_URI)
db = client[DB_NAME]

@app.post("/direct-upload")
async def direct_upload(
    files: List[UploadFile] = File(...),
    user_id: Optional[str] = Form(None),
    claim_id: Optional[str] = Query(None)
):
    """
    Upload files directly to MongoDB GridFS
    """
    print(f"Received upload request for claim: {claim_id}, user: {user_id}, files: {len(files)}")
    
    # Check if claim exists when claim_id is provided
    if claim_id:
        try:
            # Try with ObjectId first
            try:
                claim = db.claims.find_one({"_id": ObjectId(claim_id)})
            except:
                claim = db.claims.find_one({"_id": claim_id})
                
            if not claim:
                claim = db.claims.find_one({"claimId": claim_id})
                
            if not claim:
                return {"error": f"Claim {claim_id} not found"}
        except Exception as e:
            print(f"Error checking claim: {str(e)}")
            return {"error": f"Error checking claim: {str(e)}"}
    
    # Process files
    file_ids = []
    file_details = []
    
    try:
        fs = db.fs
        
        for file in files:
            # Read file content
            content = await file.read()
            
            # Create file metadata
            filename = file.filename
            content_type = file.content_type or "application/octet-stream"
            
            metadata = {
                "filename": filename,
                "content_type": content_type,
                "uploaded_at": datetime.now(),
            }
            
            if claim_id:
                metadata["claim_id"] = claim_id
            
            if user_id:
                metadata["user_id"] = user_id
            
            # Insert file into GridFS
            file_id = fs.files.insert_one({
                "filename": filename,
                "chunkSize": 261120,
                "uploadDate": datetime.now(),
                "metadata": metadata
            }).inserted_id
            
            # Split content into chunks
            chunk_size = 261120  # Default GridFS chunk size
            chunks = [content[i:i+chunk_size] for i in range(0, len(content), chunk_size)]
            
            # Insert chunks
            for i, chunk in enumerate(chunks):
                fs.chunks.insert_one({
                    "files_id": file_id,
                    "n": i,
                    "data": chunk
                })
            
            # Reset file pointer
            await file.seek(0)
            
            # Add file ID to list
            file_id_str = str(file_id)
            file_ids.append(file_id_str)
            
            # Add file details
            file_details.append({
                "file_id": file_id_str,
                "filename": filename,
                "content_type": content_type,
                "size": len(content)
            })
            
            print(f"Uploaded file {filename} with ID {file_id_str}")
        
        # Update claim record with file IDs if a claim ID was provided
        if claim_id and file_ids:
            try:
                # Determine the correct _id format
                claim_query = None
                try:
                    obj_id = ObjectId(claim_id)
                    claim_query = {"_id": obj_id}
                except:
                    claim_query = {"_id": claim_id}
                
                # Try to update the claim
                update_result = db.claims.update_one(
                    claim_query,
                    {"$push": {"service.uploadedFiles": {"$each": file_ids}}}
                )
                
                if update_result.modified_count == 0:
                    # Try with claimId field as fallback
                    update_result = db.claims.update_one(
                        {"claimId": claim_id},
                        {"$push": {"service.uploadedFiles": {"$each": file_ids}}}
                    )
                
                print(f"Updated claim {claim_id} with {len(file_ids)} files")
            except Exception as e:
                print(f"Error updating claim: {str(e)}")
        
        return {
            "success": True,
            "file_ids": file_ids,
            "files": file_details,
            "message": f"Successfully uploaded {len(file_ids)} files"
        }
        
    except Exception as e:
        print(f"Error uploading files: {str(e)}")
        return {"error": f"Failed to upload files: {str(e)}"}

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "timestamp": datetime.now().isoformat()}

def main():
    """Run the direct upload API server"""
    port = int(os.environ.get("DIRECT_UPLOAD_PORT", 8002))
    
    print(f"Starting Direct Upload API on port {port}")
    uvicorn.run(
        "direct_upload_endpoint:app",
        host="0.0.0.0",
        port=port,
        reload=True,
        log_level="info"
    )

if __name__ == "__main__":
    main() 