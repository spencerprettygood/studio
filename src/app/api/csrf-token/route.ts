import { NextRequest, NextResponse } from 'next/server';
import { setCSRFToken } from '@/lib/csrf';
import { rateLimiters } from '@/lib/rate-limiter';

/**
 * GET /api/csrf-token - Generate and return CSRF token
 */
export async function GET(request: NextRequest) {
  try {
    // Rate limit CSRF token requests
    const clientIP = request.headers.get('x-forwarded-for') || 
                    request.headers.get('x-real-ip') || 
                    'unknown';
    
    const rateLimitResult = await rateLimiters.api.checkLimit(clientIP);
    
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { error: 'Rate limit exceeded' },
        { status: 429 }
      );
    }
    
    // Generate CSRF token
    const token = await setCSRFToken();
    
    return NextResponse.json({ token });
  } catch (error) {
    console.error('Error generating CSRF token:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}