import { randomBytes, createHash } from 'crypto';
import { cookies } from 'next/headers';
import { NextRequest } from 'next/server';

const CSRF_TOKEN_LENGTH = 32;
const CSRF_COOKIE_NAME = 'csrf-token';
const CSRF_HEADER_NAME = 'x-csrf-token';

/**
 * Generate a cryptographically secure CSRF token
 */
export function generateCSRFToken(): string {
  return randomBytes(CSRF_TOKEN_LENGTH).toString('hex');
}

/**
 * Create a hash of the CSRF token for secure storage
 */
function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

/**
 * Set CSRF token in HTTP-only cookie
 */
export async function setCSRFToken(): Promise<string> {
  const token = generateCSRFToken();
  const hashedToken = hashToken(token);
  
  const cookieStore = await cookies();
  cookieStore.set(CSRF_COOKIE_NAME, hashedToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 60 * 60 * 24, // 24 hours
    path: '/',
  });
  
  return token;
}

/**
 * Verify CSRF token from request
 */
export async function verifyCSRFToken(request: NextRequest): Promise<boolean> {
  try {
    const cookieStore = await cookies();
    const storedHashedToken = cookieStore.get(CSRF_COOKIE_NAME)?.value;
    
    if (!storedHashedToken) {
      return false;
    }
    
    // Get token from header or body
    const headerToken = request.headers.get(CSRF_HEADER_NAME);
    let bodyToken: string | undefined;
    
    // For POST requests, try to get token from body
    if (request.method === 'POST') {
      try {
        const clonedRequest = request.clone();
        const body = await clonedRequest.json();
        bodyToken = body.csrfToken;
      } catch {
        // Not JSON or no token in body
      }
    }
    
    const submittedToken = headerToken || bodyToken;
    
    if (!submittedToken) {
      return false;
    }
    
    // Hash the submitted token and compare
    const hashedSubmittedToken = hashToken(submittedToken);
    
    return hashedSubmittedToken === storedHashedToken;
  } catch (error) {
    console.error('CSRF verification error:', error);
    return false;
  }
}

/**
 * Middleware to protect against CSRF attacks
 */
export function createCSRFMiddleware() {
  return async (request: NextRequest) => {
    // Skip CSRF protection for GET, HEAD, OPTIONS
    if (['GET', 'HEAD', 'OPTIONS'].includes(request.method)) {
      return null;
    }
    
    // Skip for API routes that don't modify state
    if (request.nextUrl.pathname.startsWith('/api/health')) {
      return null;
    }
    
    const isValid = await verifyCSRFToken(request);
    
    if (!isValid) {
      return new Response(
        JSON.stringify({ error: 'Invalid CSRF token' }),
        {
          status: 403,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }
    
    return null;
  };
}

/**
 * Get CSRF token for client-side use
 */
export async function getCSRFTokenForClient(): Promise<string | null> {
  try {
    const response = await fetch('/api/csrf-token');
    const data = await response.json();
    return data.token;
  } catch {
    return null;
  }
}