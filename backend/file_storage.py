import os
import base64
from io import BytesIO
from typing import List, Optional
from datetime import datetime
from fastapi import UploadFile
from motor.motor_asyncio import AsyncIOMotorGridFSBucket
from pymongo import MongoClient
from pymongo.collection import Collection
from bson import ObjectId

from database import get_db

class FileStorage:
    """A utility class for storing and retrieving files from MongoDB using GridFS"""
    
    @staticmethod
    async def save_files(files: List[UploadFile], claim_id: str, user_id: Optional[str] = None) -> List[str]:
        """
        Save multiple files to GridFS and return their IDs
        
        Args:
            files: List of uploaded files
            claim_id: The ID of the claim associated with these files
            user_id: The ID of the user who uploaded the files (optional)
            
        Returns:
            List of file IDs stored in GridFS
        """
        db = get_db()
        fs = AsyncIOMotorGridFSBucket(db)
        file_ids = []
        
        for file in files:
            contents = await file.read()
            file_metadata = {
                "filename": file.filename,
                "content_type": file.content_type,
                "claim_id": claim_id,
                "uploaded_at": datetime.now()
            }
            
            if user_id:
                file_metadata["user_id"] = user_id
            
            file_id = await fs.upload_from_stream(
                file.filename,
                BytesIO(contents),
                metadata=file_metadata
            )
            file_ids.append(str(file_id))
            
            await file.seek(0)
            
        return file_ids
    
    @staticmethod
    async def get_file(file_id: str) -> Optional[dict]:
        """
        Retrieve a file from GridFS
        
        Args:
            file_id: The ID of the file to retrieve
            
        Returns:
            File details including the base64 encoded content
        """
        db = get_db()
        fs = AsyncIOMotorGridFSBucket(db)
        
        try:
            grid_out = await fs.open_download_stream(ObjectId(file_id))
            chunks = []
            
            async for chunk in grid_out:
                chunks.append(chunk)
            
            content = b''.join(chunks)
            
            # Get the metadata
            metadata = grid_out._file
            
            return {
                "file_id": file_id,
                "filename": metadata.get("filename", "unknown"),
                "content_type": metadata.get("content_type", "application/octet-stream"),
                "content": base64.b64encode(content).decode("utf-8"),
                "claim_id": metadata.get("claim_id"),
                "user_id": metadata.get("metadata", {}).get("user_id"),
                "uploaded_at": metadata.get("uploaded_at")
            }
        except Exception as e:
            print(f"Error retrieving file {file_id}: {e}")
            return None
    
    @staticmethod
    async def get_files_for_claim(claim_id: str) -> List[dict]:
        """
        Get all files associated with a claim
        
        Args:
            claim_id: The ID of the claim
            
        Returns:
            List of file details (without content)
        """
        db = get_db()
        files = []
        
        # Find all files with matching claim_id in metadata
        cursor = db.fs.files.find({"metadata.claim_id": claim_id})
        
        async for file_doc in cursor:
            files.append({
                "file_id": str(file_doc["_id"]),
                "filename": file_doc.get("filename", "unknown"),
                "content_type": file_doc.get("metadata", {}).get("content_type", "application/octet-stream"),
                "user_id": file_doc.get("metadata", {}).get("user_id"),
                "uploaded_at": file_doc.get("metadata", {}).get("uploaded_at")
            })
        
        return files
    
    @staticmethod
    async def get_files_for_user(user_id: str) -> List[dict]:
        """
        Get all files uploaded by a specific user
        
        Args:
            user_id: The ID of the user
            
        Returns:
            List of file details (without content)
        """
        db = get_db()
        files = []
        
        # Find all files with matching user_id in metadata
        cursor = db.fs.files.find({"metadata.user_id": user_id})
        
        async for file_doc in cursor:
            files.append({
                "file_id": str(file_doc["_id"]),
                "filename": file_doc.get("filename", "unknown"),
                "content_type": file_doc.get("metadata", {}).get("content_type", "application/octet-stream"),
                "claim_id": file_doc.get("metadata", {}).get("claim_id"),
                "uploaded_at": file_doc.get("metadata", {}).get("uploaded_at")
            })
        
        return files
    
    @staticmethod
    async def delete_file(file_id: str) -> bool:
        """
        Delete a file from GridFS
        
        Args:
            file_id: The ID of the file to delete
            
        Returns:
            True if deletion was successful, False otherwise
        """
        db = get_db()
        fs = AsyncIOMotorGridFSBucket(db)
        
        try:
            await fs.delete(ObjectId(file_id))
            return True
        except Exception as e:
            print(f"Error deleting file {file_id}: {e}")
            return False
    
    @staticmethod
    async def get_files_by_object_id(object_id: str) -> List[dict]:
        """
        Get all files that have a specific MongoDB ObjectId in their metadata.claim_id
        
        Args:
            object_id: The MongoDB ObjectId to search for
            
        Returns:
            List of file details (without content)
        """
        db = get_db()
        files = []
        
        # First try with the object_id as a string
        cursor = db.fs.files.find({"metadata.claim_id": object_id})
        
        async for file_doc in cursor:
            files.append({
                "file_id": str(file_doc["_id"]),
                "filename": file_doc.get("filename", "unknown"),
                "content_type": file_doc.get("metadata", {}).get("content_type", "application/octet-stream"),
                "user_id": file_doc.get("metadata", {}).get("user_id"),
                "uploaded_at": file_doc.get("metadata", {}).get("uploaded_at")
            })
        
        # If we didn't find any files, try with the object_id as an ObjectId
        if not files:
            try:
                obj_id = ObjectId(object_id)
                # Look for files where metadata.claim_id is the ObjectId
                cursor = db.fs.files.find({
                    "$or": [
                        {"metadata.mongodb_id": obj_id},
                        {"metadata.claim_mongodb_id": obj_id}
                    ]
                })
                
                async for file_doc in cursor:
                    files.append({
                        "file_id": str(file_doc["_id"]),
                        "filename": file_doc.get("filename", "unknown"),
                        "content_type": file_doc.get("metadata", {}).get("content_type", "application/octet-stream"),
                        "user_id": file_doc.get("metadata", {}).get("user_id"),
                        "uploaded_at": file_doc.get("metadata", {}).get("uploaded_at")
                    })
            except Exception as e:
                print(f"Error searching files with ObjectId: {e}")
        
        return files 