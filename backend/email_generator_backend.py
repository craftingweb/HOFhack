"""

A minimal FastAPI micro‑service that
1. accepts a user‑supplied claim document,
2. retrieves the closest precedent from Pinecone with OpenAI embeddings, and
3. drafts a professional appeal e‑mail with LangChain + OpenAI.

Run:
    uvicorn email_generator_backend:app --host 0.0.0.0 --port 8000 --reload
"""

from __future__ import annotations

import os
import time
from typing import Optional

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import uvicorn

from pinecone import Pinecone, ServerlessSpec
from langchain_pinecone import PineconeVectorStore
from langchain.prompts import PromptTemplate
from langchain.chains import LLMChain


load_dotenv()

OPENAI_API_KEY: str | None = os.getenv("OPENAI_API_KEY")
PINECONE_API_KEY: str | None = os.getenv("PINECONE_API_KEY")
if not OPENAI_API_KEY or not PINECONE_API_KEY:
    raise RuntimeError("OPENAI_API_KEY and PINECONE_API_KEY must be set in .env")

INDEX_NAME = os.getenv("PINECONE_INDEX", "health-claims")
NAMESPACE   = os.getenv("PINECONE_NAMESPACE", "default")

pc = Pinecone(api_key=PINECONE_API_KEY)
if not pc.has_index(INDEX_NAME):
    pc.create_index(
        name=INDEX_NAME,
        vector_type="dense",
        dimension=1024,
        metric="cosine",
        spec=ServerlessSpec(cloud="aws", region="us-east-1"),
    )
    while not pc.describe_index(INDEX_NAME).status["ready"]:
        time.sleep(1)

index = pc.Index(INDEX_NAME)

embeddings = OpenAIEmbeddings(
    model="text-embedding-3-small",
    openai_api_key=OPENAI_API_KEY,
)

vectorstore = PineconeVectorStore(
    index=index,
    embedding=embeddings,
    text_key="rationale",
    namespace=NAMESPACE,
)


prompt = PromptTemplate.from_template(
    """
You are an insurance‑claims specialist. Using the precedent below, draft a concise,
professional appeal e‑mail for the user.

Precedent
---------
Decision      : {decision}
Decision date : {decision_date}
Coverage type : {coverage_type}
Condition     : {condition}
Treatment     : {treatment}

Guidelines
----------
* Reference the original decision.
* State why the claimant believes reconsideration is justified (politely).
* Keep the tone neutral and cooperative.
* Close with "Thank you," (no name).

Draft e‑mail:
""".strip()
)
llm   = ChatOpenAI(model_name="gpt-4o-mini", temperature=0.3, api_key=OPENAI_API_KEY)
chain = LLMChain(llm=llm, prompt=prompt)


app = FastAPI(title="Claim‑Appeal Email Generator")

class ClaimDocument(BaseModel):
    """Request schema."""
    content: str

def _clean(text: str) -> str:
    """Very light cleaning before embedding search."""
    return " ".join(text.split())

def _best_precedent(query_text: str) -> Optional[dict]:
    """Return metadata of the most‑similar precedent (or None)."""
    results = vectorstore.similarity_search_with_score(query_text, k=1)
    if not results:
        return None
    doc, _score = results[0]
    return doc.metadata


@app.post("/draft_email")
def draft_email(doc: ClaimDocument):
    """Generate an appeal e‑mail based on the user’s claim document."""
    precedent = _best_precedent(_clean(doc.content))
    if precedent is None:
        raise HTTPException(404, "No similar precedent found in Pinecone.")

    try:
        email_text = chain.run(precedent)
    except Exception as exc:
        raise HTTPException(500, str(exc)) from exc

    return {"email": email_text, "precedent": precedent}


if __name__ == "__main__":
    uvicorn.run("email_generator_backend:app", host="0.0.0.0", port=8000, reload=True)
