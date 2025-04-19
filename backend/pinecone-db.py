import os
import json
from datetime import datetime
import requests
import pinecone
from dotenv import load_dotenv
from pinecone import ServerlessSpec

load_dotenv()
JINA_API_KEY = os.getenv("JINA_API_KEY")
PINECONE_API_KEY = os.getenv("PINECONE_API_KEY")

print(f"JINA_API_KEY: {JINA_API_KEY[:10]}... (length: {len(JINA_API_KEY) if JINA_API_KEY else 0})")
print(f"PINECONE_API_KEY: {PINECONE_API_KEY[:10]}... (length: {len(PINECONE_API_KEY) if PINECONE_API_KEY else 0})")

if PINECONE_API_KEY and PINECONE_API_KEY.startswith("jina_"):
    print("WARNING: Your PINECONE_API_KEY appears to start with 'jina_'. This suggests it might be a Jina AI key rather than a Pinecone key.")
    print("Please check your API keys and update the .env file with the correct keys.")
    exit(1)

try:
    # Initialize Pinecone
    pc = pinecone.Pinecone(api_key=PINECONE_API_KEY)
    
    print("Attempting to list Pinecone indexes...")
    indexes = pc.list_indexes()
    print(f"Successfully connected to Pinecone. Available indexes: {[idx.name for idx in indexes]}")
    
    index_name = "health-claims"

    # Create index if it doesn't exist
    if index_name not in [idx.name for idx in indexes]:
        print(f"Creating new index: {index_name}")
        pc.create_index(
            name=index_name,
            dimension=256,
            metric='cosine',
            spec=ServerlessSpec(
                cloud="aws",        # or "gcp" depending on your Pinecone project
                region="us-east-1"  # ensure this matches your project
            )
        )

    # Connect to the created index
    index = pc.Index(index_name)

    # Jina AI setup
    JINA_URL = "https://api.jina.ai/v1/embeddings"

    HEADERS = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {JINA_API_KEY}"
    }

    def get_embedding(text: str) -> list[float]:
        payload = {
            "model": "jina-clip-v2",
            "input": [text],
            "normalized": False
        }
        resp = requests.post(JINA_URL, headers=HEADERS, json=payload)
        print(resp.json())
        return resp.json()

    print("Testing Jina AI connection...")
    test_embedding = get_embedding("Test embedding")

    print("Loading data file...")
    with open("backend/data/new_output.json", "r") as f:
        records = json.load(f)

    print(f"Loaded {len(records)} records from data file.")

    batch_size = 10
    to_upsert = []

    for rec in records:
        text = rec["Decision Rationale"]
        embedding = get_embedding(text)

        dt = datetime.utcfromtimestamp(rec["Decision Date"] / 1000).isoformat() + "Z"

        metadata = {
            "decision": rec["Decision"],
            "decision_date": dt,
            "condition": rec["Condition"],
            "treatment": rec["Treatment"],
            "coverage_type": rec["Coverage Type"],
            "rationale": text,
        }

        to_upsert.append((str(rec["id"]), embedding, metadata))

        if len(to_upsert) >= batch_size:
            index.upsert(vectors=to_upsert)
            to_upsert.clear()

    if to_upsert:
        index.upsert(vectors=to_upsert)

    print(f"Upserted {len(records)} records into Pinecone index '{index_name}'.")

except Exception as e:
    print(f"An error occurred: {str(e)}")
    print("Please check your API keys and environment settings.")
