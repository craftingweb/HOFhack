from database import get_claims_collection
from claim_models import Claim, Provider, Patient, Service, ProviderType, ServiceType, ClaimStatus
from datetime import datetime

def insert_sample_claim():
    """Insert a sample claim into the database for testing"""
    
    # Create a sample claim
    claim = Claim(
        provider=Provider(
            providerType=ProviderType.PSYCHOLOGIST,
            providerName="Dr. Jane Smith",
            providerNPI="1234567890",
            providerLicense="PSY12345",
            practiceName="Mental Health Wellness Center",
            providerAddress="123 Main St, Boston, MA 02115",
            providerPhone="617-555-1234",
            providerEmail="drsmith@mhwc.com",
            networkStatus="in-network"
        ),
        patient=Patient(
            patientName="John Doe",
            patientDob="1985-06-15",
            patientInsuranceId="INS123456789",
            patientInsuranceProvider="Blue Cross Blue Shield",
            insuranceEmail="claims@bcbs.com"
        ),
        service=Service(
            serviceType=ServiceType.INDIVIDUAL_THERAPY,
            serviceDate="2023-10-15",
            totalCharge="150.00",
            cptCode="90834",
            diagnosisCode="F41.1",
            placeOfService="11",
            paymentCollected="25.00",
            serviceDescription="Individual psychotherapy, 45 minutes",
            uploadedFiles=[]
        ),
        submittedAt=datetime.now(),
        status=ClaimStatus.PENDING,
        claimId="MH-2023-TEST1"
    )
    
    # Get the collection
    collection = get_claims_collection()
    
    # Convert to dict for MongoDB
    claim_dict = claim.model_dump()
    
    # Insert the claim
    result = collection.insert_one(claim_dict)
    
    print(f"Inserted claim with ID: {result.inserted_id}")
    print(f"Claim ID: {claim.claimId}")
    
    return claim

if __name__ == "__main__":
    claim = insert_sample_claim()
    print("Sample claim inserted successfully!") 