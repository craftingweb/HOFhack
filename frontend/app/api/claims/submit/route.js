import { NextResponse } from "next/server";
import { Pinecone } from "@pinecone-database/pinecone";
import { v4 as uuidv4 } from "uuid";

// Jina AI for embeddings
const JINA_API_KEY = process.env.JINA_API_KEY;
const JINA_URL = "https://api.jina.ai/v1/embeddings";

/**
 * Generate an embedding for the given text using Jina AI
 */
async function getEmbedding(text) {
  try {
    const response = await fetch(JINA_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${JINA_API_KEY}`
      },
      body: JSON.stringify({
        model: "jina-clip-v2",
        input: [text],
        normalized: false
      })
    });
    
    if (!response.ok) {
      throw new Error(`Failed to generate embedding: ${response.statusText}`);
    }
    
    const data = await response.json();
    return data.data[0].embedding;
  } catch (error) {
    console.error("Error generating embedding:", error);
    throw error;
  }
}

/**
 * Store the claim details and files in Pinecone
 */
export async function POST(request) {
  try {
    // Check if we have the required environment variables
    if (!process.env.PINECONE_API_KEY) {
      return NextResponse.json(
        { 
          success: false, 
          message: "Server configuration error: Missing Pinecone API key" 
        },
        { status: 500 }
      );
    }

    if (!JINA_API_KEY) {
      return NextResponse.json(
        { 
          success: false, 
          message: "Server configuration error: Missing Jina API key" 
        },
        { status: 500 }
      );
    }

    // Parse the incoming request body
    const claimData = await request.json();
    
    // Generate a unique ID if it doesn't have one
    const claimId = claimData.claimId || `MH-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    
    // Create a text representation of the claim for embedding
    const claimText = JSON.stringify({
      claimId,
      provider: claimData.provider,
      patient: claimData.patient,
      service: claimData.service,
      status: claimData.status || "pending",
      submittedAt: claimData.submittedAt || new Date().toISOString()
    });
    
    // Generate the embedding vector for the claim
    const embedding = await getEmbedding(claimText);
    
    // Prepare metadata for Pinecone - this will be used for filtering and retrieval
    const metadata = {
      claimId,
      providerName: claimData.provider.providerName,
      patientName: claimData.patient.patientName,
      serviceDate: claimData.service.serviceDate,
      serviceType: claimData.service.serviceType,
      totalCharge: claimData.service.totalCharge,
      status: claimData.status || "pending",
      submittedAt: claimData.submittedAt || new Date().toISOString(),
      fullData: claimText // Store the full data as metadata for retrieval
    };
    
    // Initialize Pinecone client
    const pinecone = new Pinecone({
      apiKey: process.env.PINECONE_API_KEY,
    });
    
    // Connect to the index (it must already exist)
    const index = pinecone.Index("health-claims");
    
    // Upsert the claim data with its embedding to Pinecone
    await index.upsert([{
      id: claimId,
      values: embedding,
      metadata
    }]);
    
    // Return success response
    return NextResponse.json({
      success: true,
      claimId,
      message: "Claim successfully submitted and stored with vector embedding"
    });
  
  } catch (error) {
    console.error("Error submitting claim:", error);
    
    // Return error response
    return NextResponse.json(
      {
        success: false,
        message: "Failed to process claim submission",
        error: error.message
      },
      { status: 500 }
    );
  }
} 