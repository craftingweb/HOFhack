from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime
from enum import Enum

class ProviderType(str, Enum):
    PSYCHOLOGIST = "psychologist"
    PSYCHIATRIST = "psychiatrist"
    THERAPIST = "therapist"
    OTHER = "other"

class ServiceType(str, Enum):
    INDIVIDUAL_THERAPY = "individual-therapy"
    GROUP_THERAPY = "group-therapy"
    MEDICATION_MANAGEMENT = "medication-management"
    EVALUATION = "evaluation"
    OTHER = "other"

class ClaimStatus(str, Enum):
    PENDING = "pending"
    APPROVED = "approved"
    DENIED = "denied"
    APPEALED = "appealed"
    INFO_REQUESTED = "info-requested"
    
class Provider(BaseModel):
    providerType: ProviderType
    providerName: str
    providerNPI: Optional[str] = None
    providerTaxId: Optional[str] = None
    providerLicense: Optional[str] = None
    practiceName: Optional[str] = None
    providerAddress: Optional[str] = None
    providerPhone: Optional[str] = None
    providerEmail: Optional[str] = None
    networkStatus: str = "in-network"

class Patient(BaseModel):
    patientName: str
    patientDob: Optional[str] = None
    patientInsuranceId: Optional[str] = None
    patientInsuranceProvider: str
    insuranceEmail: Optional[str] = None

class Service(BaseModel):
    serviceType: ServiceType
    serviceDate: str
    totalCharge: str
    cptCode: Optional[str] = None
    diagnosisCode: Optional[str] = None
    placeOfService: str = "11"  # 11 = Office
    paymentCollected: str = "0"
    serviceDescription: Optional[str] = None
    uploadedFiles: List[str] = []

class Claim(BaseModel):
    provider: Provider
    patient: Patient
    service: Service
    submittedAt: datetime = Field(default_factory=datetime.now)
    status: ClaimStatus = ClaimStatus.PENDING
    claimId: Optional[str] = None
    
    class Config:
        populate_by_name = True
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }

class ClaimInDB(Claim):
    _id: Optional[str] = None 