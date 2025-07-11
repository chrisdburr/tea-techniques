import { http, HttpResponse } from 'msw'
import { mockTechniques, mockAssuranceGoals, mockTags, mockResourceTypes } from '../fixtures/techniques'
import type { Technique, TechniqueFormData } from '../../lib/types'

// For tests, use wildcard patterns to catch both full URLs and relative paths
const API_BASE_URL = '/api'

export const handlers = [
  // Techniques endpoints - use wildcard pattern to match any host, both with and without trailing slash
  http.get('*/api/techniques', ({ request }) => {
    const url = new URL(request.url)
    
    const search = url.searchParams.get('search')
    // Handle both 'assurance_goals' and 'assurance_goals[]' formats
    const assuranceGoals = url.searchParams.get('assurance_goals') || url.searchParams.get('assurance_goals[]')
    // Handle both 'tags' and 'tags[]' formats  
    const tags = url.searchParams.get('tags') || url.searchParams.get('tags[]')
    const complexityMin = url.searchParams.get('complexity_min')
    const complexityMax = url.searchParams.get('complexity_max')
    const slug = url.searchParams.get('slug')
    const page = parseInt(url.searchParams.get('page') || '1')
    const pageSize = parseInt(url.searchParams.get('page_size') || '20')

    let filteredTechniques = [...mockTechniques]

    // Apply filters
    if (search) {
      filteredTechniques = filteredTechniques.filter(t => 
        t.name.toLowerCase().includes(search.toLowerCase()) ||
        t.description.toLowerCase().includes(search.toLowerCase()) ||
        (t.acronym && t.acronym.toLowerCase().includes(search.toLowerCase()))
      )
    }

    if (assuranceGoals) {
      const goalIds = assuranceGoals.split(',').map(id => parseInt(id))
      filteredTechniques = filteredTechniques.filter(t =>
        t.assurance_goals.some(goal => goalIds.includes(goal.id))
      )
    }

    if (tags) {
      const tagIds = tags.split(',').map(id => parseInt(id))
      filteredTechniques = filteredTechniques.filter(t =>
        t.tags.some(tag => tagIds.includes(tag.id))
      )
    }

    if (complexityMin || complexityMax) {
      filteredTechniques = filteredTechniques.filter(t => {
        const min = complexityMin ? parseInt(complexityMin) : 1
        const max = complexityMax ? parseInt(complexityMax) : 5
        const rating = t.complexity_rating || 1
        return rating >= min && rating <= max
      })
    }

    if (slug) {
      filteredTechniques = filteredTechniques.filter(t => t.slug === slug)
    }

    // Pagination
    const startIndex = (page - 1) * pageSize
    const endIndex = startIndex + pageSize
    const paginatedTechniques = filteredTechniques.slice(startIndex, endIndex)

    return HttpResponse.json({
      count: filteredTechniques.length,
      next: endIndex < filteredTechniques.length ? `/api/techniques/?page=${page + 1}` : null,
      previous: page > 1 ? `/api/techniques/?page=${page - 1}` : null,
      results: paginatedTechniques
    })
  }),

  http.get('*/api/techniques/:slug', ({ params }) => {
    const { slug } = params
    const technique = mockTechniques.find(t => t.slug === slug)
    
    if (!technique) {
      return new HttpResponse(null, { status: 404 })
    }

    return HttpResponse.json(technique)
  }),

  http.post('*/api/techniques', async ({ request }) => {
    const data = await request.json() as TechniqueFormData
    
    // Simulate validation errors
    if (!data.name) {
      return HttpResponse.json(
        {
          error: true,
          message: 'Validation failed',
          details: { name: ['This field is required.'] }
        },
        { status: 400 }
      )
    }

    if (data.complexity_rating && (data.complexity_rating < 1 || data.complexity_rating > 5)) {
      return HttpResponse.json(
        {
          error: true,
          message: 'Validation failed',
          details: { complexity_rating: ['Complexity rating must be between 1 and 5.'] }
        },
        { status: 400 }
      )
    }

    // Generate slug from name if not provided
    const slug = data.slug || data.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
    
    // Extract acronym from name if present
    const acronymMatch = data.name.match(/\(([A-Z]{2,})\)/)
    const acronym = data.acronym || (acronymMatch ? acronymMatch[1] : '')

    const newTechnique = {
      slug,
      name: data.name,
      acronym,
      description: data.description || '',
      complexity_rating: data.complexity_rating || null,
      computational_cost_rating: data.computational_cost_rating || null,
      assurance_goals: data.assurance_goal_ids ? 
        mockAssuranceGoals.filter(goal => data.assurance_goal_ids.includes(goal.id)) : [],
      tags: data.tag_ids ? 
        mockTags.filter(tag => data.tag_ids.includes(tag.id)) : [],
      related_techniques: data.related_technique_slugs || [],
      resources: [],
      example_use_cases: [],
      limitations: []
    }

    return HttpResponse.json(newTechnique, { status: 201 })
  }),

  http.put('*/api/techniques/:slug', async ({ params, request }) => {
    const { slug } = params
    const data = await request.json() as Partial<TechniqueFormData>
    const technique = mockTechniques.find(t => t.slug === slug)
    
    if (!technique) {
      return new HttpResponse(null, { status: 404 })
    }

    // Update technique with new data
    const updatedTechnique = {
      ...technique,
      ...data,
      assurance_goals: data.assurance_goal_ids ? 
        mockAssuranceGoals.filter(goal => data.assurance_goal_ids.includes(goal.id)) : technique.assurance_goals,
      tags: data.tag_ids ? 
        mockTags.filter(tag => data.tag_ids.includes(tag.id)) : technique.tags,
      related_techniques: data.related_technique_slugs || technique.related_techniques,
    }

    return HttpResponse.json(updatedTechnique)
  }),

  http.patch('*/api/techniques/:slug', async ({ params, request }) => {
    const { slug } = params
    const data = await request.json() as Partial<Technique>
    const technique = mockTechniques.find(t => t.slug === slug)
    
    if (!technique) {
      return new HttpResponse(null, { status: 404 })
    }

    const updatedTechnique = { ...technique, ...data }
    return HttpResponse.json(updatedTechnique)
  }),

  http.delete('*/api/techniques/:slug', ({ params }) => {
    const { slug } = params
    const technique = mockTechniques.find(t => t.slug === slug)
    
    if (!technique) {
      return new HttpResponse(null, { status: 404 })
    }

    return new HttpResponse(null, { status: 204 })
  }),

  // Assurance Goals endpoints
  http.get('*/api/assurance-goals', () => {
    return HttpResponse.json({
      count: mockAssuranceGoals.length,
      next: null,
      previous: null,
      results: mockAssuranceGoals
    })
  }),

  http.get('*/api/assurance-goals/:id', ({ params }) => {
    const { id } = params
    const goal = mockAssuranceGoals.find(g => g.id === parseInt(id as string))
    
    if (!goal) {
      return new HttpResponse(null, { status: 404 })
    }

    return HttpResponse.json(goal)
  }),

  http.post('*/api/assurance-goals', async ({ request }) => {
    const data = await request.json() as { name: string; description?: string }
    
    if (!data.name) {
      return HttpResponse.json(
        {
          error: true,
          message: 'Validation failed',
          details: { name: ['This field is required.'] }
        },
        { status: 400 }
      )
    }

    const newGoal = {
      id: mockAssuranceGoals.length + 1,
      name: data.name,
      description: data.description || ''
    }

    return HttpResponse.json(newGoal, { status: 201 })
  }),

  // Tags endpoints
  http.get('*/api/tags', ({ request }) => {
    const url = new URL(request.url)
    const search = url.searchParams.get('search')
    
    let filteredTags = [...mockTags]
    
    if (search) {
      filteredTags = filteredTags.filter(t => 
        t.name.toLowerCase().includes(search.toLowerCase())
      )
    }

    return HttpResponse.json({
      count: filteredTags.length,
      next: null,
      previous: null,
      results: filteredTags
    })
  }),

  http.post('*/api/tags', async ({ request }) => {
    const data = await request.json() as { name: string }
    
    if (!data.name) {
      return HttpResponse.json(
        {
          error: true,
          message: 'Validation failed',
          details: { name: ['This field is required.'] }
        },
        { status: 400 }
      )
    }

    const newTag = {
      id: mockTags.length + 1,
      name: data.name
    }

    return HttpResponse.json(newTag, { status: 201 })
  }),

  // Resource Types endpoints
  http.get('*/api/resource-types', () => {
    return HttpResponse.json({
      count: mockResourceTypes.length,
      next: null,
      previous: null,
      results: mockResourceTypes
    })
  }),

  // Debug endpoints
  http.get('*/api/debug/info', () => {
    return HttpResponse.json(
      {
        error: 'Debug endpoints are not available in production',
        message: 'Debug mode is disabled'
      },
      { status: 403 }
    )
  }),

  http.get('*/api/debug/echo', () => {
    return HttpResponse.json(
      {
        error: 'Debug endpoints are not available in production',
        message: 'Debug mode is disabled'
      },
      { status: 403 }
    )
  }),

  http.post('*/api/debug/echo', () => {
    return HttpResponse.json(
      {
        error: 'Debug endpoints are not available in production',
        message: 'Debug mode is disabled'
      },
      { status: 403 }
    )
  }),

  // Auth endpoints
  http.get('*/api/auth/user', () => {
    return HttpResponse.json(
      {
        id: 1,
        username: 'testuser',
        email: 'test@example.com',
        isStaff: false
      }
    )
  }),

  http.get('*/api/auth/csrf', () => {
    return HttpResponse.json({})
  }),

  http.post('*/api/auth/login', async ({ request }) => {
    const data = await request.json() as { username: string; password: string }
    
    if (!data.username || !data.password) {
      return HttpResponse.json(
        {
          error: true,
          message: 'Invalid credentials',
          details: 'Username and password are required.'
        },
        { status: 400 }
      )
    }

    return HttpResponse.json({
      id: 1,
      username: data.username,
      email: 'test@example.com',
      isStaff: false
    })
  }),

  http.post('*/api/auth/logout', () => {
    return new HttpResponse(null, { status: 204 })
  }),

  // Error handling for unmatched routes
  http.get('*/api/*', () => {
    return HttpResponse.json(
      {
        error: true,
        message: 'Not found',
        details: 'The requested resource was not found.'
      },
      { status: 404 }
    )
  }),
]