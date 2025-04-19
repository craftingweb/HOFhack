import os
from dotenv import load_dotenv
from pymongo import MongoClient
from pymongo.collection import Collection
from pymongo.database import Database

# Load environment variables
load_dotenv()

# Get MongoDB connection string from environment variables
MONGODB_URI = os.getenv("MONGODB_URI", "mongodb://localhost:27017")

# Create MongoDB client
client = MongoClient(MONGODB_URI)

# Connect to database
db: Database = client.get_database("claims-management")

# Define collections
claims_collection: Collection = db.get_collection("claims")

def get_claims_collection() -> Collection:
    """Get the claims collection"""
    return claims_collection

def get_db() -> Database:
    """Get the database instance"""
    return db

# Test MongoDB connection on startup
def test_connection() -> bool:
    """Test connection to MongoDB"""
    try:
        # The ismaster command is cheap and does not require auth
        client.admin.command('ismaster')
        print("MongoDB connection successful")
        return True
    except Exception as e:
        print(f"MongoDB connection failed: {e}")
        return False

# Run test connection when module is imported
test_connection() 