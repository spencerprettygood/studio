import { cookies } from 'next/headers';
import { auth } from '@/lib/firebase-admin';
import { logger } from '@/lib/logger';

export interface Session {
  user: {
    uid: string;
    email: string | null;
    emailVerified: boolean;
    displayName: string | null;
  };
}

/**
 * Get the current user session from cookies
 * @returns Session object or null if not authenticated
 */
export async function getServerSession(): Promise<Session | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('session')?.value;
    
    if (!token) {
      return null;
    }

    // Verify the token with Firebase Admin
    const decodedToken = await auth.verifyIdToken(token);
    
    return {
      user: {
        uid: decodedToken.uid,
        email: decodedToken.email || null,
        emailVerified: decodedToken.email_verified || false,
        displayName: decodedToken.name || null,
      },
    };
  } catch (error) {
    logger.error('Failed to verify session token', { error });
    return null;
  }
}

/**
 * Create a session cookie for the user
 * @param idToken - Firebase ID token
 * @returns Success boolean
 */
export async function createSessionCookie(idToken: string): Promise<boolean> {
  try {
    // Create session cookie that expires in 5 days
    const expiresIn = 60 * 60 * 24 * 5 * 1000;
    const sessionCookie = await auth.createSessionCookie(idToken, { expiresIn });
    
    const cookieStore = await cookies();
    cookieStore.set('session', sessionCookie, {
      maxAge: expiresIn,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
    });
    
    return true;
  } catch (error) {
    logger.error('Failed to create session cookie', { error });
    return false;
  }
}

/**
 * Clear the session cookie
 */
export async function clearSessionCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete('session');
}