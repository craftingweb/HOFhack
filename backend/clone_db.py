#!/usr/bin/env python3

import os
import time
from dotenv import load_dotenv
import pinecone
from pinecone import ServerlessSpec

# Load environment variables
load_dotenv()
PINECONE_API_KEY = os.getenv("PINECONE_API_KEY")

if not PINECONE_API_KEY:
    raise RuntimeError("PINECONE_API_KEY must be set in .env")

# Initialize Pinecone
pc = pinecone.Pinecone(api_key=PINECONE_API_KEY)

# Source and destination index names
SOURCE_INDEX = "health-claims"
DEST_INDEX = "health-claims-plus-legal"

def clone_database():
    """Clone all vectors from source index to destination index"""
    print(f"Starting database clone from {SOURCE_INDEX} to {DEST_INDEX}...")
    
    # Check if source index exists
    if SOURCE_INDEX not in [idx.name for idx in pc.list_indexes()]:
        raise RuntimeError(f"Source index {SOURCE_INDEX} does not exist")
    
    # Create destination index if it doesn't exist
    if DEST_INDEX not in [idx.name for idx in pc.list_indexes()]:
        print(f"Creating destination index {DEST_INDEX}...")
        pc.create_index(
            name=DEST_INDEX,
            dimension=1024,
            metric='cosine',
            spec=ServerlessSpec(
                cloud="aws",
                region="us-east-1"
            )
        )
        # Wait for index to be ready
        while not pc.describe_index(DEST_INDEX).status["ready"]:
            time.sleep(1)
    
    # Connect to both indexes
    source_index = pc.Index(SOURCE_INDEX)
    dest_index = pc.Index(DEST_INDEX)
    
    # Get total number of vectors in source index
    stats = source_index.describe_index_stats()
    total_vectors = stats['total_vector_count']
    print(f"Found {total_vectors} vectors in source index")
    
    # Fetch vectors in smaller batches
    batch_size = 100
    for start_idx in range(0, total_vectors, batch_size):
        # Generate IDs for this batch
        end_idx = min(start_idx + batch_size, total_vectors)
        vector_ids = [str(i) for i in range(start_idx, end_idx)]
        
        try:
            # Fetch batch from source
            fetch_response = source_index.fetch(ids=vector_ids)
            
            # Prepare vectors for upsert
            to_upsert = []
            for vector_id, vector_data in fetch_response.vectors.items():
                to_upsert.append({
                    'id': vector_id,
                    'values': vector_data.values,
                    'metadata': vector_data.metadata
                })
            
            # Upsert batch to destination
            if to_upsert:
                dest_index.upsert(vectors=to_upsert)
                print(f"Processed {end_idx}/{total_vectors} vectors")
                
        except Exception as e:
            print(f"Error processing batch {start_idx}-{end_idx}: {str(e)}")
            continue
            
        # Add small delay between batches
        time.sleep(0.5)
    
    print(f"✅ Successfully cloned vectors from {SOURCE_INDEX} to {DEST_INDEX}")

if __name__ == "__main__":
    clone_database()