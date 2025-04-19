from fastapi import FastAPI
from pydantic import BaseModel
from transformers import AutoTokenizer, AutoModelForSequenceClassification
import torch
from huggingface_hub import login

app = FastAPI()

# Optional: use if your model is private
# login(token="your_hf_token")

# ✅ Load model from Hugging Face Hub
model = AutoModelForSequenceClassification.from_pretrained("RohitD1234/clinicalbert-model")
tokenizer = AutoTokenizer.from_pretrained("RohitD1234/clinicalbert-model")

# ✅ Request body schema
class InputText(BaseModel):
    text: str

# ✅ Inference endpoint
@app.post("/predict")
def predict(input: InputText):
    inputs = tokenizer(input.text, return_tensors="pt", truncation=True, padding=True)
    with torch.no_grad():
        logits = model(**inputs).logits
        probs = torch.nn.functional.softmax(logits, dim=-1)
    return {
        "label": int(probs.argmax()),
        "confidence": float(probs.max())
    }
