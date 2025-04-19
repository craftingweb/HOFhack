from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import json
from datetime import datetime
import PyPDF2
import io
import requests
from langchain.vectorstores import Pinecone
from langchain.embeddings import JinaEmbeddings
from langchain_deepseek import ChatDeepSeek
from langchain.chains import RetrievalQA
from langchain_pinecone import PineconeVectorStore
import pinecone
import os
from dotenv import load_dotenv
from openai import OpenAI

# Load environment variables
load_dotenv()
PINECONE_API_KEY = os.getenv("PINECONE_API_KEY")
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

# Initialize Pinecone index
index_name = "health-claims"
index = pc.Index(index_name)
vectorstore = PineconeVectorStore(pinecone_api_key=PINECONE_API_KEY, index=index, embedding=embeddings)

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
    - condition: The medical condition being treated
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
    
    Give specific, actionable guidance for improving the appeal.
    """
    
    response = client.chat.completions.create(
        model="deepseek-chat",
        messages=[
            {"role": "system", "content": "You are a health insurance claims expert."},
            {"role": "user", "content": prompt}
        ],
        temperature=0.1,
        max_tokens=1000
    )
    
    guidance_text = response.choices[0].message.content
    
    # Extract guidelines (assuming DeepSeek returns them in a list format)
    guidelines = [line.strip() for line in guidance_text.split("\n") if line.strip().startswith("Guideline")]
    if not guidelines:
        guidelines = ["Provide detailed medical documentation", "Include peer-reviewed studies", "Demonstrate medical necessity"]
    
    return AppealGuidance(
        guidelines=guidelines,
        reasoning=guidance_text
    )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000) 