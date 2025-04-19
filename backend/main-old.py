from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from typing import List
import os
import tempfile
import requests
from dotenv import load_dotenv
import json
import PyPDF2
from pydantic import BaseModel

# Load environment variables
load_dotenv()

app = FastAPI(
    title="PDF Processing API",
    description="API for processing PDFs and generating structured medical data",
    version="1.0.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class PDFResponse(BaseModel):
    filename: str
    data: dict

class ProcessResponse(BaseModel):
    results: List[PDFResponse]

def extract_text_from_pdf(pdf_path: str) -> str:
    """
    Extract text from PDF file
    """
    text = ""
    with open(pdf_path, 'rb') as file:
        reader = PyPDF2.PdfReader(file)
        for page in reader.pages:
            text += page.extract_text()
    return text

def generate_structured_data(text: str) -> dict:
    """
    Generate structured data using Deepseek API
    """
    DEEPSEEK_API_KEY = os.getenv("DEEPSEEK_API_KEY")
    DEEPSEEK_API_URL = "https://api.deepseek.com/v1/chat/completions"
    
    prompt = f"""
    Analyze the following medical document and extract the following information in JSON format:
    - condition: The medical condition being discussed
    - coverage_type: The type of insurance coverage (Company name or federal program)
    - rationale: The medical background and reasoning for the condition
    
    Document text:
    {text}
    
    Return ONLY the JSON object, nothing else.
    """
    
    headers = {
        'Content-Type': 'application/json',
        'Authorization': f'Bearer {DEEPSEEK_API_KEY}'
    }
    
    data = {
        "model": "deepseek-chat",
        "messages": [
            {"role": "system", "content": "You are a medical document analyzer. Extract key information and return it in JSON format."},
            {"role": "user", "content": prompt}
        ],
        "temperature": 0.1
    }
    
    response = requests.post(DEEPSEEK_API_URL, headers=headers, json=data)
    
    if response.status_code == 200:
        try:
            # Extract the JSON content from the response
            content = response.json()['choices'][0]['message']['content']
            # Clean the response to ensure it's valid JSON
            content = content.strip()
            if content.startswith('```json'):
                content = content[7:]
            if content.endswith('```'):
                content = content[:-3]
            return json.loads(content)
        except Exception as e:
            print(f"Error parsing response: {e}")
            return None
    else:
        print(f"Error from Deepseek API: {response.status_code}")
        print(response.text)
        return None

@app.post("/process-pdfs", response_model=ProcessResponse)
async def process_pdfs(files: List[UploadFile] = File(...)):
    """
    Process multiple PDF files and generate structured medical data
    """
    results = []
    temp_dir = tempfile.mkdtemp()
    
    try:
        for file in files:
            if not file.filename.lower().endswith('.pdf'):
                raise HTTPException(status_code=400, detail=f"File {file.filename} is not a PDF")
            
            # Save the uploaded file temporarily
            filepath = os.path.join(temp_dir, file.filename)
            with open(filepath, "wb") as buffer:
                content = await file.read()
                buffer.write(content)
            
            # Extract text from PDF
            text = extract_text_from_pdf(filepath)
            
            # Generate structured data
            structured_data = generate_structured_data(text)
            
            if structured_data:
                results.append(PDFResponse(
                    filename=file.filename,
                    data=structured_data
                ))
            
            # Clean up
            os.remove(filepath)
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        # Clean up temp directory
        try:
            os.rmdir(temp_dir)
        except:
            pass
    
    if not results:
        raise HTTPException(status_code=400, detail="No valid results generated from the PDFs")
    
    return ProcessResponse(results=results)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=5000) 