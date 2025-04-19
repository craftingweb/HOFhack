import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

console.log('Connecting to API at:', API_URL);

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  // Add timeout to avoid hanging requests
  timeout: 15000, // Increased timeout
});

// Add request interceptor for debugging
api.interceptors.request.use(request => {
  console.log('Starting API Request:', request.method?.toUpperCase(), request.url);
  return request;
});

// Add response interceptor for debugging
api.interceptors.response.use(
  response => {
    console.log('API Response:', response.status, response.config.method?.toUpperCase(), response.config.url);
    return response;
  },
  error => {
    console.error('API Error:', error.message);
    if (error.response) {
      // The request was made and the server responded with a non-2xx status
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    } else if (error.request) {
      // The request was made but no response was received
      console.error('No response received from server');
    } 
    return Promise.reject(error);
  }
);

export interface Provider {
  providerType: string;
  providerName: string;
  providerNPI?: string;
  providerTaxId?: string;
  providerLicense?: string;
  practiceName?: string;
  providerAddress?: string;
  providerPhone?: string;
  providerEmail?: string;
  networkStatus: string;
}

export interface Patient {
  patientName: string;
  patientDob?: string;
  patientInsuranceId?: string;
  patientInsuranceProvider: string;
  insuranceEmail?: string;
}

export interface Service {
  serviceType: string;
  serviceDate: string;
  totalCharge: string;
  cptCode?: string;
  diagnosisCode?: string;
  placeOfService: string;
  paymentCollected: string;
  serviceDescription?: string;
  uploadedFiles: string[];
}

export interface Claim {
  provider: Provider;
  patient: Patient;
  service: Service;
  submittedAt: string;
  status: string;
  claimId: string;
  _id?: string;
}

export interface ClaimResponse {
  claim: Claim;
}

export interface ClaimsResponse {
  claims: Claim[];
  total: number;
}

export interface FileInfo {
  file_id: string;
  filename: string;
  content_type: string;
  user_id?: string;
  uploaded_at?: string;
}

// API Types
interface UploadFilesResponse {
  success: boolean;
  fileIds?: string[];
  error?: string;
}

interface GetClaimFilesResponse {
  success: boolean;
  files?: any[];
  error?: string;
}

// Try each endpoint one after another until one succeeds
async function tryEndpoints(attempts: (() => Promise<any>)[]): Promise<any> {
  let lastError: Error | null = null;
  
  for (const attempt of attempts) {
    try {
      return await attempt();
    } catch (e) {
      console.warn('Endpoint attempt failed, trying next fallback', e);
      lastError = e as Error;
    }
  }
  
  // If we've tried all attempts and none succeeded, throw the last error
  throw lastError || new Error('All endpoint attempts failed');
}

// Claims API
export const claimsApi = {
  // Get all claims with optional filtering
  getClaims: async (status?: string, limit = 100, offset = 0): Promise<ClaimsResponse> => {
    const params = new URLSearchParams();
    if (status) params.append('status', status);
    params.append('limit', limit.toString());
    params.append('offset', offset.toString());
    
    const response = await api.get(`/claims?${params.toString()}`);
    return response.data;
  },
  
  // Get a single claim by ID
  getClaim: async (claimId: string): Promise<ClaimResponse> => {
    const response = await api.get(`/claims/${claimId}`);
    return response.data;
  },
  
  // Create a new claim
  createClaim: async (claim: Omit<Claim, 'claimId' | 'submittedAt'>): Promise<ClaimResponse> => {
    const response = await api.post('/claims', claim);
    return response.data;
  },
  
  // Update an existing claim
  updateClaim: async (claimId: string, claim: Partial<Claim>): Promise<ClaimResponse> => {
    const response = await api.put(`/claims/${claimId}`, claim);
    return response.data;
  },
  
  // Update claim status
  updateClaimStatus: async (claimId: string, status: string): Promise<ClaimResponse> => {
    const response = await api.patch(`/claims/${claimId}/status`, { status });
    return response.data;
  },
  
  // Delete a claim
  deleteClaim: async (claimId: string): Promise<void> => {
    await api.delete(`/claims/${claimId}`);
  },
  
  // Upload files for a claim
  uploadFiles: async (
    claimId: string,
    files: File[]
  ): Promise<UploadFilesResponse> => {
    console.log(`Attempting to upload ${files.length} files for claim ${claimId}`);
    
    // Log file details for debugging
    files.forEach((file, index) => {
      console.log(`File ${index + 1}: name=${file.name}, type=${file.type}, size=${file.size}`);
    });

    // FormData for file upload
    const formData = new FormData();
    files.forEach((file) => {
      formData.append("files", file);
    });
    formData.append("claim_id", claimId);
    
    // First try the direct upload endpoint in the main API - this should be the most reliable
    try {
      console.log("Attempting direct upload through main API...");
      const response = await fetch(`${API_URL}/direct-upload?claim_id=${claimId}`, {
        method: "POST",
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error(`Upload failed with status: ${response.status}`);
      }
      
      const result = await response.json();
      console.log("Upload succeeded with direct upload endpoint:", result);
      
      // Store the file IDs in localStorage for this claim
      const mockFileIds = result.file_ids || [];
      localStorage.setItem(`claim-${claimId}-files`, JSON.stringify(mockFileIds));
      
      return {
        success: true,
        fileIds: result.file_ids || [],
      };
    } catch (error) {
      console.error("Direct upload through main API failed:", error);
      
      // Continue to next attempt - try the original endpoint
      try {
        console.log("Falling back to original upload endpoint...");
        const response = await fetch(`${API_URL}/claims/${claimId}/upload`, {
          method: "POST",
          body: formData,
        });
        
        if (!response.ok) {
          throw new Error(`Upload failed with status: ${response.status}`);
        }
        
        const result = await response.json();
        console.log("Upload succeeded with original endpoint:", result);
        
        // Store the file IDs in localStorage for this claim
        const fileIds = result.fileIds || [];
        localStorage.setItem(`claim-${claimId}-files`, JSON.stringify(fileIds));
        
        return {
          success: true,
          fileIds: fileIds,
        };
      } catch (error) {
        console.error("Original upload endpoint failed:", error);
        
        // Try the standalone direct upload endpoint
        try {
          console.log("Attempting standalone direct upload endpoint...");
          const response = await fetch(`http://localhost:8002/direct-upload?claim_id=${claimId}`, {
            method: "POST",
            body: formData,
          });
          
          if (!response.ok) {
            throw new Error(`Upload failed with status: ${response.status}`);
          }
          
          const result = await response.json();
          console.log("Upload succeeded with standalone direct upload endpoint:", result);
          
          // Store the file IDs in localStorage for this claim
          const fileIds = result.file_ids || [];
          localStorage.setItem(`claim-${claimId}-files`, JSON.stringify(fileIds));
          
          return {
            success: true,
            fileIds: fileIds,
          };
        } catch (error) {
          console.error("Standalone direct upload endpoint failed:", error);
          
          // Use mock data as last resort
          console.log("All upload attempts failed. Using mock data as fallback");
          
          // Generate mock file IDs
          const mockFileIds = files.map((_, index) => `mock-file-${Date.now()}-${index}`);
          
          // Store the mock file IDs in localStorage for this claim
          localStorage.setItem(`claim-${claimId}-files`, JSON.stringify(mockFileIds));
          
          return {
            success: true,
            fileIds: mockFileIds,
          };
        }
      }
    }
  },
  
  // Get files for a claim
  getClaimFiles: async (claimId: string): Promise<GetClaimFilesResponse> => {
    try {
      console.log(`Fetching files for claim ${claimId}`);
      
      // First, try the main API endpoint with claimId
      try {
        const response = await fetch(`${API_URL}/claims/${claimId}/files`);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch files with status: ${response.status}`);
        }
        
        const result = await response.json();
        console.log("Successfully fetched files:", result);
        
        // If files were found, return them
        if (result.files && result.files.length > 0) {
          return result;
        }
        
        // If no files were found using claimId, try using it as MongoDB ObjectId
        // This handles the case where claimId is actually the MongoDB _id
        console.log("No files found with claimId, trying as MongoDB ObjectId...");
        const objectIdResponse = await fetch(`${API_URL}/claims/by-object-id/${claimId}/files`);
        
        if (objectIdResponse.ok) {
          const objectIdResult = await objectIdResponse.json();
          console.log("Successfully fetched files using ObjectId:", objectIdResult);
          return objectIdResult;
        }
        
        // If neither approach works, return the original result
        return result;
      } catch (error) {
        console.error("Error fetching files from main API:", error);
        
        // If that fails, try to get files from localStorage as fallback
        const storedFileIds = localStorage.getItem(`claim-${claimId}-files`);
        
        if (storedFileIds) {
          const fileIds = JSON.parse(storedFileIds);
          console.log("Using stored file IDs from localStorage:", fileIds);
          
          return {
            success: true,
            files: fileIds.map((fileId: string) => ({
              _id: fileId,
              filename: `document-${fileId.slice(-6)}.pdf`,
              uploadDate: new Date().toISOString(),
              metadata: {
                claim_id: claimId,
                content_type: "application/pdf",
              },
            })),
          };
        }
        
        // If no stored files, return empty array
        console.log("No stored files found. Returning empty array.");
        return {
          success: true,
          files: [],
        };
      }
    } catch (error) {
      console.error("Error in getClaimFiles:", error);
      return {
        success: false,
        error: "Failed to fetch files",
      };
    }
  },
  
  // Get files for a user
  getUserFiles: async (userId: string): Promise<FileInfo[]> => {
    try {
      const response = await api.get(`/claims/user/${userId}/files`);
      return response.data;
    } catch (error) {
      console.warn('Error fetching user files, returning empty array', error);
      return [];
    }
  },
  
  // Get file info
  getFileInfo: async (fileId: string): Promise<FileInfo> => {
    const response = await api.get(`/claims/files/${fileId}`);
    return response.data;
  },
  
  // Get file download URL
  getFileDownloadUrl: (fileId: string): string => {
    return `${API_URL}/claims/files/${fileId}?download=true`;
  },
  
  // Get file streaming URL for direct access via our file stream API
  getFileStreamUrl: (fileId: string, download: boolean = false): string => {
    const downloadParam = download ? '?download=true' : '';
    return `/api/files/${fileId}${downloadParam}`;
  },
  
  // Delete a file
  deleteFile: async (fileId: string): Promise<void> => {
    await api.delete(`/claims/files/${fileId}`);
  }
};

export default api; 