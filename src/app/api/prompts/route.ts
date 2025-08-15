import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { 
  collection, 
  getDocs, 
  addDoc, 
  query, 
  where, 
  orderBy, 
  limit,
  startAfter,
  Timestamp,
  DocumentData
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { rateLimiters } from '@/lib/rate-limiter';
import { getServerSession } from '@/lib/auth-server';
import { logger } from '@/lib/logger';

// Input validation schemas
const createPromptSchema = z.object({
  name: z.string().min(3).max(100),
  description: z.string().min(10).max(500),
  template: z.string().min(10).max(5000),
  tags: z.array(z.string()).min(1).max(10),
  category: z.string().optional(),
  public: z.boolean().default(false),
});

const queryParamsSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  category: z.string().optional(),
  search: z.string().optional(),
  sort: z.enum(['createdAt', 'updatedAt', 'name']).default('updatedAt'),
  order: z.enum(['asc', 'desc']).default('desc'),
});

/**
 * GET /api/prompts - Retrieve paginated prompts
 * @param request - Next.js request object
 * @returns Paginated prompts list
 */
export async function GET(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    // Get session
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Rate limiting
    const rateLimitResult = await rateLimiters.api.checkLimit(session.user.uid);
    if (!rateLimitResult.allowed) {
      logger.warn('Rate limit exceeded for user', { userId: session.user.uid });
      return NextResponse.json(
        { 
          error: 'Rate limit exceeded',
          retryAfter: rateLimitResult.resetAt 
        },
        { 
          status: 429,
          headers: {
            'Retry-After': Math.ceil((rateLimitResult.resetAt.getTime() - Date.now()) / 1000).toString(),
            'X-RateLimit-Limit': '300',
            'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
            'X-RateLimit-Reset': rateLimitResult.resetAt.toISOString(),
          }
        }
      );
    }

    // Parse and validate query parameters
    const url = new URL(request.url);
    const params = Object.fromEntries(url.searchParams);
    const validatedParams = queryParamsSchema.parse(params);

    // Build Firestore query
    let q = query(
      collection(db, 'prompts'),
      where('userId', '==', session.user.uid)
    );

    // Add category filter if provided
    if (validatedParams.category) {
      q = query(q, where('category', '==', validatedParams.category));
    }

    // Add sorting
    q = query(
      q, 
      orderBy(validatedParams.sort, validatedParams.order),
      limit(validatedParams.limit)
    );

    // Execute query
    const snapshot = await getDocs(q);
    
    // Transform documents
    const prompts = snapshot.docs.map(doc => {
      const data = doc.data() as DocumentData;
      return {
        id: doc.id,
        name: data.name,
        description: data.description,
        template: data.template,
        tags: data.tags || [],
        category: data.category,
        public: data.public || false,
        createdAt: data.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
        updatedAt: data.updatedAt?.toDate?.()?.toISOString() || new Date().toISOString(),
      };
    });

    // Calculate pagination metadata
    const totalQuery = query(
      collection(db, 'prompts'),
      where('userId', '==', session.user.uid)
    );
    const totalSnapshot = await getDocs(totalQuery);
    const total = totalSnapshot.size;
    const totalPages = Math.ceil(total / validatedParams.limit);

    // Log performance
    logger.info('Prompts retrieved successfully', {
      userId: session.user.uid,
      count: prompts.length,
      duration: Date.now() - startTime,
    });

    return NextResponse.json({
      prompts,
      pagination: {
        page: validatedParams.page,
        limit: validatedParams.limit,
        total,
        totalPages,
        hasNextPage: validatedParams.page < totalPages,
        hasPrevPage: validatedParams.page > 1,
      },
    });
  } catch (error) {
    logger.error('Error fetching prompts', { error });
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: error.errors },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/prompts - Create a new prompt
 * @param request - Next.js request object
 * @returns Created prompt
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    // Get session
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Rate limiting for writes
    const rateLimitResult = await rateLimiters.write.checkLimit(session.user.uid);
    if (!rateLimitResult.allowed) {
      logger.warn('Write rate limit exceeded for user', { userId: session.user.uid });
      return NextResponse.json(
        { 
          error: 'Rate limit exceeded',
          retryAfter: rateLimitResult.resetAt 
        },
        { status: 429 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validatedData = createPromptSchema.parse(body);

    // Sanitize input (XSS prevention)
    const sanitizedData = {
      ...validatedData,
      name: validatedData.name.trim(),
      description: validatedData.description.trim(),
      template: validatedData.template.trim(),
      tags: validatedData.tags.map(tag => tag.trim().toLowerCase()),
    };

    // Create prompt document
    const promptData = {
      ...sanitizedData,
      userId: session.user.uid,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
      version: 1,
    };

    // Save to Firestore
    const docRef = await addDoc(collection(db, 'prompts'), promptData);

    // Log success
    logger.info('Prompt created successfully', {
      promptId: docRef.id,
      userId: session.user.uid,
      duration: Date.now() - startTime,
    });

    // Return created prompt
    return NextResponse.json({
      id: docRef.id,
      ...sanitizedData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }, { status: 201 });
  } catch (error) {
    logger.error('Error creating prompt', { error });
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}