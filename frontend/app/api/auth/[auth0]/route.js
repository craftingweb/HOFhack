// app/api/auth/[auth0]/route.js
import { NextResponse } from 'next/server';

// Instead of Auth0 authentication, simply redirect to the dashboard
export async function GET(request) {
  // Get the return path from the URL search parameters
  const url = new URL(request.url);
  const returnTo = url.searchParams.get('returnTo') || '/dashboard';
  
  // Create a response that redirects to the dashboard
  return NextResponse.redirect(new URL(returnTo, request.url));
}