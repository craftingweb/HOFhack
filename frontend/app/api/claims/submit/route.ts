// app/api/claims/submit/route.ts
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { NextResponse } from "next/server";


export async function POST(req: Request) {
  try {
    const claim = await req.json();

    const requiredKeys = ["provider", "patient", "service", "claimId"];
    for (const k of requiredKeys) {
      if (!(k in claim)) {
        return NextResponse.json(
          { success: false, error: `Missing key "${k}" in request body` },
          { status: 400 },
        );
      }
    }

    const claimsDir = path.resolve("./claims");
    await mkdir(claimsDir, { recursive: true });

    const filename = `claim-${claim.claimId}.json`;
    const filepath = path.join(claimsDir, filename);
    await writeFile(filepath, JSON.stringify(claim, null, 2), "utf-8");

    return NextResponse.json({
      success: true,
      message: "Claim saved to file",
      file: filename,
    });
  } catch (err) {
    console.error("Error saving claim:", err);
    return NextResponse.json(
      { success: false, error: "Failed to save claim" },
      { status: 500 },
    );
  }
}
