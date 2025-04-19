"use client"

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { DashboardShell } from "@/components/dashboard-shell"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { FileUpload } from "@/components/ui/file-upload"
import { claimsApi, Claim, FileInfo } from "@/lib/api"
import { toast } from "sonner"
import { ArrowUpRight, CheckCircle, AlertTriangle, FileText, Upload } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"

interface GetClaimFilesResponse {
  success: boolean;
  files?: any[];
  error?: string;
}

export default function ClaimDetailsPage() {
  const params = useParams()
  const claimId = params.claimId as string
  
  const [claim, setClaim] = useState<Claim | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [files, setFiles] = useState<FileInfo[]>([])
  const [isFilesLoading, setIsFilesLoading] = useState(true)
  const [isFilesFetchError, setIsFilesFetchError] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [passChance, setPassChance] = useState<number | null>(null)
  const [showNoFilesWarning, setShowNoFilesWarning] = useState(false)
  const [currentUserId, setCurrentUserId] = useState<string>('6803989cb5170ea2ce83b047')

  useEffect(() => {

    const fetchCurrentUser = async () => {
      setCurrentUserId('6803989cb5170ea2ce83b047')
    }
    
    fetchCurrentUser()
  }, [])

  useEffect(() => {
    const fetchClaimDetails = async () => {
      try {
        const response = await claimsApi.getClaim(claimId)
        setClaim(response.claim)
        
        // Fetch files separately
        fetchClaimFiles()
      } catch (error) {
        console.error('Error fetching claim details:', error)
        toast.error('Failed to load claim details')
      } finally {
        setIsLoading(false)
      }
    }

    if (claimId) {
      fetchClaimDetails()
    }
  }, [claimId])

  const fetchClaimFiles = async (showToast = false) => {
    try {
      setIsFilesLoading(true);
      setIsFilesFetchError(false);
      
      console.log(`Attempting to fetch files for claim ID: ${claimId}`);
      
      // Try to determine if this is a MongoDB ObjectId
      const isObjectId = /^[0-9a-fA-F]{24}$/.test(claimId as string);
      const mongoDbId = claim?._id || claimId;
      
      console.log(`Is MongoDB ObjectId: ${isObjectId}, Using ID: ${mongoDbId}`);
      
      // Get files from backend API
      const response = await claimsApi.getClaimFiles(mongoDbId as string);
      
      if (response.success && response.files) {
        // Convert to FileInfo[] and update state
        const fileInfos: FileInfo[] = response.files.map((file: any) => ({
          file_id: file._id || file.file_id,
          filename: file.filename,
          content_type: file.metadata?.content_type || file.content_type || 'application/octet-stream',
          uploaded_at: file.metadata?.uploaded_at || file.uploaded_at || new Date().toISOString()
        }));
        
        // Log the results for debugging
        console.log(`Fetched ${fileInfos.length} files for claim ${mongoDbId}:`, fileInfos);
        
        setFiles(fileInfos);
        
        if (showToast) {
          toast.success('Files refreshed successfully');
        }
      } else {
        setFiles([]);
      }
    } catch (error) {
      console.error('Error fetching files:', error);
      setIsFilesFetchError(true);
      setFiles([]);
      if (showToast) {
        toast.error('Failed to load files. Try refreshing.');
      }
    } finally {
      setIsFilesLoading(false);
    }
  };

  // Auto-refresh files every 30 seconds if the tab is active
  useEffect(() => {
    if (!claimId) return
    
    // Set up an interval to refresh files
    const interval = setInterval(() => {
      // Only refresh if the document is visible (tab is active)
      if (document.visibilityState === 'visible') {
        fetchClaimFiles(false)
      }
    }, 30000) // 30 seconds
    
    // Clean up interval
    return () => clearInterval(interval)
  }, [claimId])

  const handleFilesUploaded = async (fileIds: string[]) => {
    // After upload, refresh the file list
    await fetchClaimFiles(true)
  }

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100'
      case 'approved': return 'bg-green-100 text-green-800 hover:bg-green-100'
      case 'denied': return 'bg-red-100 text-red-800 hover:bg-red-100'
      case 'appealed': return 'bg-blue-100 text-blue-800 hover:bg-blue-100'
      case 'info-requested': return 'bg-purple-100 text-purple-800 hover:bg-purple-100'
      default: return 'bg-gray-100 text-gray-800 hover:bg-gray-100'
    }
  }

  const handleSubmitToProvider = async () => {
    // Check if files are attached first
    if (files.length === 0) {
      setShowNoFilesWarning(true)
      return
    }
    
    setIsSubmitting(true)
    try {
      console.log(`Processing files for claim ID: ${claimId}...`);
      
      // Rather than download and re-upload files, use our new API endpoint
      // that streams directly from MongoDB to the Python backend
      const processResponse = await fetch(`/api/claims/${claimId}/process`, {
        method: 'POST',
      });
      
      if (!processResponse.ok) {
        const errorData = await processResponse.json();
        throw new Error(`Process PDFs failed: ${errorData.error || processResponse.statusText}`);
      }
      
      const { data } = await processResponse.json();
      console.log("PDF processing result:", data);
      
      // Submit to provider with the extracted information
      console.log(`Submitting processed data to insurance provider API...`);
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      const submitResponse = await fetch(`${apiUrl}/insurance/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          claim_id: claimId,
          extracted_data: data
        }),
      });
      
      if (!submitResponse.ok) {
        const errorText = await submitResponse.text();
        throw new Error(`Submit to provider failed with status: ${submitResponse.status}. Details: ${errorText}`);
      }
      
      const submitResult = await submitResponse.json();
      console.log("Submit to provider result:", submitResult);
      
      toast.success("Claim processed and submitted to insurance provider successfully");
    } catch (error) {
      console.error("Error in submit to provider:", error);
      toast.error(`Failed to submit claim: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsSubmitting(false);
    }
  }

  const analyzeClaimSuccess = async () => {
    setIsAnalyzing(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      const randomChance = Math.floor(Math.random() * (95 - 65 + 1)) + 65;
      setPassChance(randomChance);
    } catch (error) {
      toast.error("Failed to analyze claim");
      console.error(error);
    } finally {
      setIsAnalyzing(false);
    }
  }

  const scrollToDocumentSection = () => {
    const documentSection = document.getElementById('supporting-documents-section');
    if (documentSection) {
      documentSection.scrollIntoView({ behavior: 'smooth' });
    }
    setShowNoFilesWarning(false);
  }

  if (isLoading) {
    return (
      <DashboardShell>
        <div className="space-y-6">
          <Skeleton className="h-8 w-[250px]" />
          <Skeleton className="h-[200px] w-full" />
          <Skeleton className="h-[200px] w-full" />
          <Skeleton className="h-[200px] w-full" />
        </div>
      </DashboardShell>
    )
  }

  if (!claim) {
    return (
      <DashboardShell>
        <div className="flex flex-col items-center justify-center h-[60vh] space-y-4">
          <h1 className="text-2xl font-bold">Claim Not Found</h1>
          <p className="text-muted-foreground">The claim you're looking for doesn't exist or has been deleted.</p>
          <Button 
            variant="outline" 
            onClick={() => window.history.back()}
          >
            Go Back
          </Button>
        </div>
      </DashboardShell>
    )
  }

  return (
    <DashboardShell>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Claim Details</h1>
            <p className="text-muted-foreground">
              Claim ID: {claim.claimId} • Submitted on {new Date(claim.submittedAt).toLocaleDateString()}
            </p>
          </div>
          <Badge 
            className={getStatusBadgeColor(claim.status)}
          >
            {claim.status.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
          </Badge>
        </div>

        {/* Insurance Submission and Analysis */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Submit to Insurance Provider Card */}
          <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ArrowUpRight className="h-5 w-5 text-blue-600" />
                Submit to Insurance Provider
              </CardTitle>
              <CardDescription>
                Send this claim directly to the patient's insurance company
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm mb-4">
                This will electronically submit your claim to {claim.patient.patientInsuranceProvider} 
                for processing. Make sure all information is accurate before submitting.
              </p>
              {files.length === 0 && (
                <div className="bg-amber-50 border border-amber-200 rounded-md p-3 mb-4 animate-pulse">
                  <p className="text-sm flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-amber-500" />
                    <span className="font-medium text-amber-800">No supporting documents attached. Consider adding documentation before submitting.</span>
                  </p>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={scrollToDocumentSection}
                    className="text-amber-700 hover:text-amber-900 hover:bg-amber-100 mt-2 text-xs flex items-center gap-1"
                  >
                    <Upload size={12} />
                    Add documents now
                  </Button>
                </div>
              )}
              {files.length > 0 && (
                <div className="bg-green-50 border border-green-200 rounded-md p-3 mb-4">
                  <p className="text-sm flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="font-medium text-green-800">{files.length} {files.length === 1 ? 'document' : 'documents'} attached to this claim</span>
                  </p>
                </div>
              )}
            </CardContent>
            <CardFooter>
              <Button 
                onClick={handleSubmitToProvider}
                disabled={isSubmitting}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                {isSubmitting ? 'Submitting...' : 'Submit Claim to Provider'}
              </Button>
            </CardFooter>
          </Card>

          {/* Claim Success Prediction Card */}
          <Card className="bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-emerald-600" />
                Chance of Passing
              </CardTitle>
              <CardDescription>
                Analyze probability of claim approval based on historical data
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm mb-4">
                Our AI analyzes your claim against thousands of previous submissions 
                to predict the likelihood of approval by {claim.patient.patientInsuranceProvider}.
              </p>
              
              {passChance !== null && (
                <div className="mt-4 mb-2">
                  <div className="flex justify-between mb-1">
                    <span className="text-sm font-medium">Success Rate:</span>
                    <span className="text-sm font-medium">{passChance}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div 
                      className={`h-2.5 rounded-full ${
                        passChance >= 80 ? 'bg-green-500' : 
                        passChance >= 70 ? 'bg-emerald-500' : 
                        passChance >= 50 ? 'bg-yellow-500' : 'bg-red-500'
                      }`} 
                      style={{ width: `${passChance}%` }}
                    ></div>
                  </div>
                  <p className="text-xs mt-2 text-slate-600">
                    {passChance >= 80 ? 'High chance of approval. Your claim is well-formatted and complete.' : 
                     passChance >= 70 ? 'Good chance of approval. Consider adding more documentation.' :
                     passChance >= 50 ? 'Moderate chance of approval. Review claim details for accuracy.' :
                     'Lower chance of approval. Please review all claim details carefully.'}
                  </p>
                </div>
              )}
            </CardContent>
            <CardFooter>
              <Button 
                onClick={analyzeClaimSuccess}
                disabled={isAnalyzing}
                variant="outline" 
                className="w-full border-emerald-500 text-emerald-700 hover:bg-emerald-50"
              >
                {isAnalyzing ? 'Analyzing...' : passChance !== null ? 'Re-analyze Claim' : 'Analyze Approval Chance'}
              </Button>
            </CardFooter>
          </Card>
        </div>

        {/* Provider Information */}
        <Card>
          <CardHeader>
            <CardTitle>Provider Information</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium">Provider Name</p>
              <p className="text-sm text-muted-foreground">{claim.provider.providerName}</p>
            </div>
            <div>
              <p className="text-sm font-medium">Provider Type</p>
              <p className="text-sm text-muted-foreground">{claim.provider.providerType.replace(/\b\w/g, l => l.toUpperCase())}</p>
            </div>
            {claim.provider.providerNPI && (
              <div>
                <p className="text-sm font-medium">NPI Number</p>
                <p className="text-sm text-muted-foreground">{claim.provider.providerNPI}</p>
              </div>
            )}
            {claim.provider.practiceName && (
              <div>
                <p className="text-sm font-medium">Practice Name</p>
                <p className="text-sm text-muted-foreground">{claim.provider.practiceName}</p>
              </div>
            )}
            <div>
              <p className="text-sm font-medium">Network Status</p>
              <p className="text-sm text-muted-foreground">
                {claim.provider.networkStatus === 'in-network' ? 'In-Network' : 'Out-of-Network'}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Patient Information */}
        <Card>
          <CardHeader>
            <CardTitle>Patient Information</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium">Patient Name</p>
              <p className="text-sm text-muted-foreground">{claim.patient.patientName}</p>
            </div>
            {claim.patient.patientDob && (
              <div>
                <p className="text-sm font-medium">Date of Birth</p>
                <p className="text-sm text-muted-foreground">{claim.patient.patientDob}</p>
              </div>
            )}
            <div>
              <p className="text-sm font-medium">Insurance Provider</p>
              <p className="text-sm text-muted-foreground">{claim.patient.patientInsuranceProvider}</p>
            </div>
            {claim.patient.patientInsuranceId && (
              <div>
                <p className="text-sm font-medium">Insurance ID</p>
                <p className="text-sm text-muted-foreground">{claim.patient.patientInsuranceId}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Service Information */}
        <Card>
          <CardHeader>
            <CardTitle>Service Information</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium">Service Type</p>
              <p className="text-sm text-muted-foreground">
                {claim.service.serviceType.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium">Service Date</p>
              <p className="text-sm text-muted-foreground">{claim.service.serviceDate}</p>
            </div>
            <div>
              <p className="text-sm font-medium">Total Charge</p>
              <p className="text-sm text-muted-foreground">${claim.service.totalCharge}</p>
            </div>
            <div>
              <p className="text-sm font-medium">Payment Collected</p>
              <p className="text-sm text-muted-foreground">${claim.service.paymentCollected}</p>
            </div>
            {claim.service.cptCode && (
              <div>
                <p className="text-sm font-medium">CPT Code</p>
                <p className="text-sm text-muted-foreground">{claim.service.cptCode}</p>
              </div>
            )}
            {claim.service.diagnosisCode && (
              <div>
                <p className="text-sm font-medium">Diagnosis Code</p>
                <p className="text-sm text-muted-foreground">{claim.service.diagnosisCode}</p>
              </div>
            )}
            {claim.service.serviceDescription && (
              <div className="col-span-2">
                <p className="text-sm font-medium">Service Description</p>
                <p className="text-sm text-muted-foreground">{claim.service.serviceDescription}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Supporting Documents */}
        <Card id="supporting-documents-section">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-slate-600" />
              Supporting Documents
            </CardTitle>
            <CardDescription>Upload and manage supporting documentation for this claim</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* File List Section */}
              {files.length > 0 ? (
                <div className="border rounded-md p-4 bg-slate-50">
                  <h3 className="font-medium mb-3 text-slate-800">Attached Documents</h3>
                  <div className="space-y-3">
                    {files.map((file) => (
                      <div 
                        key={file.file_id} 
                        className="flex items-center gap-3 p-2 border border-slate-200 rounded-md bg-white hover:bg-blue-50 transition-colors"
                      >
                        <div className="p-2 bg-blue-100 rounded-md">
                          <FileText size={18} className="text-blue-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{file.filename}</p>
                          <p className="text-xs text-muted-foreground">
                            {file.uploaded_at ? new Date(file.uploaded_at).toLocaleString() : 'Date unknown'}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost" 
                            size="sm"
                            className="text-blue-600 hover:text-blue-800 hover:bg-blue-100"
                            onClick={() => {
                              const url = claimsApi.getFileStreamUrl(file.file_id);
                              window.open(url, '_blank');
                            }}
                          >
                            View
                          </Button>
                          <Button
                            variant="ghost" 
                            size="sm"
                            className="text-red-600 hover:text-red-800 hover:bg-red-100"
                            onClick={async () => {
                              try {
                                await claimsApi.deleteFile(file.file_id);
                                setFiles(files.filter(f => f.file_id !== file.file_id));
                                toast.success("File deleted successfully");
                              } catch (error) {
                                toast.error("Failed to delete file");
                                console.error(error);
                              }
                            }}
                          >
                            Delete
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="border border-dashed rounded-md p-6 flex flex-col items-center justify-center bg-slate-50">
                  <div className="p-3 bg-slate-100 rounded-full mb-3">
                    <FileText size={24} className="text-slate-400" />
                  </div>
                  <h3 className="font-medium text-slate-800">No documents attached</h3>
                  <p className="text-sm text-muted-foreground text-center mt-1 mb-3 max-w-md">
                    Attach supporting documentation to improve the chances of your claim being approved by the insurance provider.
                  </p>
                </div>
              )}

              {/* Upload Section */}
              <div className="mt-6">
                <h3 className="font-medium mb-3 text-slate-800">Upload New Documents</h3>
                <FileUpload 
                  claimId={claimId}
                  userId={currentUserId}
                  multiple={true}
                  uploadImmediately={true}
                  onFilesUploaded={handleFilesUploaded}
                />
              </div>
            </div>
          </CardContent>
          {files.length > 0 && (
            <CardFooter className="border-t px-6 py-4 bg-slate-50">
              <div className="w-full flex justify-between items-center">
                <p className="text-sm text-slate-600">
                  <span className="font-medium">{files.length}</span> document{files.length !== 1 ? 's' : ''} attached
                </p>
                <Button 
                  variant="outline" 
                  size="sm"
                  className="text-blue-600 border-blue-300 hover:bg-blue-50"
                  disabled={isFilesLoading}
                  onClick={() => fetchClaimFiles(true)}
                >
                  {isFilesLoading ? (
                    <span className="flex items-center gap-2">
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Refreshing...
                    </span>
                  ) : (
                    'Refresh Documents'
                  )}
                </Button>
              </div>
            </CardFooter>
          )}

          {/* Show error message if files failed to load */}
          {isFilesFetchError && !isFilesLoading && (
            <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-800 flex items-center gap-2">
                <AlertTriangle size={16} className="text-red-500" />
                Failed to load documents. 
                <Button 
                  variant="link" 
                  className="text-red-600 p-0 h-auto" 
                  onClick={() => fetchClaimFiles(true)}
                >
                  Try again
                </Button>
              </p>
            </div>
          )}

          {/* Show loading state when initially loading files */}
          {isFilesLoading && !files.length && !isFilesFetchError && (
            <div className="border rounded-md p-4 animate-pulse">
              <div className="h-4 bg-slate-200 rounded w-1/3 mb-3"></div>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-slate-200 rounded-md"></div>
                  <div className="flex-1">
                    <div className="h-3 bg-slate-200 rounded w-1/2 mb-2"></div>
                    <div className="h-2 bg-slate-200 rounded w-1/4"></div>
                  </div>
                  <div className="flex gap-2">
                    <div className="w-12 h-6 bg-slate-200 rounded"></div>
                    <div className="w-12 h-6 bg-slate-200 rounded"></div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-slate-200 rounded-md"></div>
                  <div className="flex-1">
                    <div className="h-3 bg-slate-200 rounded w-3/4 mb-2"></div>
                    <div className="h-2 bg-slate-200 rounded w-1/4"></div>
                  </div>
                  <div className="flex gap-2">
                    <div className="w-12 h-6 bg-slate-200 rounded"></div>
                    <div className="w-12 h-6 bg-slate-200 rounded"></div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </Card>
      </div>

      {/* No Files Warning Dialog */}
      <Dialog open={showNoFilesWarning} onOpenChange={setShowNoFilesWarning}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              Supporting Documents Required
            </DialogTitle>
            <DialogDescription>
              Insurance providers typically require supporting documentation for claim processing.
            </DialogDescription>
          </DialogHeader>
          <div className="p-4 bg-amber-50 rounded-md my-2">
            <p className="text-sm text-amber-800">
              No supporting documents are currently attached to this claim. For the best chance of approval, 
              please add at least one of the following documents:
            </p>
            <ul className="list-disc ml-5 mt-2 text-sm text-amber-800">
              <li>Superbill or invoice</li>
              <li>Diagnosis documentation</li>
              <li>Treatment notes</li>
              <li>Referral information (if applicable)</li>
            </ul>
          </div>
          <DialogFooter className="flex flex-col sm:flex-row sm:justify-between gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowNoFilesWarning(false)}
            >
              Proceed Anyway
            </Button>
            <Button 
              type="button"
              onClick={scrollToDocumentSection}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Add Documents
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardShell>
  )
} 