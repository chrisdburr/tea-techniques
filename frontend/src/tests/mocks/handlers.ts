import { http, HttpResponse } from 'msw';

// Mock data
const mockAssuranceGoals = [
  { id: 1, name: 'Accuracy', description: 'Test goal' },
  { id: 2, name: 'Fairness', description: 'Test goal 2' },
  { id: 3, name: 'Explainability', description: 'Test goal 3' },
];

const mockTags = [
  { id: 1, name: 'applicable-models/agnostic' },
  { id: 2, name: 'data-type/tabular' },
  { id: 3, name: 'machine-learning' },
];

const mockResourceTypes = [
  { id: 1, name: 'Paper', icon: 'paper' },
  { id: 2, name: 'Website', icon: 'website' },
  { id: 3, name: 'GitHub', icon: 'github' },
];

const mockTechniques = [
  {
    id: 1,
    name: 'Test Technique',
    description: 'Test Description',
    complexity_rating: 3,
    computational_cost_rating: 2,
    assurance_goals: [mockAssuranceGoals[0]],
    tags: [mockTags[0]],
    related_techniques: [],
    resources: [],
    example_use_cases: [],
    limitations: [],
  },
  {
    id: 2,
    name: 'SHAP',
    description: 'SHapley Additive exPlanations',
    complexity_rating: 4,
    computational_cost_rating: 3,
    assurance_goals: [mockAssuranceGoals[2]],
    tags: [mockTags[0], mockTags[2]],
    related_techniques: [],
    resources: [],
    example_use_cases: [],
    limitations: [],
  },
  {
    id: 3,
    name: 'Grad-CAM',
    description: 'Gradient-weighted Class Activation Mapping',
    complexity_rating: 3,
    computational_cost_rating: 2,
    assurance_goals: [mockAssuranceGoals[2]],
    tags: [mockTags[2]],
    related_techniques: [],
    resources: [],
    example_use_cases: [],
    limitations: [],
  },
];

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export const handlers = [
  // Assurance Goals endpoints
  http.get(`${BASE_URL}/api/assurance-goals`, () => {
    return HttpResponse.json({
      count: mockAssuranceGoals.length,
      next: null,
      previous: null,
      results: mockAssuranceGoals,
    });
  }),

  http.get(`${BASE_URL}/api/assurance-goals/:id`, ({ params }) => {
    const id = parseInt(params.id as string);
    const goal = mockAssuranceGoals.find((g) => g.id === id);
    
    if (!goal) {
      return new HttpResponse(null, { status: 404 });
    }
    
    return HttpResponse.json(goal);
  }),

  http.post(`${BASE_URL}/api/assurance-goals`, async ({ request }) => {
    const newGoal = await request.json() as any;
    const createdGoal = {
      id: mockAssuranceGoals.length + 1,
      ...newGoal,
    };
    mockAssuranceGoals.push(createdGoal);
    
    return HttpResponse.json(createdGoal, { status: 201 });
  }),

  // Tags endpoints
  http.get(`${BASE_URL}/api/tags`, () => {
    return HttpResponse.json({
      count: mockTags.length,
      next: null,
      previous: null,
      results: mockTags,
    });
  }),

  http.get(`${BASE_URL}/api/tags/:id`, ({ params }) => {
    const id = parseInt(params.id as string);
    const tag = mockTags.find((t) => t.id === id);
    
    if (!tag) {
      return new HttpResponse(null, { status: 404 });
    }
    
    return HttpResponse.json(tag);
  }),

  http.post(`${BASE_URL}/api/tags`, async ({ request }) => {
    const newTag = await request.json() as any;
    const createdTag = {
      id: mockTags.length + 1,
      ...newTag,
    };
    mockTags.push(createdTag);
    
    return HttpResponse.json(createdTag, { status: 201 });
  }),

  // Resource Types endpoints
  http.get(`${BASE_URL}/api/resource-types`, () => {
    return HttpResponse.json({
      count: mockResourceTypes.length,
      next: null,
      previous: null,
      results: mockResourceTypes,
    });
  }),

  // Techniques endpoints
  http.get(`${BASE_URL}/api/techniques`, ({ request }) => {
    const url = new URL(request.url);
    const search = url.searchParams.get('search');
    const assuranceGoals = url.searchParams.get('assurance_goals');
    const tags = url.searchParams.get('tags');
    
    let filteredTechniques = [...mockTechniques];
    
    // Apply search filter
    if (search) {
      filteredTechniques = filteredTechniques.filter(
        (technique) =>
          technique.name.toLowerCase().includes(search.toLowerCase()) ||
          technique.description.toLowerCase().includes(search.toLowerCase())
      );
    }
    
    // Apply assurance goals filter
    if (assuranceGoals) {
      const goalIds = assuranceGoals.split(',').map(Number);
      filteredTechniques = filteredTechniques.filter((technique) =>
        technique.assurance_goals.some((goal) => goalIds.includes(goal.id))
      );
    }
    
    // Apply tags filter
    if (tags) {
      const tagIds = tags.split(',').map(Number);
      filteredTechniques = filteredTechniques.filter((technique) =>
        technique.tags.some((tag) => tagIds.includes(tag.id))
      );
    }
    
    return HttpResponse.json({
      count: filteredTechniques.length,
      next: null,
      previous: null,
      results: filteredTechniques,
    });
  }),

  http.get(`${BASE_URL}/api/techniques/:id`, ({ params }) => {
    const id = parseInt(params.id as string);
    const technique = mockTechniques.find((t) => t.id === id);
    
    if (!technique) {
      return new HttpResponse(null, { status: 404 });
    }
    
    return HttpResponse.json(technique);
  }),

  http.post(`${BASE_URL}/api/techniques`, async ({ request }) => {
    const newTechnique = await request.json() as any;
    const createdTechnique = {
      id: mockTechniques.length + 1,
      complexity_rating: 1,
      computational_cost_rating: 1,
      assurance_goals: [],
      tags: [],
      related_techniques: [],
      resources: [],
      example_use_cases: [],
      limitations: [],
      ...newTechnique,
    };
    
    // Handle assurance_goal_ids
    if (newTechnique.assurance_goal_ids) {
      createdTechnique.assurance_goals = mockAssuranceGoals.filter((goal) =>
        newTechnique.assurance_goal_ids.includes(goal.id)
      );
    }
    
    // Handle tag_ids
    if (newTechnique.tag_ids) {
      createdTechnique.tags = mockTags.filter((tag) =>
        newTechnique.tag_ids.includes(tag.id)
      );
    }
    
    mockTechniques.push(createdTechnique);
    
    return HttpResponse.json(createdTechnique, { status: 201 });
  }),

  http.put(`${BASE_URL}/api/techniques/:id`, async ({ params, request }) => {
    const id = parseInt(params.id as string);
    const updatedData = await request.json() as any;
    const techniqueIndex = mockTechniques.findIndex((t) => t.id === id);
    
    if (techniqueIndex === -1) {
      return new HttpResponse(null, { status: 404 });
    }
    
    const updatedTechnique = {
      ...mockTechniques[techniqueIndex],
      ...updatedData,
    };
    
    // Handle assurance_goal_ids
    if (updatedData.assurance_goal_ids) {
      updatedTechnique.assurance_goals = mockAssuranceGoals.filter((goal) =>
        updatedData.assurance_goal_ids.includes(goal.id)
      );
    }
    
    // Handle tag_ids
    if (updatedData.tag_ids) {
      updatedTechnique.tags = mockTags.filter((tag) =>
        updatedData.tag_ids.includes(tag.id)
      );
    }
    
    mockTechniques[techniqueIndex] = updatedTechnique;
    
    return HttpResponse.json(updatedTechnique);
  }),

  http.patch(`${BASE_URL}/api/techniques/:id`, async ({ params, request }) => {
    const id = parseInt(params.id as string);
    const partialData = await request.json() as any;
    const techniqueIndex = mockTechniques.findIndex((t) => t.id === id);
    
    if (techniqueIndex === -1) {
      return new HttpResponse(null, { status: 404 });
    }
    
    const updatedTechnique = {
      ...mockTechniques[techniqueIndex],
      ...partialData,
    };
    
    mockTechniques[techniqueIndex] = updatedTechnique;
    
    return HttpResponse.json(updatedTechnique);
  }),

  http.delete(`${BASE_URL}/api/techniques/:id`, ({ params }) => {
    const id = parseInt(params.id as string);
    const techniqueIndex = mockTechniques.findIndex((t) => t.id === id);
    
    if (techniqueIndex === -1) {
      return new HttpResponse(null, { status: 404 });
    }
    
    mockTechniques.splice(techniqueIndex, 1);
    
    return new HttpResponse(null, { status: 204 });
  }),

  // Auth endpoints
  http.get(`${BASE_URL}/api/auth/status`, () => {
    return HttpResponse.json({
      isAuthenticated: true,
      user: {
        id: 1,
        username: 'testuser',
        email: 'test@example.com',
      },
    });
  }),

  http.post(`${BASE_URL}/api/auth/login`, async ({ request }) => {
    const credentials = await request.json() as any;
    
    // Mock successful login
    if (credentials.username === 'testuser' && credentials.password === 'testpass') {
      return HttpResponse.json({
        id: 1,
        username: 'testuser',
        email: 'test@example.com',
      });
    }
    
    return HttpResponse.json(
      { detail: 'Invalid credentials' },
      { status: 401 }
    );
  }),

  http.post(`${BASE_URL}/api/auth/logout`, () => {
    return HttpResponse.json({ detail: 'Successfully logged out' });
  }),

  // API root
  http.get(`${BASE_URL}/api/`, () => {
    return HttpResponse.json({
      techniques: `${BASE_URL}/api/techniques/`,
      assurance_goals: `${BASE_URL}/api/assurance-goals/`,
      tags: `${BASE_URL}/api/tags/`,
      resource_types: `${BASE_URL}/api/resource-types/`,
    });
  }),

  // Error handling examples
  http.get(`${BASE_URL}/api/error/500`, () => {
    return HttpResponse.json(
      { detail: 'Internal server error' },
      { status: 500 }
    );
  }),

  http.get(`${BASE_URL}/api/error/validation`, () => {
    return HttpResponse.json(
      {
        name: ['This field is required'],
        description: ['This field is required'],
      },
      { status: 400 }
    );
  }),
];