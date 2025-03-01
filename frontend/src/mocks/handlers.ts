import { http, HttpResponse } from 'msw';
import { Technique } from '@/lib/api/useTechniques';

// Mock technique data
const mockTechniques: Technique[] = [
  {
    id: 1,
    name: 'Test Technique 1',
    description: 'Description for test technique 1',
    model_dependency: 'Agnostic',
    example_use_case: 'Example use case for technique 1'
  },
  {
    id: 2,
    name: 'Test Technique 2',
    description: 'Description for test technique 2',
    model_dependency: 'Specific',
    example_use_case: 'Example use case for technique 2'
  }
];

export const handlers = [
  // GET /api/techniques/
  http.get('/api/techniques/', () => {
    return HttpResponse.json(mockTechniques);
  }),

  // GET /api/techniques/:id
  http.get('/api/techniques/:id', ({ params }) => {
    const { id } = params;
    const technique = mockTechniques.find(t => t.id === Number(id));
    
    if (!technique) {
      return new HttpResponse(null, { status: 404 });
    }
    
    return HttpResponse.json(technique);
  }),

  // POST /api/techniques/
  http.post('/api/techniques/', async ({ request }) => {
    const newTechnique = await request.json();
    const technique = {
      id: mockTechniques.length + 1,
      ...newTechnique
    };
    
    return HttpResponse.json(technique, { status: 201 });
  }),

  // PUT /api/techniques/:id
  http.put('/api/techniques/:id', async ({ params, request }) => {
    const { id } = params;
    const updatedData = await request.json();
    const technique = mockTechniques.find(t => t.id === Number(id));
    
    if (!technique) {
      return new HttpResponse(null, { status: 404 });
    }
    
    const updatedTechnique = { ...technique, ...updatedData };
    return HttpResponse.json(updatedTechnique);
  })
];