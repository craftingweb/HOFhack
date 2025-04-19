#!/usr/bin/env python3

import os
import sys
import PyPDF2
import requests
import pinecone
from dotenv import load_dotenv
from pinecone import ServerlessSpec
from datetime import datetime

# Load environment variables
load_dotenv()
PINECONE_API_KEY = os.getenv("PINECONE_API_KEY")
JINA_API_KEY = os.getenv("JINA_API_KEY")

if not PINECONE_API_KEY or not JINA_API_KEY:
    raise RuntimeError("PINECONE_API_KEY and JINA_API_KEY must be set in .env")

# Initialize Pinecone
pc = pinecone.Pinecone(api_key=PINECONE_API_KEY)

# Index names
INDEX_NAMES = ["health-claims-plus-legal", "health-claims-legal-sourcing"]

def get_embedding(text: str) -> list[float]:
    """Get embedding from Jina AI API"""
    JINA_URL = "https://api.jina.ai/v1/embeddings"
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {JINA_API_KEY}"
    }
    
    payload = {
        "model": "jina-clip-v2",
        "input": [text],
        "normalized": False
    }
    
    response = requests.post(JINA_URL, headers=headers, json=payload)
    if response.status_code != 200:
        raise Exception(f"Jina API error: {response.text}")
    
    return response.json()["data"][0]["embedding"]

def process_pdf(pdf_path: str):
    """Process a PDF file and save embeddings to Pinecone"""
    print(f"Processing PDF: {pdf_path}")
    
    # Create indexes if they don't exist
    for index_name in INDEX_NAMES:
        if index_name not in [idx.name for idx in pc.list_indexes()]:
            print(f"Creating index {index_name}...")
            pc.create_index(
                name=index_name,
                dimension=1024,
                metric='cosine',
                spec=ServerlessSpec(
                    cloud="aws",
                    region="us-east-1"
                )
            )
    
    # Connect to indexes
    indexes = {name: pc.Index(name) for name in INDEX_NAMES}
    
    # Open PDF
    with open(pdf_path, 'rb') as file:
        pdf_reader = PyPDF2.PdfReader(file)
        total_pages = len(pdf_reader.pages)
        
        for page_num in range(total_pages):
            page = pdf_reader.pages[page_num]
            text = page.extract_text()
            
            if not text.strip():
                print(f"Skipping empty page {page_num + 1}")
                continue
            
            print(f"Processing page {page_num + 1}/{total_pages}")
            
            # Get embedding
            embedding = get_embedding(text)
            
            # Prepare metadata
            metadata = {
                "source": os.path.basename(pdf_path),
                "page": page_num + 1,
                "total_pages": total_pages,
                "processed_at": datetime.now().isoformat()
            }
            
            # Create vector ID
            vector_id = f"{os.path.basename(pdf_path)}_page_{page_num + 1}"
            
            # Prepare vector data
            vector_data = {
                'id': vector_id,
                'values': embedding,
                'metadata': metadata
            }
            
            # Upsert to both indexes
            for index_name, index in indexes.items():
                index.upsert(vectors=[vector_data])
                print(f"Saved to {index_name}")
    
    print("✅ PDF processing complete!")

def main():
    if len(sys.argv) != 2:
        print("Usage: python process_pdf_embeddings.py <pdf_path>")
        sys.exit(1)
    
    pdf_path = sys.argv[1]
    if not os.path.exists(pdf_path):
        print(f"Error: File not found: {pdf_path}")
        sys.exit(1)
    
    process_pdf(pdf_path)

if __name__ == "__main__":
    main() 