import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { GET, POST } from '../prompts/route';
import { generateMockPrompt } from '@/test/test-utils';

// Mock Firebase
vi.mock('firebase/firestore', () => ({
  collection: vi.fn(),
  getDocs: vi.fn(),
  addDoc: vi.fn(),
  query: vi.fn(),
  where: vi.fn(),
  orderBy: vi.fn(),
  limit: vi.fn(),
  Timestamp: {
    now: vi.fn().mockReturnValue({
      toDate: () => new Date('2024-01-15T10:00:00Z'),
    }),
  },
}));

// Mock auth
vi.mock('@/lib/auth-server', () => ({
  getServerSession: vi.fn(),
}));

// Mock rate limiter
vi.mock('@/lib/rate-limiter', () => ({
  rateLimiters: {
    api: {
      checkLimit: vi.fn().mockResolvedValue({
        allowed: true,
        remaining: 299,
        resetAt: new Date(Date.now() + 60000),
      }),
    },
    write: {
      checkLimit: vi.fn().mockResolvedValue({
        allowed: true,
        remaining: 99,
        resetAt: new Date(Date.now() + 60000),
      }),
    },
  },
}));

describe('/api/prompts', () => {
  const mockSession = {
    user: {
      uid: 'test-user-id',
      email: 'test@example.com',
      emailVerified: true,
      displayName: 'Test User',
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /api/prompts', () => {
    it('returns unauthorized when no session', async () => {
      const { getServerSession } = await import('@/lib/auth-server');
      vi.mocked(getServerSession).mockResolvedValue(null);

      const request = new NextRequest('http://localhost:3000/api/prompts');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
    });

    it('returns rate limit error when exceeded', async () => {
      const { getServerSession } = await import('@/lib/auth-server');
      const { rateLimiters } = await import('@/lib/rate-limiter');
      
      vi.mocked(getServerSession).mockResolvedValue(mockSession);
      vi.mocked(rateLimiters.api.checkLimit).mockResolvedValue({
        allowed: false,
        remaining: 0,
        resetAt: new Date(Date.now() + 60000),
      });

      const request = new NextRequest('http://localhost:3000/api/prompts');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(429);
      expect(data.error).toBe('Rate limit exceeded');
      expect(response.headers.get('Retry-After')).toBeTruthy();
    });

    it('returns prompts with pagination', async () => {
      const { getServerSession } = await import('@/lib/auth-server');
      const { getDocs } = await import('firebase/firestore');
      
      vi.mocked(getServerSession).mockResolvedValue(mockSession);
      
      const mockPrompts = [
        generateMockPrompt(),
        generateMockPrompt(),
      ];

      vi.mocked(getDocs).mockResolvedValue({
        docs: mockPrompts.map(prompt => ({
          id: prompt.id,
          data: () => ({
            ...prompt,
            createdAt: { toDate: () => new Date(prompt.createdAt) },
            updatedAt: { toDate: () => new Date(prompt.updatedAt) },
          }),
        })),
        size: 2,
      } as any);

      const request = new NextRequest('http://localhost:3000/api/prompts?page=1&limit=10');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.prompts).toHaveLength(2);
      expect(data.pagination).toEqual({
        page: 1,
        limit: 10,
        total: 2,
        totalPages: 1,
        hasNextPage: false,
        hasPrevPage: false,
      });
    });

    it('validates query parameters', async () => {
      const { getServerSession } = await import('@/lib/auth-server');
      vi.mocked(getServerSession).mockResolvedValue(mockSession);

      const request = new NextRequest('http://localhost:3000/api/prompts?page=invalid&limit=200');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid query parameters');
    });
  });

  describe('POST /api/prompts', () => {
    const validPromptData = {
      name: 'Test Prompt',
      description: 'This is a test prompt description',
      template: 'This is a test template with {{variable}}',
      tags: ['test', 'automation'],
      category: 'Testing',
    };

    it('creates a prompt with valid data', async () => {
      const { getServerSession } = await import('@/lib/auth-server');
      const { addDoc } = await import('firebase/firestore');
      
      vi.mocked(getServerSession).mockResolvedValue(mockSession);
      vi.mocked(addDoc).mockResolvedValue({ id: 'new-prompt-id' } as any);

      const request = new NextRequest('http://localhost:3000/api/prompts', {
        method: 'POST',
        body: JSON.stringify(validPromptData),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.id).toBe('new-prompt-id');
      expect(data.name).toBe(validPromptData.name);
      expect(addDoc).toHaveBeenCalled();
    });

    it('validates required fields', async () => {
      const { getServerSession } = await import('@/lib/auth-server');
      vi.mocked(getServerSession).mockResolvedValue(mockSession);

      const invalidData = {
        name: 'ab', // Too short
        description: 'short', // Too short
        template: 'tiny', // Too short
        tags: [], // Empty array
      };

      const request = new NextRequest('http://localhost:3000/api/prompts', {
        method: 'POST',
        body: JSON.stringify(invalidData),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid input');
      expect(data.details).toBeDefined();
    });

    it('sanitizes input data', async () => {
      const { getServerSession } = await import('@/lib/auth-server');
      const { addDoc } = await import('firebase/firestore');
      
      vi.mocked(getServerSession).mockResolvedValue(mockSession);
      vi.mocked(addDoc).mockResolvedValue({ id: 'new-prompt-id' } as any);

      const dataWithWhitespace = {
        ...validPromptData,
        name: '  Test Prompt  ',
        description: '  This is a test prompt description  ',
        template: '  This is a test template  ',
        tags: ['  test  ', '  AUTOMATION  '],
      };

      const request = new NextRequest('http://localhost:3000/api/prompts', {
        method: 'POST',
        body: JSON.stringify(dataWithWhitespace),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      
      // Check that addDoc was called with sanitized data
      const addDocCall = vi.mocked(addDoc).mock.calls[0][1] as any;
      expect(addDocCall.name).toBe('Test Prompt');
      expect(addDocCall.tags).toEqual(['test', 'automation']);
    });

    it('returns unauthorized when no session', async () => {
      const { getServerSession } = await import('@/lib/auth-server');
      vi.mocked(getServerSession).mockResolvedValue(null);

      const request = new NextRequest('http://localhost:3000/api/prompts', {
        method: 'POST',
        body: JSON.stringify(validPromptData),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
    });

    it('handles Firebase errors gracefully', async () => {
      const { getServerSession } = await import('@/lib/auth-server');
      const { addDoc } = await import('firebase/firestore');
      
      vi.mocked(getServerSession).mockResolvedValue(mockSession);
      vi.mocked(addDoc).mockRejectedValue(new Error('Firebase error'));

      const request = new NextRequest('http://localhost:3000/api/prompts', {
        method: 'POST',
        body: JSON.stringify(validPromptData),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Internal server error');
    });
  });
});