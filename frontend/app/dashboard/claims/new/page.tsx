"use client"

import { cn } from "@/lib/utils"
import { useState, FormEvent } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ChevronLeft, ChevronRight, Upload, CheckCircle } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { DashboardShell } from "@/components/dashboard-shell"
import { useToast } from "@/components/ui/use-toast"

export default function NewClaimPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [step, setStep] = useState(1)
  const totalSteps = 4
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)

  // Provider Information State
  const [providerData, setProviderData] = useState({
    providerType: "psychologist",
    providerName: "",
    providerNPI: "",
    providerTaxId: "",
    providerLicense: "",
    practiceName: "",
    providerAddress: "",
    providerPhone: "",
    providerEmail: "",
    networkStatus: "in-network"
  })

  // Patient Information State
  const [patientData, setPatientData] = useState({
    patientName: "",
    patientDob: "",
    patientInsuranceId: "",
    patientInsuranceProvider: "",
    insuranceEmail: ""
  })

  // Service Information State
  const [serviceData, setServiceData] = useState({
    serviceType: "individual-therapy",
    serviceDate: "",
    totalCharge: "",
    cptCode: "",
    diagnosisCode: "",
    placeOfService: "11",
    paymentCollected: "0",
    serviceDescription: "",
    uploadedFiles: []
  })

  // Certification State
  const [certification, setCertification] = useState(false)

  const handleProviderChange = (field, value) => {
    setProviderData({
      ...providerData,
      [field]: value
    })
  }

  const handlePatientChange = (field, value) => {
    setPatientData({
      ...patientData,
      [field]: value
    })
  }

  const handleServiceChange = (field, value) => {
    setServiceData({
      ...serviceData,
      [field]: value
    })
  }

  const handleFileUpload = (files) => {
    // In a real application, you would handle file uploads to a storage service
    // For now, we'll just store the file names
    const fileNames = Array.from(files).map(file => file.name)
    setServiceData({
      ...serviceData,
      uploadedFiles: [...serviceData.uploadedFiles, ...fileNames]
    })
  }

  const nextStep = () => {
    if (step < totalSteps) {
      setStep(step + 1)
    }
  }

  const prevStep = () => {
    if (step > 1) {
      setStep(step - 1)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!certification) {
      toast({
        title: "Certification Required",
        description: "You must certify that the information provided is accurate before submitting.",
        variant: "destructive"
      })
      return
    }
    
    setIsSubmitting(true)
    
    // Compile all form data into a single JSON object
    const claimData = {
      provider: providerData,
      patient: patientData,
      service: serviceData,
      submittedAt: new Date().toISOString(),
      status: "pending",
      claimId: `MH-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`
    }
    
    try {
      // Send data to your backend API
      const response = await fetch('/api/claims/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(claimData),
      })
      
      if (!response.ok) {
        throw new Error('Failed to submit claim')
      }
      
      // Show success message
      setShowSuccess(true)
      
      // Automatically redirect to claims dashboard after 3 seconds
      setTimeout(() => {
        router.push('/dashboard/claims')
      }, 3000)
      
    } catch (error) {
      console.error('Error submitting claim:', error)
      toast({
        title: "Submission Failed",
        description: "There was an error submitting your claim. Please try again.",
        variant: "destructive"
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // If showing success message
  if (showSuccess) {
    return (
      <DashboardShell>
        <div className="mx-auto max-w-3xl text-center py-12">
          <div className="flex justify-center mb-6">
            <CheckCircle className="h-16 w-16 text-green-500" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight mb-2">Claim Submitted Successfully</h1>
          <p className="text-muted-foreground mb-6">
            Your claim has been successfully submitted and is being processed.
            You will be redirected to the claims dashboard in a moment.
          </p>
          <Button asChild>
            <Link href="/dashboard/claims">View All Claims</Link>
          </Button>
        </div>
      </DashboardShell>
    )
  }

  return (
    <DashboardShell>
      <div className="mx-auto max-w-3xl">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Provider Claim Submission</h1>
            <p className="text-muted-foreground">
              Complete this form to submit a mental health insurance claim for your patient.
            </p>
          </div>
          <Button variant="outline" asChild>
            <Link href="/dashboard">
              <ChevronLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Link>
          </Button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mt-6">
            <div className="mb-8">
              <div className="flex justify-between mb-2">
                {Array.from({ length: totalSteps }).map((_, i) => (
                  <div key={i} className="flex flex-col items-center">
                    <div
                      className={cn(
                        "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium",
                        step > i + 1
                          ? "bg-teal-600 text-white"
                          : step === i + 1
                            ? "bg-teal-100 text-teal-800 border border-teal-600"
                            : "bg-muted text-muted-foreground",
                      )}
                    >
                      {i + 1}
                    </div>
                    <span className="text-xs mt-1 text-muted-foreground">
                      {i === 0 ? "Provider" : i === 1 ? "Patient" : i === 2 ? "Service" : "Review"}
                    </span>
                  </div>
                ))}
              </div>
              <div className="w-full bg-muted h-2 rounded-full overflow-hidden">
                <div
                  className="bg-teal-600 h-full transition-all duration-300 ease-in-out"
                  style={{ width: `${(step / totalSteps) * 100}%` }}
                />
              </div>
            </div>

            <Card>
              {step === 1 && (
                <>
                  <CardHeader>
                    <CardTitle>Provider Information</CardTitle>
                    <CardDescription>
                      Enter your details as the healthcare provider submitting this claim.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="provider-type">Provider Type</Label>
                      <Select 
                        defaultValue={providerData.providerType}
                        onValueChange={(value) => handleProviderChange('providerType', value)}
                      >
                        <SelectTrigger id="provider-type">
                          <SelectValue placeholder="Select provider type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="psychologist">Psychologist</SelectItem>
                          <SelectItem value="psychiatrist">Psychiatrist</SelectItem>
                          <SelectItem value="lcsw">Licensed Clinical Social Worker (LCSW)</SelectItem>
                          <SelectItem value="therapist">Therapist</SelectItem>
                          <SelectItem value="lpc">Licensed Professional Counselor (LPC)</SelectItem>
                          <SelectItem value="other">Other Mental Health Provider</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="provider-name">Provider Full Name</Label>
                      <Input 
                        id="provider-name" 
                        placeholder="Dr. Jane Smith" 
                        value={providerData.providerName}
                        onChange={(e) => handleProviderChange('providerName', e.target.value)}
                        required 
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="provider-npi">National Provider Identifier (NPI)</Label>
                      <Input 
                        id="provider-npi" 
                        placeholder="1234567890" 
                        value={providerData.providerNPI}
                        onChange={(e) => handleProviderChange('providerNPI', e.target.value)}
                        required 
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="provider-tax-id">Tax ID / EIN</Label>
                      <Input 
                        id="provider-tax-id" 
                        placeholder="12-3456789" 
                        value={providerData.providerTaxId}
                        onChange={(e) => handleProviderChange('providerTaxId', e.target.value)}
                        required 
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="provider-license">License Number</Label>
                      <Input 
                        id="provider-license" 
                        placeholder="ABC123456" 
                        value={providerData.providerLicense}
                        onChange={(e) => handleProviderChange('providerLicense', e.target.value)}
                        required 
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="practice-name">Practice Name (if applicable)</Label>
                      <Input 
                        id="practice-name" 
                        placeholder="Wellness Mental Health Services" 
                        value={providerData.practiceName}
                        onChange={(e) => handleProviderChange('practiceName', e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="provider-address">Provider Address</Label>
                      <Textarea 
                        id="provider-address" 
                        placeholder="123 Main St, Anytown, CA 12345" 
                        value={providerData.providerAddress}
                        onChange={(e) => handleProviderChange('providerAddress', e.target.value)}
                        required 
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="provider-phone">Provider Phone Number</Label>
                      <Input 
                        id="provider-phone" 
                        placeholder="(555) 123-4567" 
                        value={providerData.providerPhone}
                        onChange={(e) => handleProviderChange('providerPhone', e.target.value)}
                        required 
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="provider-email">Provider Email</Label>
                      <Input 
                        id="provider-email" 
                        type="email" 
                        placeholder="provider@example.com" 
                        value={providerData.providerEmail}
                        onChange={(e) => handleProviderChange('providerEmail', e.target.value)}
                        required 
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="provider-network">Network Status</Label>
                      <RadioGroup 
                        defaultValue={providerData.networkStatus}
                        onValueChange={(value) => handleProviderChange('networkStatus', value)}
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="in-network" id="in-network" />
                          <Label htmlFor="in-network">In-Network</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="out-of-network" id="out-of-network" />
                          <Label htmlFor="out-of-network">Out-of-Network</Label>
                        </div>
                      </RadioGroup>
                    </div>
                  </CardContent>
                </>
              )}

              {step === 2 && (
                <>
                  <CardHeader>
                    <CardTitle>Patient Information</CardTitle>
                    <CardDescription>Enter details about the patient receiving the service.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="patient-name">Patient Full Name</Label>
                      <Input 
                        id="patient-name" 
                        placeholder="John Doe" 
                        value={patientData.patientName}
                        onChange={(e) => handlePatientChange('patientName', e.target.value)}
                        required 
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="patient-dob">Patient Date of Birth</Label>
                      <Input 
                        id="patient-dob" 
                        type="date" 
                        value={patientData.patientDob}
                        onChange={(e) => handlePatientChange('patientDob', e.target.value)}
                        required 
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="patient-insurance-id">Patient Insurance ID Number</Label>
                      <Input 
                        id="patient-insurance-id" 
                        placeholder="ABC123456789"
                        value={patientData.patientInsuranceId}
                        onChange={(e) => handlePatientChange('patientInsuranceId', e.target.value)} 
                        required 
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="patient-insurance-provider">Patient Insurance Provider</Label>
                      <Select
                        value={patientData.patientInsuranceProvider}
                        onValueChange={(value) => handlePatientChange('patientInsuranceProvider', value)}
                      >
                        <SelectTrigger id="patient-insurance-provider">
                          <SelectValue placeholder="Select insurance provider" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="aetna">Aetna</SelectItem>
                          <SelectItem value="bcbs">Blue Cross Blue Shield</SelectItem>
                          <SelectItem value="cigna">Cigna</SelectItem>
                          <SelectItem value="uhc">UnitedHealthcare</SelectItem>
                          <SelectItem value="humana">Humana</SelectItem>
                          <SelectItem value="kaiser">Kaiser Permanente</SelectItem>
                          <SelectItem value="medicaid">Medicaid</SelectItem>
                          <SelectItem value="medicare">Medicare</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="insurance-email">Insurance Provider Email</Label>
                      <Input 
                        id="insurance-email" 
                        type="email" 
                        placeholder="claims@insurance.com" 
                        value={patientData.insuranceEmail}
                        onChange={(e) => handlePatientChange('insuranceEmail', e.target.value)}
                        required 
                      />
                      <p className="text-xs text-muted-foreground">Email address for claim submission and correspondence</p>
                    </div>
                  </CardContent>
                </>
              )}

              {step === 3 && (
                <>
                  <CardHeader>
                    <CardTitle>Service Information</CardTitle>
                    <CardDescription>Enter details about the mental health service provided.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="service-type">Service Type</Label>
                      <Select 
                        defaultValue={serviceData.serviceType}
                        onValueChange={(value) => handleServiceChange('serviceType', value)}
                      >
                        <SelectTrigger id="service-type">
                          <SelectValue placeholder="Select service type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="individual-therapy">Individual Therapy</SelectItem>
                          <SelectItem value="group-therapy">Group Therapy</SelectItem>
                          <SelectItem value="initial-evaluation">Initial Evaluation</SelectItem>
                          <SelectItem value="medication-management">Medication Management</SelectItem>
                          <SelectItem value="psychological-testing">Psychological Testing</SelectItem>
                          <SelectItem value="other">Other Service</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="service-date">Service Date</Label>
                        <Input 
                          id="service-date" 
                          type="date" 
                          value={serviceData.serviceDate}
                          onChange={(e) => handleServiceChange('serviceDate', e.target.value)}
                          required 
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="service-cost">Total Charge ($)</Label>
                        <Input 
                          id="service-cost" 
                          type="number" 
                          placeholder="150.00" 
                          value={serviceData.totalCharge}
                          onChange={(e) => handleServiceChange('totalCharge', e.target.value)}
                          required 
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="cpt-code">CPT/Procedure Code</Label>
                      <Input 
                        id="cpt-code" 
                        placeholder="90834" 
                        value={serviceData.cptCode}
                        onChange={(e) => handleServiceChange('cptCode', e.target.value)}
                        required 
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="diagnosis-code">ICD-10 Diagnosis Code</Label>
                      <Input 
                        id="diagnosis-code" 
                        placeholder="F41.1" 
                        value={serviceData.diagnosisCode}
                        onChange={(e) => handleServiceChange('diagnosisCode', e.target.value)}
                        required 
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="place-of-service">Place of Service Code</Label>
                      <Select 
                        defaultValue={serviceData.placeOfService}
                        onValueChange={(value) => handleServiceChange('placeOfService', value)}
                      >
                        <SelectTrigger id="place-of-service">
                          <SelectValue placeholder="Select place of service" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="11">11 - Office</SelectItem>
                          <SelectItem value="02">02 - Telehealth</SelectItem>
                          <SelectItem value="12">12 - Home</SelectItem>
                          <SelectItem value="53">53 - Community Mental Health Center</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="payment-collected">Payment Collected (if any)</Label>
                      <Input 
                        id="payment-collected" 
                        type="number" 
                        placeholder="0.00" 
                        value={serviceData.paymentCollected}
                        onChange={(e) => handleServiceChange('paymentCollected', e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="service-description">Service Description</Label>
                      <Textarea
                        id="service-description"
                        placeholder="Brief description of the service provided"
                        rows={3}
                        value={serviceData.serviceDescription}
                        onChange={(e) => handleServiceChange('serviceDescription', e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Supporting Documentation</Label>
                      <div className="rounded-lg border border-dashed p-8 text-center">
                        <div className="mx-auto flex max-w-[420px] flex-col items-center justify-center">
                          <Upload className="h-10 w-10 text-muted-foreground" />
                          <h3 className="mt-4 text-lg font-semibold">Upload Claim Documentation</h3>
                          <p className="mt-2 text-sm text-muted-foreground">
                            Upload superbills, clinical notes, or other required documentation
                          </p>
                          <div className="mt-4">
                            <input
                              type="file"
                              id="file-upload"
                              className="hidden"
                              multiple
                              onChange={(e) => handleFileUpload(e.target.files)}
                            />
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => document.getElementById('file-upload').click()}
                              type="button"
                            >
                              Browse Files
                            </Button>
                          </div>
                          <p className="mt-2 text-xs text-muted-foreground">PDF, JPG, or PNG files up to 10MB</p>
                          {serviceData.uploadedFiles.length > 0 && (
                            <div className="mt-4 text-left w-full">
                              <p className="text-sm font-medium mb-2">Uploaded files:</p>
                              <ul className="text-sm">
                                {serviceData.uploadedFiles.map((file, index) => (
                                  <li key={index} className="flex items-center gap-2 mb-1">
                                    <svg
                                      xmlns="http://www.w3.org/2000/svg"
                                      viewBox="0 0 24 24"
                                      fill="none"
                                      stroke="currentColor"
                                      strokeWidth="2"
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      className="h-4 w-4"
                                    >
                                      <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
                                      <polyline points="14 2 14 8 20 8" />
                                    </svg>
                                    {file}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </>
              )}

              {step === 4 && (
                <>
                  <CardHeader>
                    <CardTitle>Review and Submit</CardTitle>
                    <CardDescription>Review claim details before submission to insurer.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-2">
                      <h3 className="text-sm font-medium">Provider Information</h3>
                      <div className="rounded-md bg-muted p-4">
                        <dl className="grid grid-cols-2 gap-2 text-sm">
                          <div>
                            <dt className="text-muted-foreground">Provider Type:</dt>
                            <dd>{providerData.providerType === "psychologist" ? "Psychologist" : 
                                providerData.providerType === "psychiatrist" ? "Psychiatrist" : 
                                providerData.providerType === "lcsw" ? "Licensed Clinical Social Worker (LCSW)" :
                                providerData.providerType === "therapist" ? "Therapist" :
                                providerData.providerType === "lpc" ? "Licensed Professional Counselor (LPC)" : 
                                "Other Mental Health Provider"}</dd>
                          </div>
                          <div>
                            <dt className="text-muted-foreground">Provider Name:</dt>
                            <dd>{providerData.providerName || "Not provided"}</dd>
                          </div>
                          <div>
                            <dt className="text-muted-foreground">NPI:</dt>
                            <dd>{providerData.providerNPI || "Not provided"}</dd>
                          </div>
                          <div>
                            <dt className="text-muted-foreground">Tax ID:</dt>
                            <dd>{providerData.providerTaxId || "Not provided"}</dd>
                          </div>
                          <div className="col-span-2">
                            <dt className="text-muted-foreground">Provider Address:</dt>
                            <dd>{providerData.providerAddress || "Not provided"}</dd>
                          </div>
                          <div>
                            <dt className="text-muted-foreground">Provider Phone:</dt>
                            <dd>{providerData.providerPhone || "Not provided"}</dd>
                          </div>
                          <div>
                            <dt className="text-muted-foreground">Network Status:</dt>
                            <dd>{providerData.networkStatus === "in-network" ? "In-Network" : "Out-of-Network"}</dd>
                          </div>
                        </dl>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-sm font-medium">Patient Information</h3>
                      <div className="rounded-md bg-muted p-4">
                        <dl className="grid grid-cols-2 gap-2 text-sm">
                          <div>
                            <dt className="text-muted-foreground">Patient Name:</dt>
                            <dd>{patientData.patientName || "Not provided"}</dd>
                          </div>
                          <div>
                            <dt className="text-muted-foreground">Date of Birth:</dt>
                            <dd>{patientData.patientDob || "Not provided"}</dd>
                          </div>
                          <div>
                            <dt className="text-muted-foreground">Insurance ID:</dt>
                            <dd>{patientData.patientInsuranceId || "Not provided"}</dd>
                          </div>
                          <div>
                            <dt className="text-muted-foreground">Insurance Provider:</dt>
                            <dd>{patientData.patientInsuranceProvider === "bcbs" ? "Blue Cross Blue Shield" :
                                patientData.patientInsuranceProvider === "aetna" ? "Aetna" :
                                patientData.patientInsuranceProvider === "cigna" ? "Cigna" :
                                patientData.patientInsuranceProvider === "uhc" ? "UnitedHealthcare" :
                                patientData.patientInsuranceProvider === "humana" ? "Humana" :
                                patientData.patientInsuranceProvider === "kaiser" ? "Kaiser Permanente" :
                                patientData.patientInsuranceProvider === "medicaid" ? "Medicaid" :
                                patientData.patientInsuranceProvider === "medicare" ? "Medicare" : 
                                patientData.patientInsuranceProvider || "Not provided"}</dd>
                          </div>
                          <div className="col-span-2">
                            <dt className="text-muted-foreground">Insurance Email:</dt>
                            <dd>{patientData.insuranceEmail || "Not provided"}</dd>
                          </div>
                        </dl>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-sm font-medium">Service Information</h3>
                      <div className="rounded-md bg-muted p-4">
                        <dl className="grid grid-cols-2 gap-2 text-sm">
                          <div>
                            <dt className="text-muted-foreground">Service Type:</dt>
                            <dd>{serviceData.serviceType === "individual-therapy" ? "Individual Therapy" :
                                serviceData.serviceType === "group-therapy" ? "Group Therapy" :
                                serviceData.serviceType === "initial-evaluation" ? "Initial Evaluation" :
                                serviceData.serviceType === "medication-management" ? "Medication Management" :
                                serviceData.serviceType === "psychological-testing" ? "Psychological Testing" : 
                                "Other Service"}</dd>
                          </div>
                          <div>
                            <dt className="text-muted-foreground">Service Date:</dt>
                            <dd>{serviceData.serviceDate || "Not provided"}</dd>
                          </div>
                          <div>
                            <dt className="text-muted-foreground">Total Charge:</dt>
                            <dd>${serviceData.totalCharge || "0.00"}</dd>
                          </div>
                          <div>
                            <dt className="text-muted-foreground">CPT Code:</dt>
                            <dd>{serviceData.cptCode || "Not provided"}</dd>
                          </div>
                          <div>
                            <dt className="text-muted-foreground">ICD-10 Code:</dt>
                            <dd>{serviceData.diagnosisCode || "Not provided"}</dd>
                          </div>
                          <div>
                            <dt className="text-muted-foreground">Place of Service:</dt>
                            <dd>{serviceData.placeOfService === "11" ? "11 - Office" :
                                serviceData.placeOfService === "02" ? "02 - Telehealth" :
                                serviceData.placeOfService === "12" ? "12 - Home" :
                                serviceData.placeOfService === "53" ? "53 - Community Mental Health Center" : 
                                "Other"}</dd>
                          </div>
                        </dl>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-sm font-medium">Documentation</h3>
                      <div className="rounded-md bg-muted p-4">
                        <dl className="grid gap-2 text-sm">
                          <div>
                            <dt className="text-muted-foreground">Uploaded Files:</dt>
                            {serviceData.uploadedFiles.length > 0 ? (
                              serviceData.uploadedFiles.map((file, index) => (
                                <dd key={index} className="flex items-center gap-2 mb-1">
                                  <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    className="h-4 w-4"
                                  >
                                    <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
                                    <polyline points="14 2 14 8 20 8" />
                                  </svg>
                                  <span>{file}</span>
                                </dd>
                              ))
                            ) : (
                              <dd>No files uploaded</dd>
                            )}
                          </div>
                        </dl>
                      </div>
                    </div>
                    <div className="flex items-top space-x-2">
                      <Checkbox 
                        id="certification" 
                        checked={certification}
                        onCheckedChange={setCertification}
                        required 
                      />
                      <Label htmlFor="certification" className="text-sm">
                        I certify that the services above were rendered, medically necessary, and accurately described.
                      </Label>
                    </div>
                  </CardContent>
                </>
              )}

              <CardFooter className="flex justify-between">
                <Button variant="outline" onClick={prevStep} disabled={step === 1} type="button">
                  Previous
                </Button>
                {step < totalSteps ? (
                  <Button onClick={nextStep} type="button">
                    Continue
                    <ChevronRight className="ml-2 h-4 w-4" />
                  </Button>
                ) : (
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? "Submitting..." : "Submit Claim"}
                  </Button>
                )}
              </CardFooter>
            </Card>
          </div>
        </form>
      </div>
    </DashboardShell>
  )
}
