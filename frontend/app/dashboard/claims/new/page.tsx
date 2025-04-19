"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { DashboardShell } from "@/components/dashboard-shell"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { FileUpload } from "@/components/ui/file-upload"
import { claimsApi, Claim } from "@/lib/api"
import { toast } from "sonner"

interface ClaimFormData {
  provider: {
    providerType: string;
    providerName: string;
    providerNPI: string;
    providerLicense: string;
    practiceName: string;
    providerAddress: string;
    providerPhone: string;
    providerEmail: string;
    networkStatus: string;
  };
  patient: {
    patientName: string;
    patientDob: string;
    patientInsuranceId: string;
    patientInsuranceProvider: string;
    insuranceEmail: string;
  };
  service: {
    serviceType: string;
    serviceDate: string;
    totalCharge: string;
    cptCode: string;
    diagnosisCode: string;
    placeOfService: string;
    paymentCollected: string;
    serviceDescription: string;
    uploadedFiles: string[];
  };
  status: string;
}

export default function NewClaimPage() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [newClaimId, setNewClaimId] = useState<string | null>(null)
  const [formData, setFormData] = useState<ClaimFormData>({
    provider: {
      providerType: "psychologist",
      providerName: "",
      providerNPI: "",
      providerLicense: "",
      practiceName: "",
      providerAddress: "",
      providerPhone: "",
      providerEmail: "",
      networkStatus: "in-network"
    },
    patient: {
      patientName: "",
      patientDob: "",
      patientInsuranceId: "",
      patientInsuranceProvider: "",
      insuranceEmail: ""
    },
    service: {
      serviceType: "individual-therapy",
      serviceDate: "",
      totalCharge: "",
      cptCode: "",
      diagnosisCode: "",
      placeOfService: "11",
      paymentCollected: "0",
      serviceDescription: "",
      uploadedFiles: []
    },
    status: "pending"
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    const [section, field] = name.split('.')
    
    setFormData(prev => {
      if (section === 'provider') {
        return {
          ...prev,
          provider: {
            ...prev.provider,
            [field]: value
          }
        };
      } else if (section === 'patient') {
        return {
          ...prev,
          patient: {
            ...prev.patient,
            [field]: value
          }
        };
      } else if (section === 'service') {
        return {
          ...prev,
          service: {
            ...prev.service,
            [field]: value
          }
        };
      }
      return prev;
    });
  }

  const handleSelectChange = (section: string, field: string, value: string) => {
    setFormData(prev => {
      if (section === 'provider') {
        return {
          ...prev,
          provider: {
            ...prev.provider,
            [field]: value
          }
        };
      } else if (section === 'patient') {
        return {
          ...prev,
          patient: {
            ...prev.patient,
            [field]: value
          }
        };
      } else if (section === 'service') {
        return {
          ...prev,
          service: {
            ...prev.service,
            [field]: value
          }
        };
      } else if (section === 'status') {
        return {
          ...prev,
          status: value
        };
      }
      return prev;
    });
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      // First create the claim
      const response = await claimsApi.createClaim(formData)
      const claimId = response.claim.claimId
      
      // Store the new claim ID so we can upload files
      setNewClaimId(claimId)
      
      toast.success(`Claim ${claimId} created successfully!`)
      
      // Navigate to the claim details page
      router.push(`/dashboard/claims/${claimId}`)
    } catch (error) {
      console.error('Error creating claim:', error)
      toast.error('Failed to create claim')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <DashboardShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Submit New Claim</h1>
          <p className="text-muted-foreground">Create a new mental health insurance claim submission.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Provider Information */}
          <Card>
            <CardHeader>
              <CardTitle>Provider Information</CardTitle>
              <CardDescription>Enter details about the healthcare provider</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="provider.providerType">Provider Type</Label>
                  <Select
                    value={formData.provider.providerType}
                    onValueChange={(value) => handleSelectChange('provider', 'providerType', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select provider type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="psychologist">Psychologist</SelectItem>
                      <SelectItem value="psychiatrist">Psychiatrist</SelectItem>
                      <SelectItem value="therapist">Therapist</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="provider.providerName">Provider Name</Label>
                  <Input
                    id="provider.providerName"
                    name="provider.providerName"
                    value={formData.provider.providerName}
                    onChange={handleChange}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="provider.providerNPI">NPI Number</Label>
                  <Input
                    id="provider.providerNPI"
                    name="provider.providerNPI"
                    value={formData.provider.providerNPI}
                    onChange={handleChange}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="provider.providerLicense">License Number</Label>
                  <Input
                    id="provider.providerLicense"
                    name="provider.providerLicense"
                    value={formData.provider.providerLicense}
                    onChange={handleChange}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="provider.practiceName">Practice Name</Label>
                  <Input
                    id="provider.practiceName"
                    name="provider.practiceName"
                    value={formData.provider.practiceName}
                    onChange={handleChange}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="provider.networkStatus">Network Status</Label>
                  <Select
                    value={formData.provider.networkStatus}
                    onValueChange={(value) => handleSelectChange('provider', 'networkStatus', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select network status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="in-network">In-Network</SelectItem>
                      <SelectItem value="out-of-network">Out-of-Network</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Patient Information */}
          <Card>
            <CardHeader>
              <CardTitle>Patient Information</CardTitle>
              <CardDescription>Enter details about the patient</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="patient.patientName">Patient Name</Label>
                  <Input
                    id="patient.patientName"
                    name="patient.patientName"
                    value={formData.patient.patientName}
                    onChange={handleChange}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="patient.patientDob">Date of Birth</Label>
                  <Input
                    id="patient.patientDob"
                    name="patient.patientDob"
                    type="date"
                    value={formData.patient.patientDob}
                    onChange={handleChange}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="patient.patientInsuranceId">Insurance ID</Label>
                  <Input
                    id="patient.patientInsuranceId"
                    name="patient.patientInsuranceId"
                    value={formData.patient.patientInsuranceId}
                    onChange={handleChange}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="patient.patientInsuranceProvider">Insurance Provider</Label>
                  <Input
                    id="patient.patientInsuranceProvider"
                    name="patient.patientInsuranceProvider"
                    value={formData.patient.patientInsuranceProvider}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Service Information */}
          <Card>
            <CardHeader>
              <CardTitle>Service Information</CardTitle>
              <CardDescription>Enter details about the service provided</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="service.serviceType">Service Type</Label>
                  <Select
                    value={formData.service.serviceType}
                    onValueChange={(value) => handleSelectChange('service', 'serviceType', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select service type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="individual-therapy">Individual Therapy</SelectItem>
                      <SelectItem value="group-therapy">Group Therapy</SelectItem>
                      <SelectItem value="medication-management">Medication Management</SelectItem>
                      <SelectItem value="evaluation">Evaluation</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="service.serviceDate">Service Date</Label>
                  <Input
                    id="service.serviceDate"
                    name="service.serviceDate"
                    type="date"
                    value={formData.service.serviceDate}
                    onChange={handleChange}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="service.totalCharge">Total Charge ($)</Label>
                  <Input
                    id="service.totalCharge"
                    name="service.totalCharge"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.service.totalCharge}
                    onChange={handleChange}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="service.paymentCollected">Payment Collected ($)</Label>
                  <Input
                    id="service.paymentCollected"
                    name="service.paymentCollected"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.service.paymentCollected}
                    onChange={handleChange}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="service.cptCode">CPT Code</Label>
                  <Input
                    id="service.cptCode"
                    name="service.cptCode"
                    value={formData.service.cptCode}
                    onChange={handleChange}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="service.diagnosisCode">Diagnosis Code</Label>
                  <Input
                    id="service.diagnosisCode"
                    name="service.diagnosisCode"
                    value={formData.service.diagnosisCode}
                    onChange={handleChange}
                  />
                </div>
                
                <div className="col-span-2 space-y-2">
                  <Label htmlFor="service.serviceDescription">Service Description</Label>
                  <Textarea
                    id="service.serviceDescription"
                    name="service.serviceDescription"
                    value={formData.service.serviceDescription}
                    onChange={handleChange}
                    rows={3}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* File Upload */}
          <Card>
            <CardHeader>
              <CardTitle>Supporting Documents</CardTitle>
              <CardDescription>Upload supporting documentation for your claim</CardDescription>
            </CardHeader>
            <CardContent>
              {newClaimId ? (
                <FileUpload 
                  claimId={newClaimId} 
                  multiple={true}
                  uploadImmediately={true}
                />
              ) : (
                <p className="text-muted-foreground">You will be able to upload files after submitting the claim.</p>
              )}
            </CardContent>
          </Card>

          <div className="flex justify-end gap-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => router.push('/dashboard/claims')}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Submitting...' : 'Submit Claim'}
            </Button>
          </div>
        </form>
      </div>
    </DashboardShell>
  )
}
