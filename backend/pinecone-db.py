import os
import json
from datetime import datetime
import requests
import pinecone
from dotenv import load_dotenv
from pinecone import ServerlessSpec

# Load environment variables from .env file
load_dotenv()
JINA_API_KEY = os.getenv("JINA_API_KEY")
PINECONE_API_KEY = os.getenv("PINECONE_API_KEY")

print(f"JINA_API_KEY: {JINA_API_KEY[:10]}... (length: {len(JINA_API_KEY) if JINA_API_KEY else 0})")
print(f"PINECONE_API_KEY: {PINECONE_API_KEY[:10]}... (length: {len(PINECONE_API_KEY) if PINECONE_API_KEY else 0})")

if PINECONE_API_KEY and PINECONE_API_KEY.startswith("jina_"):
    print("WARNING: Your PINECONE_API_KEY appears to start with 'jina_'. This suggests it might be a Jina AI key rather than a Pinecone key.")
    print("Please check your API keys and update the .env file with the correct keys.")
    exit(1)

if True:
#try:
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
            dimension=1024,
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
        print(resp.content)
        print(f"Response received from Jina AI, status: {resp.status_code}")
        json_resp = resp.json()
        print(f"Full response: {json_resp}")
        
        if "data" not in json_resp:
            print(f"Error: Response missing 'data' key. Full response: {json_resp}")
            if "error" in json_resp:
                print(f"API Error: {json_resp['error']}")
            raise KeyError(f"Response missing 'data' key. Full response: {json_resp}")
        
        if not json_resp["data"]:
            raise ValueError("Response data is empty")
        
        if "embedding" not in json_resp["data"][0]:
            raise KeyError(f"Response missing 'embedding' key. Data: {json_resp['data'][0]}")
        
        return json_resp["data"][0]["embedding"]

    print("Testing Jina AI connection...")
    test_embedding = get_embedding("Test embedding")
    print(f"Successfully obtained test embedding with dimension: {len(test_embedding)}")

    # Get the absolute path to the data file
    data_file_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "data", "new_output.json")
    print(f"Looking for data file at: {data_file_path}")
    
    if not os.path.exists(data_file_path):
        raise FileNotFoundError(f"Data file not found at: {data_file_path}")

    print("Loading data file...")
    with open(data_file_path, "r") as f:
        records = json.load(f)

    print(f"Loaded {len(records)} records from data file.")

    batch_size = 10
    to_upsert = []
    processed_count = 0

    for rec in records[7300:]:
        id = rec["id"]
        del rec["id"]
        text = json.dumps(rec)
        embedding = get_embedding(text)
        processed_count += 1
        
        if processed_count % 10 == 0:
            print(f"Processed {processed_count}/{len(records)} records...")

        dt = datetime.utcfromtimestamp(rec["Decision Date"] / 1000).isoformat() + "Z"

        # Ensure all metadata fields have non-null values
        metadata = {
            "decision": rec.get("Decision", "") or "",
            "decision_date": dt,
            "condition": rec.get("Condition", "") or "",
            "treatment": rec.get("Treatment", "") or "",
            "coverage_type": rec.get("Coverage Type", "") or "",
            "rationale": text or "",
        }

        # Debug output to check for null values
        if processed_count <= 5:
            print(f"Record {processed_count} metadata:")
            for key, value in metadata.items():
                print(f"  {key}: {type(value).__name__} - {value[:30] if isinstance(value, str) and len(value) > 30 else value}")

        to_upsert.append((str(id), embedding, metadata))

        if len(to_upsert) >= batch_size:
            print(f"Upserting batch of {len(to_upsert)} records...")
            index.upsert(vectors=to_upsert)
            to_upsert.clear()
            print("Batch upserted successfully.")

    if to_upsert:
        print(f"Upserting final batch of {len(to_upsert)} records...")
        index.upsert(vectors=to_upsert)
        print("Final batch upserted successfully.")

    print(f"Upserted {len(records)} records into Pinecone index '{index_name}'.")

#except FileNotFoundError as e:
#    print(f"File not found error: {str(e)}")
#    print("Please check that the data file exists at the specified path.")
#except Exception as e:
#    print(f"An error occurred: {str(e)}")
#    print("Please check your API keys and environment settings.")
