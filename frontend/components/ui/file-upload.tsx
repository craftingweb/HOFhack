"use client"

import React, { useState, useRef } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Trash2, FileText, Upload } from "lucide-react"
import { claimsApi, FileInfo } from '@/lib/api'

interface FileUploadProps {
  claimId?: string
  userId?: string
  onFilesUploaded?: (fileIds: string[]) => void
  onError?: (error: Error) => void
  multiple?: boolean
  disabled?: boolean
  uploadImmediately?: boolean
}

export function FileUpload({
  claimId,
  userId,
  onFilesUploaded,
  onError,
  multiple = true,
  disabled = false,
  uploadImmediately = false
}: FileUploadProps) {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [uploading, setUploading] = useState(false)
  const [uploadedFiles, setUploadedFiles] = useState<FileInfo[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files)
      setSelectedFiles(prev => (multiple ? [...prev, ...files] : files))
      
      // Reset the input to allow selecting the same file again
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }

      // If uploadImmediately is true and claimId is provided, upload files right away
      if (uploadImmediately && claimId) {
        handleUpload(files)
      }
    }
  }

  const handleUpload = async (filesToUpload = selectedFiles) => {
    if (!claimId) {
      console.error('Cannot upload files: No claim ID provided')
      return
    }

    if (filesToUpload.length === 0) {
      return
    }

    try {
      setUploading(true)
      // Pass userId if available
      const fileIds = await claimsApi.uploadFiles(claimId, filesToUpload, userId)
      
      // If uploaded successfully, fetch file info
      const updatedFiles = await claimsApi.getClaimFiles(claimId)
      setUploadedFiles(updatedFiles)
      
      // Remove uploaded files from selectedFiles
      setSelectedFiles([])
      
      // Call callback if provided
      if (onFilesUploaded) {
        onFilesUploaded(fileIds)
      }
    } catch (error) {
      console.error('Error uploading files:', error)
      if (onError && error instanceof Error) {
        onError(error)
      }
    } finally {
      setUploading(false)
    }
  }

  const handleRemoveSelected = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index))
  }

  const handleRemoveUploaded = async (fileId: string) => {
    if (!claimId) return
    
    try {
      await claimsApi.deleteFile(fileId)
      setUploadedFiles(prev => prev.filter(file => file.file_id !== fileId))
    } catch (error) {
      console.error('Error deleting file:', error)
    }
  }

  const downloadFile = (fileId: string, filename: string) => {
    const url = claimsApi.getFileDownloadUrl(fileId)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <Input
          ref={fileInputRef}
          type="file"
          accept="application/pdf"
          onChange={handleFileChange}
          multiple={multiple}
          disabled={disabled || uploading}
          className="flex-1"
        />
        {!uploadImmediately && claimId && selectedFiles.length > 0 && (
          <Button 
            onClick={() => handleUpload()} 
            disabled={uploading || disabled}
            variant="outline"
          >
            {uploading ? 'Uploading...' : 'Upload'}
          </Button>
        )}
      </div>
      
      {selectedFiles.length > 0 && (
        <div className="border rounded-md p-4">
          <h3 className="font-medium mb-2">Selected Files</h3>
          <ul className="space-y-2">
            {selectedFiles.map((file, index) => (
              <li key={`${file.name}-${index}`} className="flex items-center gap-2">
                <FileText size={16} className="text-muted-foreground" />
                <span className="flex-1 truncate">{file.name}</span>
                <button 
                  onClick={() => handleRemoveSelected(index)}
                  className="text-red-500 hover:text-red-700 rounded-full p-1"
                  disabled={uploading || disabled}
                >
                  <Trash2 size={16} />
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
      
      {uploadedFiles.length > 0 && (
        <div className="border rounded-md p-4">
          <h3 className="font-medium mb-2">Uploaded Files</h3>
          <ul className="space-y-2">
            {uploadedFiles.map((file) => (
              <li key={file.file_id} className="flex items-center gap-2">
                <FileText size={16} className="text-muted-foreground" />
                <span 
                  className="flex-1 truncate cursor-pointer text-blue-500 hover:underline"
                  onClick={() => downloadFile(file.file_id, file.filename)}
                >
                  {file.filename}
                </span>
                {file.user_id && (
                  <span className="text-xs text-gray-500">
                    Uploaded by: {file.user_id}
                  </span>
                )}
                <button 
                  onClick={() => handleRemoveUploaded(file.file_id)}
                  className="text-red-500 hover:text-red-700 rounded-full p-1"
                  disabled={disabled}
                >
                  <Trash2 size={16} />
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
} 