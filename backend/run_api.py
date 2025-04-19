#!/usr/bin/env python3

import uvicorn
import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

def main():
    """
    Run the FastAPI application with the configured settings.
    """
    print("Starting Mental Health Claims API server...")
    
    # Get configuration from environment variables or use defaults
    host = os.getenv("API_HOST", "0.0.0.0")
    port = int(os.getenv("API_PORT", "8000"))
    
    # Run the server
    uvicorn.run(
        "main:app", 
        host=host, 
        port=port, 
        reload=True,
        log_level="info"
    )
    
if __name__ == "__main__":
    main() 