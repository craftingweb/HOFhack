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
from langchain.embeddings import OpenAIEmbeddings
from langchain.chat_models import ChatOpenAI
from langchain.chains import RetrievalQA
from langchain_pinecone import PineconeVectorStore
import pinecone
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()
PINECONE_API_KEY = os.getenv("PINECONE_API_KEY")

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

# Initialize OpenAI
openai_api_key = os.getenv("OPENAI_API_KEY")
embeddings = OpenAIEmbeddings(openai_api_key=openai_api_key)
llm = ChatOpenAI(temperature=0, openai_api_key=openai_api_key)

# Initialize Pinecone index
index_name = "health-claims"
index = pc.Index(index_name)
vectorstore = PineconeVectorStore(pinecone_api_key=PINECONE_API_KEY, index=index, embedding=embeddings)

# DeepSeek configuration
DEEPSEEK_API_KEY = os.getenv("DEEPSEEK_API_KEY")
DEEPSEEK_URL = "https://api.deepseek.com/v1/chat/completions"  # Replace with actual DeepSeek API endpoint

async def process_with_deepseek(text: str) -> dict:
    """
    Process text content with DeepSeek API to extract health claim information.
    """
    headers = {
        "Authorization": f"Bearer {DEEPSEEK_API_KEY}",
        "Content-Type": "application/json"
    }
    
    prompt = f"""
    Extract the following information from the provided text and return it in JSON format:
    - condition: The medical condition being treated
    - date: The date of the claim in ISO format
    - health_insurance_provider: The name of the insurance provider
    - requested_treatment: The treatment being requested
    - explanation: A brief explanation of the claim

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
        response = requests.post(DEEPSEEK_URL, headers=headers, json=payload)
        response.raise_for_status()
        
        # Extract the JSON response from DeepSeek's completion
        result = response.json()
        extracted_text = result["choices"][0]["message"]["content"]
        
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
            results.append(HealthClaim(**deepseek_response))
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Error processing PDF {file.filename}: {str(e)}")
    
    return results

@app.post("/predict-approval")
async def predict_approval(claim: HealthClaim):
    """
    Predict whether a health claim is likely to be approved.
    """
    # TODO: Implement actual prediction logic
    return {
        "likely_approved": True,
        "confidence": 0.85,
        "reasoning": "Based on historical data and claim details"
    }

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
    
    # Use LangChain with Pinecone for RAG
    qa_chain = RetrievalQA.from_chain_type(
        llm=llm,
        chain_type="stuff",
        retriever=vectorstore.as_retriever()
    )
    
    # Get relevant guidelines
    response = qa_chain.run(query)
    
    return AppealGuidance(
        guidelines=[
            "Guideline 1: Provide detailed medical documentation",
            "Guideline 2: Include peer-reviewed studies",
            "Guideline 3: Demonstrate medical necessity"
        ],
        reasoning=response
    )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000) 