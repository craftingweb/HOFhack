import uuid
from datetime import datetime
from typing import List, Optional
from bson import ObjectId
from pymongo.collection import Collection
from pymongo.results import InsertOneResult, UpdateResult, DeleteResult

from database import get_claims_collection
from claim_models import Claim, ClaimInDB, ClaimStatus

# Helper function to convert ObjectId to string
def _convert_objectid_to_str(claim_dict):
    if "_id" in claim_dict and isinstance(claim_dict["_id"], ObjectId):
        claim_dict["_id"] = str(claim_dict["_id"])
    return claim_dict

class ClaimService:
    def __init__(self):
        self.collection: Collection = get_claims_collection()
    
    def create_claim(self, claim: Claim) -> ClaimInDB:
        """Create a new claim"""
        # Generate a claim ID if not provided
        if not claim.claimId:
            claim.claimId = f"MH-{datetime.now().year}-{str(uuid.uuid4())[:4]}"
        
        # Convert claim to dict for MongoDB
        claim_dict = claim.model_dump()
        
        # Insert into MongoDB
        result: InsertOneResult = self.collection.insert_one(claim_dict)
        
        # Add the MongoDB _id
        claim_dict["_id"] = str(result.inserted_id)
        
        return ClaimInDB(**claim_dict)
    
    def get_claim_by_id(self, claim_id: str) -> Optional[ClaimInDB]:
        """Get a claim by its ID"""
        claim = self.collection.find_one({"claimId": claim_id})
        if claim:
            return ClaimInDB(**_convert_objectid_to_str(claim))
        return None
    
    def get_claims(self, status: Optional[ClaimStatus] = None, limit: int = 100, offset: int = 0) -> List[ClaimInDB]:
        """Get all claims, optionally filtered by status"""
        query = {}
        if status:
            query["status"] = status.value
        
        cursor = self.collection.find(query).skip(offset).limit(limit)
        claims = []
        
        for claim in cursor:
            claims.append(ClaimInDB(**_convert_objectid_to_str(claim)))
        
        return claims
    
    def update_claim(self, claim_id: str, updated_claim: Claim) -> Optional[ClaimInDB]:
        """Update an existing claim"""
        # Get the existing claim
        existing_claim = self.get_claim_by_id(claim_id)
        if not existing_claim:
            return None
        
        # Prepare update data
        update_data = updated_claim.model_dump(exclude_unset=True)
        
        # Update in MongoDB
        result: UpdateResult = self.collection.update_one(
            {"claimId": claim_id},
            {"$set": update_data}
        )
        
        if result.modified_count == 1:
            return self.get_claim_by_id(claim_id)
        
        return None
    
    def update_claim_status(self, claim_id: str, status: ClaimStatus) -> Optional[ClaimInDB]:
        """Update the status of a claim"""
        result: UpdateResult = self.collection.update_one(
            {"claimId": claim_id},
            {"$set": {"status": status.value}}
        )
        
        if result.modified_count == 1:
            return self.get_claim_by_id(claim_id)
        
        return None
    
    def delete_claim(self, claim_id: str) -> bool:
        """Delete a claim"""
        result: DeleteResult = self.collection.delete_one({"claimId": claim_id})
        return result.deleted_count == 1
    
    def get_claim_by_object_id(self, object_id: ObjectId) -> Optional[ClaimInDB]:
        """
        Get a claim by its MongoDB ObjectId (_id field)
        
        Args:
            object_id: The MongoDB ObjectId
            
        Returns:
            The claim if found, None otherwise
        """
        claim_dict = self.collection.find_one({"_id": object_id})
        if claim_dict:
            return ClaimInDB(**claim_dict)
        return None 