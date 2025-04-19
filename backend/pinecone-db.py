import os
import pandas as pd
from dotenv import load_dotenv
import pinecone

load_dotenv()
df = pd.read_csv("claims_data.csv")

pinecone.init(
    api_key=os.environ["PINECONE_API_KEY"],
    environment=os.environ["PINECONE_ENVIRONMENT"],
)

index_name = "claims_data"
if index_name not in pinecone.list_indexes():
    pinecone.create_index(index_name, dimension=1024)

index = pinecone.Index(index_name)

