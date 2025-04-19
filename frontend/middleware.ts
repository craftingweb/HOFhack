import { NextResponse, type NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  // This middleware allows unrestricted access to all routes
  // You could add some basic protection here later if needed
  
  // Just pass through all requests
  return NextResponse.next();
}

export const config = {
  matcher: [
    // Add routes that you might want to protect in the future
    "/dashboard/:path*",
    "/settings/:path*",
  ],
}; 