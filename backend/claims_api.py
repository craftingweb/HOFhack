from fastapi import APIRouter, HTTPException, Query, Body, File, UploadFile, Form, Depends, FastAPI
from fastapi.responses import JSONResponse, StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Optional, Dict, Any
from pydantic import BaseModel
import json
import base64
from bson import ObjectId
from datetime import datetime

from claim_models import Claim, ClaimInDB, ClaimStatus
from claim_service import ClaimService
from file_storage import FileStorage

router = APIRouter(prefix="/claims", tags=["claims"])
claim_service = ClaimService()

# Create a standalone app for backward compatibility
app = FastAPI(title="Claims API")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.include_router(router)

# Add direct routes to the app as well for backup
@app.post("/claims/{claim_id}/files")
async def app_upload_files(
    claim_id: str,
    files: List[UploadFile] = File(...),
    user_id: Optional[str] = Form(None)
):
    """Direct endpoint for file uploads"""
    # Check if the claim exists
    claim = claim_service.get_claim_by_id(claim_id)
    if not claim:
        raise HTTPException(status_code=404, detail=f"Claim {claim_id} not found")
    
    # Save files to GridFS with user_id if provided
    file_ids = await FileStorage.save_files(files, claim_id, user_id)
    
    # Update the claim with the file IDs
    claim_dict = claim.model_dump()
    if 'service' in claim_dict and 'uploadedFiles' in claim_dict['service']:
        claim_dict['service']['uploadedFiles'].extend(file_ids)
    else:
        claim_dict['service']['uploadedFiles'] = file_ids
    
    # Update the claim in the database
    updated_claim = claim_service.update_claim(claim_id, Claim(**claim_dict))
    
    return {"file_ids": file_ids}

@app.get("/claims/{claim_id}/files")
async def app_get_claim_files(claim_id: str):
    """Direct endpoint for getting claim files"""
    # Check if the claim exists
    claim = claim_service.get_claim_by_id(claim_id)
    if not claim:
        raise HTTPException(status_code=404, detail=f"Claim {claim_id} not found")
    
    # Get files from GridFS
    files = await FileStorage.get_files_for_claim(claim_id)
    
    return files

@app.get("/claims/by-object-id/{object_id}/files")
async def app_get_files_by_object_id(object_id: str):
    """
    Get files associated with a MongoDB Object ID (either as the claim's _id or
    where the Object ID is in the claim_id field of file metadata)
    """
    # First check if there's a claim with this ObjectId
    try:
        obj_id = ObjectId(object_id)
        claim = claim_service.get_claim_by_object_id(obj_id)
        
        if claim:
            # If claim exists, get files by claim ID
            files = await FileStorage.get_files_for_claim(claim.claimId)
            return {"success": True, "files": files}
    except Exception as e:
        print(f"Error checking claim by ObjectId: {str(e)}")
    
    # If no claim found or error occurred, search directly in GridFS metadata
    try:
        db = claim_service.db
        files = []
        
        # Check for files with this specific ObjectId as claim_id in metadata
        cursor = db.fs.files.find({"metadata.claim_id": object_id})
        async for file_doc in cursor:
            files.append({
                "_id": str(file_doc["_id"]),
                "filename": file_doc.get("filename", "unknown"),
                "uploadDate": file_doc.get("uploadDate", datetime.now()),
                "metadata": {
                    "content_type": file_doc.get("metadata", {}).get("content_type", "application/octet-stream"),
                    "user_id": file_doc.get("metadata", {}).get("user_id"),
                    "claim_id": file_doc.get("metadata", {}).get("claim_id"),
                    "uploaded_at": file_doc.get("metadata", {}).get("uploaded_at")
                }
            })
        
        return {"success": True, "files": files}
    except Exception as e:
        print(f"Error searching files by ObjectId: {str(e)}")
        return {"success": False, "error": f"Failed to search files: {str(e)}"}

class ClaimResponse(BaseModel):
    claim: ClaimInDB

class ClaimsResponse(BaseModel):
    claims: List[ClaimInDB]
    total: int

class FileResponse(BaseModel):
    file_id: str
    filename: str
    content_type: str
    uploaded_at: Optional[Any] = None

@router.post("", response_model=ClaimResponse)
async def create_claim(claim: Claim = Body(...)):
    """Create a new claim"""
    created_claim = claim_service.create_claim(claim)
    return {"claim": created_claim}

@router.post("/{claim_id}/files")
async def upload_files(
    claim_id: str,
    files: List[UploadFile] = File(...),
    user_id: Optional[str] = Form(None)
):
    """
    Upload multiple files and associate them with a claim
    
    Args:
        claim_id: The ID of the claim
        files: List of files to upload
        user_id: Optional ID of the user uploading the files
        
    Returns:
        List of file IDs
    """
    # Check if the claim exists
    claim = claim_service.get_claim_by_id(claim_id)
    if not claim:
        raise HTTPException(status_code=404, detail=f"Claim {claim_id} not found")
    
    # Save files to GridFS with user_id if provided
    file_ids = await FileStorage.save_files(files, claim_id, user_id)
    
    # Update the claim with the file IDs
    claim_dict = claim.model_dump()
    if 'service' in claim_dict and 'uploadedFiles' in claim_dict['service']:
        claim_dict['service']['uploadedFiles'].extend(file_ids)
    else:
        claim_dict['service']['uploadedFiles'] = file_ids
    
    # Update the claim in the database
    updated_claim = claim_service.update_claim(claim_id, Claim(**claim_dict))
    
    return {"file_ids": file_ids}

@router.get("/{claim_id}/files", response_model=List[FileResponse])
async def get_claim_files(claim_id: str):
    """
    Get all files associated with a claim
    
    Args:
        claim_id: The ID of the claim
        
    Returns:
        List of file details
    """
    # Check if the claim exists
    claim = claim_service.get_claim_by_id(claim_id)
    if not claim:
        raise HTTPException(status_code=404, detail=f"Claim {claim_id} not found")
    
    # Get files from GridFS
    files = await FileStorage.get_files_for_claim(claim_id)
    
    return files

@router.get("/user/{user_id}/files", response_model=List[FileResponse])
async def get_user_files(user_id: str):
    """
    Get all files uploaded by a specific user
    
    Args:
        user_id: The ID of the user
        
    Returns:
        List of file details
    """
    files = await FileStorage.get_files_for_user(user_id)
    return files

@router.get("/files/{file_id}")
async def get_file(file_id: str, download: bool = Query(False)):
    """
    Get a file by ID
    
    Args:
        file_id: The ID of the file
        download: If True, return the file as a download, otherwise return file info
        
    Returns:
        File details or the file itself for download
    """
    file = await FileStorage.get_file(file_id)
    if not file:
        raise HTTPException(status_code=404, detail=f"File {file_id} not found")
    
    if download:
        # Return the file for download
        content = base64.b64decode(file["content"])
        
        return StreamingResponse(
            iter([content]),
            media_type=file["content_type"],
            headers={"Content-Disposition": f"attachment; filename={file['filename']}"}
        )
    
    # Remove the content to avoid sending large base64 data
    file_info = {k: v for k, v in file.items() if k != "content"}
    return file_info

@router.delete("/files/{file_id}")
async def delete_file(file_id: str):
    """
    Delete a file
    
    Args:
        file_id: The ID of the file
        
    Returns:
        Success message
    """
    success = await FileStorage.delete_file(file_id)
    if not success:
        raise HTTPException(status_code=404, detail=f"File {file_id} not found or could not be deleted")
    
    return {"detail": "File deleted successfully"}

@router.get("", response_model=ClaimsResponse)
async def get_claims(
    status: Optional[str] = Query(None, description="Filter by claim status"),
    limit: int = Query(100, ge=1, le=1000),
    offset: int = Query(0, ge=0)
):
    """Get claims with optional filtering"""
    # Convert status string to enum if provided
    status_enum = None
    if status:
        try:
            status_enum = ClaimStatus(status)
        except ValueError:
            raise HTTPException(status_code=400, detail=f"Invalid status: {status}")
    
    claims = claim_service.get_claims(status=status_enum, limit=limit, offset=offset)
    
    # Count total for pagination
    # In a production app, you might want to optimize this count query
    if status_enum:
        total = claim_service.collection.count_documents({"status": status_enum.value})
    else:
        total = claim_service.collection.count_documents({})
    
    return {"claims": claims, "total": total}

@router.get("/{claim_id}", response_model=ClaimResponse)
async def get_claim(claim_id: str):
    """Get a claim by ID"""
    claim = claim_service.get_claim_by_id(claim_id)
    if not claim:
        raise HTTPException(status_code=404, detail=f"Claim {claim_id} not found")
    return {"claim": claim}

@router.put("/{claim_id}", response_model=ClaimResponse)
async def update_claim(claim_id: str, updated_claim: Claim = Body(...)):
    """Update a claim"""
    result = claim_service.update_claim(claim_id, updated_claim)
    if not result:
        raise HTTPException(status_code=404, detail=f"Claim {claim_id} not found")
    return {"claim": result}

@router.patch("/{claim_id}/status", response_model=ClaimResponse)
async def update_claim_status(
    claim_id: str, 
    status: ClaimStatus = Body(..., embed=True)
):
    """Update the status of a claim"""
    updated_claim = claim_service.update_claim_status(claim_id, status)
    if not updated_claim:
        raise HTTPException(status_code=404, detail=f"Claim {claim_id} not found")
    return {"claim": updated_claim}

@router.delete("/{claim_id}")
async def delete_claim(claim_id: str):
    """Delete a claim"""
    success = claim_service.delete_claim(claim_id)
    if not success:
        raise HTTPException(status_code=404, detail=f"Claim {claim_id} not found")
    return {"detail": "Claim deleted successfully"}

@router.get("/by-object-id/{object_id}/files", response_model=List[FileResponse])
async def get_files_by_object_id(object_id: str):
    """
    Get all files associated with a MongoDB Object ID
    
    Args:
        object_id: The MongoDB Object ID to search for in file metadata
        
    Returns:
        List of file details
    """
    # First check if there's a claim with this ObjectId
    try:
        obj_id = ObjectId(object_id)
        claim = claim_service.get_claim_by_object_id(obj_id)
        
        if claim:
            # If claim exists, get files by claim ID
            files = await FileStorage.get_files_for_claim(claim.claimId)
            return files
    except Exception as e:
        print(f"Error checking claim by ObjectId: {str(e)}")
    
    # If no claim found or error occurred, try to get files directly by ObjectId metadata
    files = await FileStorage.get_files_by_object_id(object_id)
    return files 