"use client"

import { cn } from "@/lib/utils"

import { useState } from "react"
import Link from "next/link"
import { ChevronLeft, ChevronRight, Upload } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { DashboardShell } from "@/components/dashboard-shell"

export default function NewClaimPage() {
  const [step, setStep] = useState(1)
  const totalSteps = 4

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

  return (
    <DashboardShell>
      <div className="mx-auto max-w-3xl">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Submit a New Claim</h1>
            <p className="text-muted-foreground">
              Complete the form below to submit a new mental health insurance claim.
            </p>
          </div>
          <Button variant="outline" asChild>
            <Link href="/">
              <ChevronLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Link>
          </Button>
        </div>

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
                    {i === 0 ? "Provider" : i === 1 ? "Service" : i === 2 ? "Documents" : "Review"}
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
                    Enter details about the healthcare provider who delivered the service.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="provider-type">Provider Type</Label>
                    <Select defaultValue="therapist">
                      <SelectTrigger id="provider-type">
                        <SelectValue placeholder="Select provider type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="therapist">Therapist</SelectItem>
                        <SelectItem value="psychiatrist">Psychiatrist</SelectItem>
                        <SelectItem value="psychologist">Psychologist</SelectItem>
                        <SelectItem value="counselor">Counselor</SelectItem>
                        <SelectItem value="other">Other Mental Health Provider</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="provider-name">Provider Name</Label>
                    <Input id="provider-name" placeholder="Dr. Jane Smith" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="provider-npi">Provider NPI Number (if known)</Label>
                    <Input id="provider-npi" placeholder="1234567890" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="provider-address">Provider Address</Label>
                    <Textarea id="provider-address" placeholder="123 Main St, Anytown, CA 12345" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="provider-email">Provider Email</Label>
                    <Input id="provider-email" type="email" placeholder="provider@example.com" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="provider-network">Network Status</Label>
                    <RadioGroup defaultValue="in-network">
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="in-network" id="in-network" />
                        <Label htmlFor="in-network">In-Network</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="out-of-network" id="out-of-network" />
                        <Label htmlFor="out-of-network">Out-of-Network</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="unknown" id="unknown" />
                        <Label htmlFor="unknown">I'm not sure</Label>
                      </div>
                    </RadioGroup>
                  </div>
                </CardContent>
              </>
            )}

            {step === 2 && (
              <>
                <CardHeader>
                  <CardTitle>Service Information</CardTitle>
                  <CardDescription>Enter details about the mental health service you received.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="service-type">Service Type</Label>
                    <Select defaultValue="therapy">
                      <SelectTrigger id="service-type">
                        <SelectValue placeholder="Select service type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="therapy">Individual Therapy</SelectItem>
                        <SelectItem value="group-therapy">Group Therapy</SelectItem>
                        <SelectItem value="medication-management">Medication Management</SelectItem>
                        <SelectItem value="psychological-testing">Psychological Testing</SelectItem>
                        <SelectItem value="other">Other Service</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="service-date">Service Date</Label>
                      <Input id="service-date" type="date" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="service-cost">Total Cost ($)</Label>
                      <Input id="service-cost" type="number" placeholder="150.00" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="diagnosis-code">Diagnosis Code (if known)</Label>
                    <Input id="diagnosis-code" placeholder="F41.9" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cpt-code">CPT/Procedure Code (if known)</Label>
                    <Input id="cpt-code" placeholder="90834" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="service-description">Service Description</Label>
                    <Textarea
                      id="service-description"
                      placeholder="Brief description of the service provided"
                      rows={3}
                    />
                  </div>
                </CardContent>
              </>
            )}

            {step === 3 && (
              <>
                <CardHeader>
                  <CardTitle>Documentation Upload</CardTitle>
                  <CardDescription>
                    Upload supporting documents for your claim. This may include receipts, superbills, or other
                    documentation from your provider.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4">
                    <div className="rounded-lg border border-dashed p-8 text-center">
                      <div className="mx-auto flex max-w-[420px] flex-col items-center justify-center">
                        <Upload className="h-10 w-10 text-muted-foreground" />
                        <h3 className="mt-4 text-lg font-semibold">Upload Receipt or Superbill</h3>
                        <p className="mt-2 text-sm text-muted-foreground">
                          Drag and drop your files here, or click to browse
                        </p>
                        <div className="mt-4">
                          <Button variant="outline" size="sm">
                            Browse Files
                          </Button>
                        </div>
                        <p className="mt-2 text-xs text-muted-foreground">PDF, JPG, or PNG files up to 10MB</p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="document-type">Document Type</Label>
                      <Select defaultValue="superbill">
                        <SelectTrigger id="document-type">
                          <SelectValue placeholder="Select document type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="superbill">Superbill</SelectItem>
                          <SelectItem value="receipt">Receipt</SelectItem>
                          <SelectItem value="eob">Explanation of Benefits</SelectItem>
                          <SelectItem value="prescription">Prescription</SelectItem>
                          <SelectItem value="other">Other Document</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="document-notes">Additional Notes</Label>
                      <Textarea
                        id="document-notes"
                        placeholder="Any additional information about the uploaded documents"
                        rows={3}
                      />
                    </div>
                  </div>
                </CardContent>
              </>
            )}

            {step === 4 && (
              <>
                <CardHeader>
                  <CardTitle>Review and Submit</CardTitle>
                  <CardDescription>Review your claim information before submitting.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <h3 className="text-sm font-medium">Provider Information</h3>
                    <div className="rounded-md bg-muted p-4">
                      <dl className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <dt className="text-muted-foreground">Provider Type:</dt>
                          <dd>Therapist</dd>
                        </div>
                        <div>
                          <dt className="text-muted-foreground">Provider Name:</dt>
                          <dd>Dr. Jane Smith</dd>
                        </div>
                        <div className="col-span-2">
                          <dt className="text-muted-foreground">Provider Address:</dt>
                          <dd>123 Main St, Anytown, CA 12345</dd>
                        </div>
                        <div className="col-span-2">
                          <dt className="text-muted-foreground">Provider Email:</dt>
                          <dd>provider@example.com</dd>
                        </div>
                        <div>
                          <dt className="text-muted-foreground">Network Status:</dt>
                          <dd>In-Network</dd>
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
                          <dd>Individual Therapy</dd>
                        </div>
                        <div>
                          <dt className="text-muted-foreground">Service Date:</dt>
                          <dd>April 15, 2025</dd>
                        </div>
                        <div>
                          <dt className="text-muted-foreground">Total Cost:</dt>
                          <dd>$150.00</dd>
                        </div>
                        <div>
                          <dt className="text-muted-foreground">CPT Code:</dt>
                          <dd>90834</dd>
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
                          <dd className="flex items-center gap-2">
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
                            <span>receipt-april-15-2025.pdf</span>
                          </dd>
                        </div>
                      </dl>
                    </div>
                  </div>
                  <div className="rounded-md bg-yellow-50 p-4 text-sm text-yellow-800">
                    <p>
                      By submitting this claim, you certify that all information provided is accurate and complete to
                      the best of your knowledge.
                    </p>
                  </div>
                </CardContent>
              </>
            )}

            <CardFooter className="flex justify-between">
              <Button variant="outline" onClick={prevStep} disabled={step === 1}>
                Previous
              </Button>
              {step < totalSteps ? (
                <Button onClick={nextStep}>
                  Continue
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              ) : (
                <Button>Submit Claim</Button>
              )}
            </CardFooter>
          </Card>
        </div>
      </div>
    </DashboardShell>
  )
}
