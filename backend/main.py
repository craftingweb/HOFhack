from fastapi import FastAPI, UploadFile, File, HTTPException, Form, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import json
from datetime import datetime
import PyPDF2
import io
import requests
from langchain_community.embeddings import OpenAIEmbeddings
from langchain_community.chat_models import ChatOpenAI
from langchain_community.vectorstores import Pinecone
from langchain_community.embeddings import JinaEmbeddings
from langchain_deepseek import ChatDeepSeek
from langchain.chains import RetrievalQA
from langchain_pinecone import PineconeVectorStore
import pinecone
import os
from dotenv import load_dotenv
from pymongo import MongoClient
from pymongo.collection import Collection
from bson import ObjectId, SON

# Import routers
from claims_api import router as claims_router
from classifier import router as classifier_router, register_routes as register_classifier_routes
from submit_claim_to_provider import router as provider_router, register_routes as register_provider_routes
from openai import OpenAI

# Load environment variables
load_dotenv()
PINECONE_API_KEY = os.getenv("PINECONE_API_KEY")
MONGODB_URI = os.getenv("MONGODB_URI", "mongodb://localhost:27017")
DB_NAME = os.getenv("DB_NAME", "claims-management")
JINA_API_KEY = os.getenv("JINA_API_KEY")

app = FastAPI()

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(claims_router)
app.include_router(classifier_router)
app.include_router(provider_router)

# Alternative way to register routes if needed
# register_classifier_routes(app)
# register_provider_routes(app)

# Database connection for direct uploads
mongo_client = MongoClient(MONGODB_URI)
mongo_db = mongo_client[DB_NAME]

# Initialize Pinecone
pc = pinecone.Pinecone(api_key=PINECONE_API_KEY)
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
    
    embeddings = json_resp["data"][0]["embedding"]
    
    return embeddings

# Initialize OpenAI
DEEPSEEK_API_KEY = os.getenv("DEEPSEEK_API_KEY")
embeddings = JinaEmbeddings(
    api_key=JINA_API_KEY, 
    dimension=1024, 
    model="jina-clip-v2", 
    normalized=False
)

llm = ChatDeepSeek(
    api_key=DEEPSEEK_API_KEY,
    model="deepseek-chat",
    temperature=0,
    max_tokens=None,
    timeout=None,
)

# Initialize Pinecone indexes
index_name = "health-claims"
legal_index_name = "health-claims-legal-sourcing"
index = pc.Index(index_name)
legal_index = pc.Index(legal_index_name)
vectorstore = PineconeVectorStore(pinecone_api_key=PINECONE_API_KEY, index=index, embedding=embeddings)
legal_vectorstore = PineconeVectorStore(pinecone_api_key=PINECONE_API_KEY, index=legal_index, embedding=embeddings)

# DeepSeek configuration
DEEPSEEK_API_KEY = os.getenv("DEEPSEEK_API_KEY")
DEEPSEEK_URL = "https://api.deepseek.com"  # Replace with actual DeepSeek API endpoint
client = OpenAI(api_key=DEEPSEEK_API_KEY, base_url=DEEPSEEK_URL)

async def process_with_deepseek(text: str) -> dict:
    """
    Process text content with DeepSeek API to extract health claim information.
    """
#    headers = {
#        "Authorization": f"Bearer {DEEPSEEK_API_KEY}",
#        "Content-Type": "application/json"
#    }
    
    prompt = f"""
    Extract the following information from the provided text and return it in JSON format:
    - condition: The medical condition being treated: [Mental Health] or [Substance Abuse/ Addiction]
    - date: The date of the claim in ISO format
    - health_insurance_provider: The name of the insurance provider
    - requested_treatment: The treatment being requested
    - explanation: A comprehensive explanation of the claim

    Ensure you capture all the information from the text.
    Text to analyze:
    {text}
    """ 
    
    payload = {
        "model": "deepseek-chat",  # Replace with actual model name
        "messages": [
            {"role": "system", "content": "You are a helpful assistant that extracts health claim information from documents."},
            {"role": "user", "content": prompt}
        ],
        "temperature": 0.1,
        "max_tokens": 1000
    }
    
    try:
        response = client.chat.completions.create(
            model= "deepseek-chat",  # Replace with actual model name
            messages= [
                {"role": "system", "content": "You are a helpful assistant that extracts health claim information from documents."},
                {"role": "user", "content": prompt}
            ],
            temperature= 0.1,
            max_tokens= 1000
        )
        
        # Extract the JSON response from DeepSeek's completion
        extracted_text = response.choices[0].message.content

        # Parse the JSON response
        try:
            # If the response is already JSON, use it directly
            extracted_data = json.loads(extracted_text)
        except json.JSONDecodeError:
            # If the response is text, try to extract JSON from it
            # This is a fallback in case the model returns text with JSON embedded
            import re
            json_match = re.search(r'\{.*\}', extracted_text, re.DOTALL)
            if json_match:
                extracted_data = json.loads(json_match.group())
            else:
                raise ValueError("Could not extract JSON from DeepSeek response")
        
        return extracted_data
        
    except requests.exceptions.RequestException as e:
        raise HTTPException(status_code=500, detail=f"Error calling DeepSeek API: {str(e)}")
    except (KeyError, json.JSONDecodeError) as e:
        raise HTTPException(status_code=500, detail=f"Error processing DeepSeek response: {str(e)}")

# Pydantic models for request/response validation
class HealthClaim(BaseModel):
    condition: str
    date: str
    health_insurance_provider: str
    requested_treatment: str
    explanation: str

class AppealGuidance(BaseModel):
    guidelines: List[str]
    reasoning: str
    summary: str

@app.post("/process-pdfs", response_model=List[HealthClaim])
async def process_pdfs(files: List[UploadFile] = File(...)):
    """
    Process multiple PDF files and extract health claim information using DeepSeek.
    """
    results = []

    print(files)
    
    for file in files:
        if not file.filename.endswith('.pdf'):
            raise HTTPException(status_code=400, detail="Only PDF files are accepted")
        
        # Read PDF content
        contents = await file.read()
        pdf_file = io.BytesIO(contents)
        pdf_reader = PyPDF2.PdfReader(pdf_file)
        
        # Extract text from PDF
        text = ""
        for page in pdf_reader.pages:
            text += page.extract_text()
        
        # Process text with DeepSeek
        try:
            deepseek_response = await process_with_deepseek(text)
            print(deepseek_response)
            results.append(HealthClaim(**deepseek_response))
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Error processing PDF {file.filename}: {str(e)}")
    
    return results

@app.post("/get-appeal-guidance", response_model=AppealGuidance)
async def get_appeal_guidance(claim: HealthClaim):
    """
    Provide guidelines for improving the appeal using RAG with Pinecone database.
    """
    # Create a query from the claim details
    query = f"""
    Condition: {claim.condition}
    Treatment: {claim.requested_treatment}
    Provider: {claim.health_insurance_provider}
    Explanation: {claim.explanation}
    """
    
    # Get embeddings directly from Jina API
    query_embedding = get_embedding(query)    
    
    # Query Pinecone
    query_results = index.query(
        vector=query_embedding,
        top_k=3,
        include_metadata=True
    )
    
    # Process results and format response
    contexts = [item['metadata'] for item in query_results['matches']]
    
    # Pass contexts to DeepSeek for generating guidance
    combined_context = "\n\n".join(json.dumps(context) for context in contexts)
    
    prompt = f"""
    Based on the following reference information about health claims:
    {combined_context}
    
    Provide appeal guidance for this claim:
    Condition: {claim.condition}
    Treatment: {claim.requested_treatment}
    Provider: {claim.health_insurance_provider}
    Explanation: {claim.explanation}
    
    Give specific, actionable guidance for improving the appeal. Use the reference information to identify similar cases and provide examples.
    """
    
    response = client.chat.completions.create(
        model="deepseek-chat",
        messages=[
            {"role": "system", "content": "You are a health insurance claims expert."},
            {"role": "user", "content": prompt},
        ],
        temperature=0.1,
        max_tokens=8192
    )
    
    print(response.choices)
    guidance_text = response.choices[0].message.content

    response = client.chat.completions.create(
        model="deepseek-chat",
        messages=[
            {"role": "system", "content": "You are a health insurance claims expert."},
            {"role": "user", "content": "Summarize the following guidance, as well as the appeal as a whole, in a short, patient-friendly summary."},
            {"role": "user", "content": guidance_text}
        ],
        temperature=0.1,
        max_tokens=1000
    )

    summary = response.choices[0].message.content

    response = client.chat.completions.create(
        model="deepseek-chat",
        messages=[
            {"role": "system", "content": "You are a health insurance claims expert."},
            {"role": "user", "content": "Provide a complete, updated appeal letter based on the guidance and the original appeal."},
            {"role": "user", "content": guidance_text},
            {"role": "user", "content": (f"Condition: {claim.condition}\nTreatment: {claim.requested_treatment}\nProvider: {claim.health_insurance_provider}\nExplanation: {claim.explanation}")}
        ],
        temperature=0.1,
        max_tokens=8192
    )

    appeal_text = response.choices[0].message.content

    
    # Extract guidelines (assuming DeepSeek returns them in a list format)
    guidelines = [line.strip() for line in guidance_text.split("\n") if line.strip().startswith("Guideline")]
    if not guidelines:
        guidelines = ["Demonstrate medical necessity", "Ensure all required documentation is provided", "Justify the requested treatment"]
    
    return AppealGuidance(
        guidelines=guidelines,
        reasoning=guidance_text,
        summary=summary,
        appeal=appeal_text  
    )

@app.post("/get-legal-sourcing-guidance", response_model=AppealGuidance)
async def get_legal_sourcing_guidance(claim: HealthClaim):
    """
    Provide legal sourcing guidance using RAG with both Pinecone databases.
    """
    # Create a query from the claim details
    query = f"""
    Condition: {claim.condition}
    Treatment: {claim.requested_treatment}
    Provider: {claim.health_insurance_provider}
    Explanation: {claim.explanation}
    """
    
    # Get embeddings directly from Jina API
    query_embedding = get_embedding(query)    
    
    # Query both Pinecone indexes
    health_results = index.query(
        vector=query_embedding,
        top_k=3,
        include_metadata=True
    )
    
    legal_results = legal_index.query(
        vector=query_embedding,
        top_k=3,
        include_metadata=True
    )
    
    # Process results and format response
    health_contexts = [item['metadata'] for item in health_results['matches']]
    legal_contexts = [item['metadata'] for item in legal_results['matches']]
    
    # Combine contexts
    combined_context = "\n\nHealth Claims Context:\n" + "\n\n".join(json.dumps(context) for context in health_contexts)
    combined_context += "\n\nLegal Sourcing Context:\n" + "\n\n".join(json.dumps(context) for context in legal_contexts)
    
    prompt = f"""
    Based on the following reference information about health claims and legal precedents:
    {combined_context}
    
    Provide legal sourcing guidance for this claim:
    Condition: {claim.condition}
    Treatment: {claim.requested_treatment}
    Provider: {claim.health_insurance_provider}
    Explanation: {claim.explanation}
    
    Give specific, actionable guidance for:
    1. Legal precedents that support this claim
    2. Relevant case law citations
    3. Legal arguments that could strengthen the appeal
    4. Potential legal challenges and how to address them
    
    Use both the health claims and legal sourcing contexts to provide comprehensive guidance.
    """
    
    response = client.chat.completions.create(
        model="deepseek-chat",
        messages=[
            {"role": "system", "content": "You are a legal expert specializing in health insurance claims and appeals."},
            {"role": "user", "content": prompt},
        ],
        temperature=0.1,
        max_tokens=8192
    )
    
    guidance_text = response.choices[0].message.content

    response = client.chat.completions.create(
        model="deepseek-chat",
        messages=[
            {"role": "system", "content": "You are a legal expert specializing in health insurance claims and appeals."},
            {"role": "user", "content": "Summarize the following guidance, as well as the appeal as a whole, in a short, patient-friendly summary."},
            {"role": "user", "content": guidance_text}
        ],
        temperature=0.1,
        max_tokens=1000
    )

    summary = response.choices[0].message.content


    response = client.chat.completions.create(
        model="deepseek-chat",
        messages=[
            {"role": "system", "content": "You are a health insurance claims expert."},
            {"role": "user", "content": "Provide a complete, updated appeal letter based on the guidance and the original appeal."},
            {"role": "user", "content": guidance_text},
            {"role": "user", "content": (f"Condition: {claim.condition}\nTreatment: {claim.requested_treatment}\nProvider: {claim.health_insurance_provider}\nExplanation: {claim.explanation}")}
        ],
        temperature=0.1,
        max_tokens=8192
    )

    appeal_text = response.choices[0].message.content

    
    
    return AppealGuidance(
        guidelines=guidelines,
        reasoning=guidance_text,
        summary=summary,
        appeal=appeal_text  
    )

@app.post("/direct-upload")
async def direct_upload(
    files: List[UploadFile] = File(...),
    user_id: Optional[str] = Form(None),
    claim_id: Optional[str] = Query(None)
):
    """
    Upload files directly to MongoDB GridFS
    """
    print(f"Received direct upload request: claim={claim_id}, user={user_id}, files={len(files)}")
    
    # Check if claim exists when claim_id is provided
    if claim_id:
        try:
            # Try with ObjectId first
            try:
                claim = mongo_db.claims.find_one({"_id": ObjectId(claim_id)})
            except:
                claim = mongo_db.claims.find_one({"_id": claim_id})
                
            if not claim:
                claim = mongo_db.claims.find_one({"claimId": claim_id})
                
            if not claim:
                return {"error": f"Claim {claim_id} not found"}
        except Exception as e:
            print(f"Error checking claim: {str(e)}")
            return {"error": f"Error checking claim: {str(e)}"}
    
    # Process files
    file_ids = []
    file_details = []
    
    try:
        fs = mongo_db.fs
        
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
            
            print(f"Successfully uploaded file {filename} with ID {file_id_str}")
        
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
                update_result = mongo_db.claims.update_one(
                    claim_query,
                    {"$push": {"service.uploadedFiles": {"$each": file_ids}}}
                )
                
                if update_result.modified_count == 0:
                    # Try with claimId field as fallback
                    update_result = mongo_db.claims.update_one(
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

@app.post("/get-claim-likelihood")
async def get_claim_likelihood(claim: HealthClaim):
    """Get the likelihood of a claim being approved using our custom API."""
    headers = {
        "Content-Type": "application/json",
        "accept": "application/json"
    }
    content = "".join([
        f"Condition: {claim.condition}\n",
        f"Treatment: {claim.requested_treatment}\n",
        f"Provider: {claim.health_insurance_provider}\n",
        f"Explanation: {claim.explanation}\n"
    ])
    response = requests.post(
        "https://hofhack-production-8ba8.up.railway.app/predict",
        headers=headers,
        json={"text": content}
    )
    return response.json()


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000) 