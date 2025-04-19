#!/usr/bin/env node

// This script uploads the patient PDF files to MongoDB GridFS
// and associates them with a claim.

const fs = require('fs');
const path = require('path');
const { MongoClient, ObjectId, GridFSBucket } = require('mongodb');
require('dotenv').config({ path: path.resolve(__dirname, '../.env.local') });

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const DB_NAME = process.env.MONGODB_DB || 'claims-management';

// File paths
const pdfFiles = [
  '/Users/wesleylu/Desktop/hofhack/backend/Patient 1 - OCD Inpatient Request.pdf',
  '/Users/wesleylu/Desktop/hofhack/backend/Patient 2 - Anxiety Treatment Request.pdf',
  '/Users/wesleylu/Desktop/hofhack/backend/Patient 3 - Medication Prescription Request (1).pdf'
];

// Get claim ID from command line args or use a default
const claimId = process.argv[2] || '6803989cb5170ea2ce83b047'; // Updated default claim ID
const claimIdField = process.argv[3] || 'MH-2023-TEST1'; // Added support for claimId field

async function uploadFiles() {
  console.log(`Connecting to MongoDB at ${MONGODB_URI}...`);
  
  // Connect to MongoDB
  const client = new MongoClient(MONGODB_URI, {
    maxPoolSize: 5,
    serverSelectionTimeoutMS: 30000
  });
  
  try {
    await client.connect();
    console.log('Connected to MongoDB successfully');
    
    const db = client.db(DB_NAME);
    const bucket = new GridFSBucket(db);
    
    // Check if claim exists
    const claimsCollection = db.collection('claims');
    let claim;
    
    try {
      // Try with ObjectId
      claim = await claimsCollection.findOne({ _id: new ObjectId(claimId) });
    } catch (e) {
      // Try with string ID
      claim = await claimsCollection.findOne({ _id: claimId });
    }
    
    if (!claim) {
      // Try with claimId field
      claim = await claimsCollection.findOne({ claimId: claimIdField });
      console.log(`Looking for claim with claimId: ${claimIdField}`);
    }
    
    if (!claim) {
      console.error(`No claim found with ID: ${claimId} or claimId: ${claimIdField}`);
      return;
    }
    
    console.log(`Found claim: ${claim._id} (claimId: ${claim.claimId || 'N/A'})`);
    const fileIds = [];
    
    // Upload each file
    for (const filePath of pdfFiles) {
      const filename = path.basename(filePath);
      console.log(`Uploading ${filename}...`);
      
      // Read file
      const fileStream = fs.createReadStream(filePath);
      
      // Create metadata
      const metadata = {
        filename,
        content_type: 'application/pdf',
        claim_id: claim._id.toString(),
        uploaded_at: new Date()
      };
      
      // Upload to GridFS
      const uploadStream = bucket.openUploadStream(filename, {
        metadata
      });
      
      // Pipe file data to upload stream
      await new Promise((resolve, reject) => {
        fileStream.pipe(uploadStream)
          .on('finish', () => {
            console.log(`Uploaded ${filename} with ID: ${uploadStream.id}`);
            fileIds.push(uploadStream.id.toString());
            resolve();
          })
          .on('error', (error) => {
            console.error(`Error uploading ${filename}: ${error.message}`);
            reject(error);
          });
      });
    }
    
    // Update claim with file IDs
    if (fileIds.length > 0) {
      console.log(`Updating claim with ${fileIds.length} file IDs`);
      
      let updateResult;
      
      if (typeof claim._id === 'object' && claim._id instanceof ObjectId) {
        updateResult = await claimsCollection.updateOne(
          { _id: claim._id },
          { $push: { 'service.uploadedFiles': { $each: fileIds } } }
        );
      } else {
        updateResult = await claimsCollection.updateOne(
          { claimId: claim.claimId },
          { $push: { 'service.uploadedFiles': { $each: fileIds } } }
        );
      }
      
      console.log(`Updated claim. Modified: ${updateResult.modifiedCount}`);
    }
    
    console.log('All files uploaded successfully!');
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.close();
    console.log('MongoDB connection closed');
  }
}

// Run the upload
uploadFiles().catch(console.error); 