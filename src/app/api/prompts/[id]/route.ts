import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { 
  doc, 
  getDoc, 
  updateDoc, 
  deleteDoc,
  Timestamp
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { rateLimiters } from '@/lib/rate-limiter';
import { getServerSession } from '@/lib/auth-server';
import { logger } from '@/lib/logger';

// Update schema
const updatePromptSchema = z.object({
  name: z.string().min(3).max(100).optional(),
  description: z.string().min(10).max(500).optional(),
  template: z.string().min(10).max(5000).optional(),
  tags: z.array(z.string()).min(1).max(10).optional(),
  category: z.string().optional(),
  public: z.boolean().optional(),
});

/**
 * GET /api/prompts/[id] - Get a single prompt
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  
  try {
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Rate limiting
    const rateLimitResult = await rateLimiters.api.checkLimit(session.user.uid);
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { error: 'Rate limit exceeded' },
        { status: 429 }
      );
    }

    // Get prompt document
    const promptRef = doc(db, 'prompts', id);
    const promptDoc = await getDoc(promptRef);

    if (!promptDoc.exists()) {
      return NextResponse.json({ error: 'Prompt not found' }, { status: 404 });
    }

    const data = promptDoc.data();

    // Check ownership
    if (data.userId !== session.user.uid && !data.public) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Return prompt
    return NextResponse.json({
      id: promptDoc.id,
      name: data.name,
      description: data.description,
      template: data.template,
      tags: data.tags || [],
      category: data.category,
      public: data.public || false,
      createdAt: data.createdAt?.toDate?.()?.toISOString(),
      updatedAt: data.updatedAt?.toDate?.()?.toISOString(),
    });
  } catch (error) {
    logger.error('Error fetching prompt', { error, promptId: id });
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/prompts/[id] - Update a prompt
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  
  try {
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Rate limiting for writes
    const rateLimitResult = await rateLimiters.write.checkLimit(session.user.uid);
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { error: 'Rate limit exceeded' },
        { status: 429 }
      );
    }

    // Parse and validate body
    const body = await request.json();
    const validatedData = updatePromptSchema.parse(body);

    // Get existing prompt
    const promptRef = doc(db, 'prompts', id);
    const promptDoc = await getDoc(promptRef);

    if (!promptDoc.exists()) {
      return NextResponse.json({ error: 'Prompt not found' }, { status: 404 });
    }

    const existingData = promptDoc.data();

    // Check ownership
    if (existingData.userId !== session.user.uid) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Sanitize input
    const sanitizedData: any = {};
    if (validatedData.name) sanitizedData.name = validatedData.name.trim();
    if (validatedData.description) sanitizedData.description = validatedData.description.trim();
    if (validatedData.template) sanitizedData.template = validatedData.template.trim();
    if (validatedData.tags) sanitizedData.tags = validatedData.tags.map(tag => tag.trim().toLowerCase());
    if (validatedData.category !== undefined) sanitizedData.category = validatedData.category;
    if (validatedData.public !== undefined) sanitizedData.public = validatedData.public;

    // Update document
    await updateDoc(promptRef, {
      ...sanitizedData,
      updatedAt: Timestamp.now(),
      version: (existingData.version || 1) + 1,
    });

    logger.info('Prompt updated', {
      promptId: id,
      userId: session.user.uid,
    });

    // Return updated prompt
    return NextResponse.json({
      id,
      ...existingData,
      ...sanitizedData,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Error updating prompt', { error, promptId: id });
    
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

/**
 * DELETE /api/prompts/[id] - Delete a prompt
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  
  try {
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Rate limiting for writes
    const rateLimitResult = await rateLimiters.write.checkLimit(session.user.uid);
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { error: 'Rate limit exceeded' },
        { status: 429 }
      );
    }

    // Get existing prompt
    const promptRef = doc(db, 'prompts', id);
    const promptDoc = await getDoc(promptRef);

    if (!promptDoc.exists()) {
      return NextResponse.json({ error: 'Prompt not found' }, { status: 404 });
    }

    const data = promptDoc.data();

    // Check ownership
    if (data.userId !== session.user.uid) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Delete document
    await deleteDoc(promptRef);

    logger.info('Prompt deleted', {
      promptId: id,
      userId: session.user.uid,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('Error deleting prompt', { error, promptId: id });
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}