#!/usr/bin/env python3

import uvicorn
import os
from fastapi import FastAPI, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Optional
from dotenv import load_dotenv

# Import file storage directly
from file_storage import FileStorage

# Load environment variables from .env file
load_dotenv()

# Create a minimal test app for file uploads only
app = FastAPI(title="File Upload Test API")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/upload-test")
async def test_upload(
    files: List[UploadFile] = File(...),
    user_id: Optional[str] = Form(None)
):
    """Test endpoint for file uploads"""
    # Just return file information for testing
    result = []
    for file in files:
        result.append({
            "filename": file.filename,
            "content_type": file.content_type,
            "size": len(await file.read()),
            "user_id": user_id
        })
        # Reset file pointer
        await file.seek(0)
    
    return {"success": True, "files": result}

def main():
    """
    Run the test file upload server.
    """
    print("🧪 Starting File Upload Test Server...")
    
    # Get configuration from environment variables or use defaults
    host = os.getenv("API_HOST", "0.0.0.0")
    port = int(os.getenv("API_PORT", "8001"))  # Use a different port
    
    # Run the server
    uvicorn.run(
        "run_files_test:app", 
        host=host, 
        port=port, 
        reload=True,
        log_level="info"
    )
    
if __name__ == "__main__":
    main() 