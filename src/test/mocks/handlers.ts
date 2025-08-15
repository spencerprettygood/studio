import { http, HttpResponse } from 'msw';
import { faker } from '@faker-js/faker';

// Mock data generators
const generatePrompt = () => ({
  id: faker.string.uuid(),
  name: faker.lorem.sentence(3),
  description: faker.lorem.paragraph(),
  template: faker.lorem.paragraph(),
  tags: faker.lorem.words(3).split(' '),
  category: faker.helpers.arrayElement(['Marketing', 'Development', 'Writing', 'Analysis']),
  createdAt: faker.date.past(),
  updatedAt: faker.date.recent(),
  userId: faker.string.uuid(),
});

const generateUser = () => ({
  uid: faker.string.uuid(),
  email: faker.internet.email(),
  displayName: faker.person.fullName(),
  photoURL: faker.image.avatar(),
  emailVerified: true,
});

// API handlers
export const handlers = [
  // Auth endpoints
  http.post('/api/auth/login', async ({ request }) => {
    const body = await request.json() as any;
    
    if (body.email === 'test@example.com' && body.password === 'password123') {
      return HttpResponse.json({
        user: generateUser(),
        token: faker.string.alphanumeric(40),
      });
    }
    
    return HttpResponse.json(
      { error: 'Invalid credentials' },
      { status: 401 }
    );
  }),

  http.post('/api/auth/signup', async ({ request }) => {
    const body = await request.json() as any;
    
    if (!body.email || !body.password) {
      return HttpResponse.json(
        { error: 'Email and password required' },
        { status: 400 }
      );
    }
    
    return HttpResponse.json({
      user: generateUser(),
      token: faker.string.alphanumeric(40),
    });
  }),

  http.post('/api/auth/logout', () => {
    return HttpResponse.json({ success: true });
  }),

  // Prompts endpoints
  http.get('/api/prompts', ({ request }) => {
    const url = new URL(request.url);
    const page = Number(url.searchParams.get('page')) || 1;
    const limit = Number(url.searchParams.get('limit')) || 10;
    
    const prompts = Array.from({ length: limit }, generatePrompt);
    
    return HttpResponse.json({
      prompts,
      pagination: {
        page,
        limit,
        total: 100,
        totalPages: 10,
      },
    });
  }),

  http.get('/api/prompts/:id', ({ params }) => {
    return HttpResponse.json(generatePrompt());
  }),

  http.post('/api/prompts', async ({ request }) => {
    const body = await request.json() as any;
    
    if (!body.name || !body.template) {
      return HttpResponse.json(
        { error: 'Name and template are required' },
        { status: 400 }
      );
    }
    
    return HttpResponse.json({
      ...generatePrompt(),
      ...body,
    });
  }),

  http.put('/api/prompts/:id', async ({ params, request }) => {
    const body = await request.json() as any;
    
    return HttpResponse.json({
      ...generatePrompt(),
      ...body,
      id: params.id,
    });
  }),

  http.delete('/api/prompts/:id', ({ params }) => {
    return HttpResponse.json({ success: true });
  }),

  // AI endpoints
  http.post('/api/ai/optimize', async ({ request }) => {
    const body = await request.json() as any;
    
    if (!body.prompt) {
      return HttpResponse.json(
        { error: 'Prompt is required' },
        { status: 400 }
      );
    }
    
    return HttpResponse.json({
      original: body.prompt,
      optimized: `Enhanced: ${body.prompt}\n\nProvide clear, specific instructions...`,
      suggestions: [
        'Add more context',
        'Be more specific',
        'Include examples',
      ],
    });
  }),

  http.post('/api/ai/categorize', async ({ request }) => {
    const body = await request.json() as any;
    
    return HttpResponse.json({
      categories: [
        {
          name: 'Content Creation',
          description: 'Prompts for generating content',
          promptIds: body.promptIds?.slice(0, 5) || [],
        },
        {
          name: 'Code Generation',
          description: 'Prompts for writing code',
          promptIds: body.promptIds?.slice(5, 10) || [],
        },
      ],
    });
  }),

  // Batch operations
  http.post('/api/batch/import', async ({ request }) => {
    const body = await request.json() as any;
    
    if (!body.prompts || !Array.isArray(body.prompts)) {
      return HttpResponse.json(
        { error: 'Prompts array is required' },
        { status: 400 }
      );
    }
    
    return HttpResponse.json({
      imported: body.prompts.length,
      failed: 0,
      errors: [],
    });
  }),

  http.post('/api/batch/export', async ({ request }) => {
    const prompts = Array.from({ length: 10 }, generatePrompt);
    
    return HttpResponse.json({
      prompts,
      exportedAt: new Date().toISOString(),
    });
  }),

  // Search endpoint
  http.get('/api/search', ({ request }) => {
    const url = new URL(request.url);
    const query = url.searchParams.get('q');
    
    if (!query) {
      return HttpResponse.json(
        { error: 'Query parameter is required' },
        { status: 400 }
      );
    }
    
    const results = Array.from({ length: 5 }, generatePrompt);
    
    return HttpResponse.json({
      results,
      query,
      total: 5,
    });
  }),

  // Health check
  http.get('/api/health', () => {
    return HttpResponse.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
    });
  }),
];