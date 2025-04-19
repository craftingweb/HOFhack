from flask import Flask, request, jsonify
import os
import tempfile
from werkzeug.utils import secure_filename
import requests
from dotenv import load_dotenv
import json

# Load environment variables
load_dotenv()

app = Flask(__name__)


# Configure upload folder
UPLOAD_FOLDER = tempfile.mkdtemp()
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
ALLOWED_EXTENSIONS = {'pdf'}
app.config['MAX_CONTENT_LENGTH'] = (2 ** 20) ** 2

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def extract_text_from_pdf(pdf_path):
    """
    Extract text from PDF file
    """
    import PyPDF2
    text = ""
    with open(pdf_path, 'rb') as file:
        reader = PyPDF2.PdfReader(file)
        for page in reader.pages:
            text += page.extract_text()
    return text

def generate_structured_data(text):
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

@app.route('/process-pdfs', methods=['POST'])
def process_pdfs():

    if 'files[]' not in request.files:
        return jsonify({'error': 'No files provided'}), 400
    

    files = request.files.getlist('files[]')
    results = []
    
    for file in files:
        if file and allowed_file(file.filename):
            filename = secure_filename(file.filename)
            filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
            file.save(filepath)
            
            # Extract text from PDF
            text = extract_text_from_pdf(filepath)
            
            # Generate structured data
            structured_data = generate_structured_data(text)
            
            if structured_data:
                results.append({
                    'filename': filename,
                    'data': structured_data
                })
            
            # Clean up
            os.remove(filepath)
    
    return jsonify({'results': results})

if __name__ == '__main__':
    app.run(debug=True, port=5000) 