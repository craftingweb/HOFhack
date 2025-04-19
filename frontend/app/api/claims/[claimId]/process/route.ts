/* =============================================================
   app/api/claims/[claimId]/process/route.ts
   -------------------------------------------------------------
   Streams every PDF in GridFS that belongs to the claim into a
   multipart FormData object and relays it to the Python
   backend's /process-pdfs endpoint. Returns the backend's JSON.
   ============================================================= */
import { NextRequest, NextResponse } from 'next/server'
import { MongoClient, ObjectId, GridFSBucket } from 'mongodb'
import FormData from 'form-data'
import stream from 'stream'
import { promisify } from 'util'

// -- helpers --------------------------------------------------
const pipeline = promisify(stream.pipeline)

/*  Mongo singleton – keeps one driver instance per lambda warm  */
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

// -- route handler -------------------------------------------
export async function POST(
  _req: NextRequest,
  { params }: { params: { claimId: string } }
) {
  try {
    const { claimId } = params
    const client = await getMongo()
    const db     = client.db(process.env.MONGODB_DB || 'claims-management')
    const bucket = new GridFSBucket(db)

    /* 1) find up to 3 PDFs that belong to this claim           */
    const pdfFiles = await db
      .collection('fs.files')
      .find({ 'metadata.claim_id': claimId })
      .limit(3)
      .toArray()

    if (!pdfFiles.length) {
      return NextResponse.json(
        { error: 'No PDF files found for this claim' },
        { status: 404 }
      )
    }

    /* 2) build multipart body with streams ------------------ */
    const form = new FormData()

    for (const file of pdfFiles) {
      const fileStream = bucket.openDownloadStream(file._id)
      form.append('files', fileStream as any, {
        filename: file.filename,
        contentType: file.metadata?.content_type || 'application/pdf'
      })
    }

    /* 3) forward to FastAPI backend ------------------------- */
    const backendUrl =
      process.env.PY_BACKEND_URL ||
      'https://hofhack-dev.up.railway.app/process-pdfs'

    console.log(`[process-route] Forwarding ${pdfFiles.length} files to ${backendUrl}`)
    
    const backendRes = await fetch(backendUrl, {
      method: 'POST',
      body: form as any,
      // node-fetch honours FormData headers via getHeaders()
      headers: form.getHeaders()
    })

    if (!backendRes.ok) {
      const txt = await backendRes.text()
      console.error(`[process-route] Backend error: ${backendRes.status} - ${txt}`)
      return NextResponse.json(
        { error: `Backend returned ${backendRes.status}: ${txt}` },
        { status: 502 }
      )
    }

    const data = await backendRes.json()
    console.log(`[process-route] Success processing claim ${claimId}`)
    return NextResponse.json({ success: true, data })
  } catch (err: any) {
    console.error('[process‑route] fatal', err)
    return NextResponse.json(
      { error: err.message || 'internal error' },
      { status: 500 }
    )
  }
} 