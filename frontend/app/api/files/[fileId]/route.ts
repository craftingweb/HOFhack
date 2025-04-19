/* =============================================================
   app/api/files/[fileId]/route.ts
   -------------------------------------------------------------
   Streams a single GridFS file back to the browser for preview
   or download (used by the "View" button in the dashboard).
   ============================================================= */
import { NextRequest, NextResponse } from 'next/server'
import { MongoClient, ObjectId, GridFSBucket } from 'mongodb'

// Reuse the MongoDB connection setup
let cachedClient: MongoClient | null = null
async function getMongo() {
  if (cachedClient) return cachedClient
  cachedClient = new MongoClient(process.env.MONGODB_URI!, {
    maxPoolSize: 5,
    serverSelectionTimeoutMS: 30_000
  })
  await cachedClient.connect()
  return cachedClient
}

export async function GET(
  req: NextRequest,
  { params }: { params: { fileId: string } }
) {
  try {
    const client = await getMongo()
    const db     = client.db(process.env.MONGODB_DB || 'claims-management')
    const bucket = new GridFSBucket(db)

    // Get the file ID from the URL
    const fileId = new ObjectId(params.fileId)
    
    // Check if file exists
    const file = await db.collection('fs.files').findOne({ _id: fileId })
    if (!file) {
      console.error(`[file-download] File not found: ${fileId}`)
      return new Response('File not found', { status: 404 })
    }

    // Check if this is a download request (via query parameter)
    const { searchParams } = new URL(req.url)
    const isDownload = searchParams.get('download') === 'true'
    
    // Open a download stream for the file
    const stream = bucket.openDownloadStream(fileId)

    // Return the file as a streaming response
    return new NextResponse(stream as any, {
      headers: {
        'Content-Type': file.metadata?.content_type || 'application/octet-stream',
        'Content-Disposition': isDownload 
          ? `attachment; filename="${file.filename}"` 
          : `inline; filename="${file.filename}"`
      }
    })
  } catch (err: any) {
    console.error('[file‑download] fatal', err)
    return new Response('Internal server error', { status: 500 })
  }
} 