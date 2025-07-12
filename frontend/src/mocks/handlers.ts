import { http, HttpResponse } from 'msw';
import { Technique } from '@/lib/types';

// This file contains comprehensive API mock handlers for MSW
// Currently MSW integration is disabled due to module resolution issues
// However, these handlers are ready to be used once those issues are resolved

// Create comprehensive mock data for all API endpoints
const mockTechniques: Technique[] = [
  {
    slug: 'test-technique-1',
    name: 'Test Technique 1',
    description: 'Description for test technique 1',
    complexity_rating: 3,
    computational_cost_rating: 2,
    example_use_cases: [
      {
        id: 101,
        description: 'Example use case',
        assurance_goal: 1,
        assurance_goal_name: 'Accuracy'
      }
    ],
    assurance_goals: [{ id: 1, name: 'Accuracy', description: 'Goal description' }],
    tags: [{ id: 1, name: 'ML' }, { id: 2, name: 'Testing' }],
    related_techniques: ['lime', 'shap'],
    resources: [{ 
      id: 201, 
      resource_type: 1,
      resource_type_name: 'Paper',
      title: 'Resource',
      url: 'https://example.com',
      description: 'Resource Description',
      publication_date: '2023-01-01'
    }],
    limitations: [{ id: 301, description: 'Limitation example' }]
  }
];

// Mock data for related entities
const mockAssuranceGoals = [
  { id: 1, name: 'Accuracy' },
  { id: 2, name: 'Fairness' },
  { id: 3, name: 'Safety' }
];


const mockTags = [
  { id: 1, name: 'ML' },
  { id: 2, name: 'Testing' },
  { id: 3, name: 'NLP' },
  { id: 4, name: 'Computer Vision' },
  { id: 5, name: 'Monitoring' },
  { id: 6, name: 'Bias Detection' }
];

const mockResourceTypes = [
  { id: 1, name: 'Paper' },
  { id: 2, name: 'Code Repository' },
  { id: 3, name: 'Documentation' }
];

// For pagination endpoints
const createPaginatedResponse = <T,>(items: T[]) => ({
  count: items.length,
  next: null,
  previous: null,
  results: items
});

export const handlers = [
  // Techniques endpoints
  http.get('/api/techniques/', () => {
    return HttpResponse.json(createPaginatedResponse(mockTechniques));
  }),

  http.get('/api/techniques/:slug', ({ params }) => {
    const { slug } = params;
    const technique = mockTechniques.find(t => t.slug === slug);
    
    if (!technique) {
      return new HttpResponse(null, { status: 404 });
    }
    
    return HttpResponse.json(technique);
  }),

  http.post('/api/techniques/', async ({ request }) => {
    const newTechnique = await request.json() as Partial<Technique>;
    const technique = {
      id: 123, // Fixed ID for tests
      ...newTechnique
    };
    
    return HttpResponse.json(technique, { status: 201 });
  }),

  http.put('/api/techniques/:slug', async ({ params, request }) => {
    const { slug } = params;
    const updatedData = await request.json() as Partial<Technique>;
    const technique = mockTechniques.find(t => t.slug === slug);
    
    if (!technique) {
      return new HttpResponse(null, { status: 404 });
    }
    
    const updatedTechnique = { ...technique, ...updatedData, id: Number(id) };
    return HttpResponse.json(updatedTechnique);
  }),

  http.delete('/api/techniques/:id', () => {
    return HttpResponse.json({ success: true });
  }),

  // Related entity endpoints
  http.get('/api/assurance-goals/', () => {
    return HttpResponse.json(createPaginatedResponse(mockAssuranceGoals));
  }),

  http.get('/api/tags/', () => {
    return HttpResponse.json(createPaginatedResponse(mockTags));
  }),

  http.get('/api/resource-types/', () => {
    return HttpResponse.json(createPaginatedResponse(mockResourceTypes));
  }),

  // Auth endpoints
  http.post('/api/auth/login/', async () => {
    return HttpResponse.json({ detail: 'Login successful' });
  }),

  http.post('/api/auth/logout/', () => {
    return HttpResponse.json({ detail: 'Logout successful' });
  }),

  http.get('/api/auth/status/', () => {
    return HttpResponse.json({ 
      is_authenticated: true,
      username: 'testuser'
    });
  })
];