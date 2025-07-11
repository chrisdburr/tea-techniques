import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { http, HttpResponse } from 'msw'
import { server } from '../../mocks/server'
import { useTechniques, useTechniqueDetail } from '../../../lib/api/hooks'
import { mockTechniques } from '../../fixtures/techniques'
import type { Technique } from '../../../lib/types'

// Create wrapper for React Query
const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
    },
  })

  const TestWrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  )
  
  TestWrapper.displayName = 'TestWrapper'
  
  return TestWrapper
}

describe('useTechniques Hook', () => {
  describe('Basic Data Fetching', () => {
    it('fetches techniques successfully', async () => {
      const { result } = renderHook(() => useTechniques(), {
        wrapper: createWrapper(),
      })

      // Initially loading
      expect(result.current.isLoading).toBe(true)
      expect(result.current.data).toBeUndefined()

      // Wait for data to load
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.data).toBeDefined()
      expect(result.current.data?.results).toHaveLength(mockTechniques.length)
      expect(result.current.error).toBeNull()
    })

    it('handles empty response', async () => {
      // Override handler for empty response
      server.use(
        http.get('*/api/techniques', () => {
          return HttpResponse.json({
            count: 0,
            next: null,
            previous: null,
            results: []
          })
        })
      )

      const { result } = renderHook(() => useTechniques(), {
        wrapper: createWrapper(),
      })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.data?.results).toHaveLength(0)
      expect(result.current.data?.count).toBe(0)
    })

    it('handles API errors gracefully', async () => {
      // Override handler to return error
      server.use(
        http.get('*/api/techniques', () => {
          return new HttpResponse(null, { status: 500 })
        })
      )

      const { result } = renderHook(() => useTechniques(), {
        wrapper: createWrapper(),
      })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.error).toBeTruthy()
      expect(result.current.data).toBeUndefined()
    })
  })

  describe('Search and Filtering', () => {
    it('applies search filters correctly', async () => {
      const searchTerm = 'SHAP'
      
      const { result } = renderHook(() => useTechniques({ search: searchTerm }), {
        wrapper: createWrapper(),
      })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      // Should return filtered results
      expect(result.current.data?.results).toBeDefined()
      expect(result.current.data?.results.some(t => 
        t.name.includes('SHAP') || t.acronym?.includes('SHAP')
      )).toBe(true)
    })

    it('applies assurance goal filters', async () => {
      const goalId = 1 // Explainability
      
      const { result } = renderHook(() => useTechniques({ assurance_goals: [goalId] }), {
        wrapper: createWrapper(),
      })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      // Should return techniques with specified goal
      expect(result.current.data?.results.every(t => 
        t.assurance_goals.some(g => g.id === goalId)
      )).toBe(true)
    })

    it('applies tag filters', async () => {
      const tagId = 1 // model-agnostic
      
      const { result } = renderHook(() => useTechniques({ tags: [tagId] }), {
        wrapper: createWrapper(),
      })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      // Should return techniques with specified tag
      expect(result.current.data?.results.every(t => 
        t.tags.some(tag => tag.id === tagId)
      )).toBe(true)
    })

    it('applies complexity rating filters', async () => {
      const complexityRating = 3
      
      const { result } = renderHook(() => useTechniques({ complexity_min: complexityRating.toString(), complexity_max: complexityRating.toString() }), {
        wrapper: createWrapper(),
      })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      // Should return techniques with specified complexity
      expect(result.current.data?.results.every(t => 
        t.complexity_rating === complexityRating
      )).toBe(true)
    })

    it('combines multiple filters correctly', async () => {
      const filters = {
        search: 'interpretable',
        complexity_rating: 2,
        assurance_goals: [1] // Explainability
      }
      
      const { result } = renderHook(() => useTechniques(filters), {
        wrapper: createWrapper(),
      })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      // Should apply all filters
      expect(result.current.data?.results).toBeDefined()
    })
  })

  describe('Pagination', () => {
    it('handles pagination parameters', async () => {
      const { result } = renderHook(() => useTechniques({ page: 2, page_size: 10 }), {
        wrapper: createWrapper(),
      })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.data?.results).toBeDefined()
    })

    it('provides pagination metadata', async () => {
      const { result } = renderHook(() => useTechniques(), {
        wrapper: createWrapper(),
      })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.data?.count).toBeDefined()
      expect(result.current.data?.next).toBeDefined()
      expect(result.current.data?.previous).toBeDefined()
    })
  })

  describe('Caching and Performance', () => {
    it('caches results for identical queries', async () => {
      const wrapper = createWrapper()
      
      // First render
      const { result: result1 } = renderHook(() => useTechniques(), { wrapper })
      
      await waitFor(() => {
        expect(result1.current.isLoading).toBe(false)
      })

      // Second render with same parameters should use cache
      const { result: result2 } = renderHook(() => useTechniques(), { wrapper })
      
      // Should immediately have data from cache
      expect(result2.current.data).toBeDefined()
      expect(result2.current.isLoading).toBe(false)
    })

    it('invalidates cache for different query parameters', async () => {
      const wrapper = createWrapper()
      
      // First query
      const { result: result1 } = renderHook(() => useTechniques({ search: 'SHAP' }), { wrapper })
      
      await waitFor(() => {
        expect(result1.current.isLoading).toBe(false)
      })

      // Different query should trigger new fetch
      const { result: result2 } = renderHook(() => useTechniques({ search: 'LIME' }), { wrapper })
      
      expect(result2.current.isLoading).toBe(true)
    })
  })
})

describe('useTechniqueDetail Hook', () => {
  const techniqueSlug = mockTechniques[0].slug

  describe('Basic Data Fetching', () => {
    it('fetches technique detail successfully', async () => {
      const { result } = renderHook(() => useTechniqueDetail(techniqueSlug), {
        wrapper: createWrapper(),
      })

      // Initially loading
      expect(result.current.isLoading).toBe(true)
      expect(result.current.data).toBeUndefined()

      // Wait for data to load
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.data).toBeDefined()
      expect(result.current.data?.slug).toBe(techniqueSlug)
      expect(result.current.error).toBeNull()
    })

    it('handles 404 errors for non-existent techniques', async () => {
      const nonExistentSlug = 'non-existent-technique'
      
      const { result } = renderHook(() => useTechniqueDetail(nonExistentSlug), {
        wrapper: createWrapper(),
      })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.error).toBeTruthy()
      expect(result.current.data).toBeUndefined()
    })

    it('does not fetch when slug is empty or undefined', () => {
      const { result } = renderHook(() => useTechniqueDetail(''), {
        wrapper: createWrapper(),
      })

      // Should not initiate fetch
      expect(result.current.isLoading).toBe(false)
      expect(result.current.data).toBeUndefined()
      expect(result.current.error).toBeNull()
    })
  })

  describe('Data Structure Validation', () => {
    it('returns technique with all expected fields', async () => {
      const { result } = renderHook(() => useTechniqueDetail(techniqueSlug), {
        wrapper: createWrapper(),
      })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      const technique = result.current.data as Technique
      
      // Validate structure matches new schema
      expect(technique.slug).toBeDefined()
      expect(technique.name).toBeDefined()
      expect(technique.acronym).toBeDefined()
      expect(technique.description).toBeDefined()
      expect(technique.complexity_rating).toBeDefined()
      expect(technique.computational_cost_rating).toBeDefined()
      expect(technique.assurance_goals).toBeInstanceOf(Array)
      expect(technique.tags).toBeInstanceOf(Array)
      expect(technique.related_techniques).toBeInstanceOf(Array)
      expect(technique.resources).toBeInstanceOf(Array)
      expect(technique.example_use_cases).toBeInstanceOf(Array)
      expect(technique.limitations).toBeInstanceOf(Array)
    })

    it('handles techniques with minimal data', async () => {
      // Mock minimal technique response
      server.use(
        http.get('*/api/techniques/minimal/', () => {
          return HttpResponse.json({
            slug: 'minimal',
            name: 'Minimal Technique',
            acronym: '',
            description: 'Basic description',
            complexity_rating: 1,
            computational_cost_rating: 1,
            assurance_goals: [],
            tags: [],
            related_techniques: [],
            resources: [],
            example_use_cases: [],
            limitations: []
          })
        })
      )

      const { result } = renderHook(() => useTechniqueDetail('minimal'), {
        wrapper: createWrapper(),
      })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.data).toBeDefined()
      expect(result.current.data?.name).toBe('Minimal Technique')
    })
  })

  describe('Related Techniques', () => {
    it('fetches related techniques using slugs', async () => {
      const { result } = renderHook(() => useTechniqueDetail(techniqueSlug), {
        wrapper: createWrapper(),
      })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      const technique = result.current.data as Technique
      
      // Related techniques should be an array of slugs
      if (technique.related_techniques.length > 0) {
        expect(technique.related_techniques.every(rt => typeof rt === 'string')).toBe(true)
      }
    })
  })

  describe('Error Handling', () => {
    it('handles network errors gracefully', async () => {
      // Mock network error
      server.use(
        http.get(`*/api/techniques/${techniqueSlug}`, () => {
          return new HttpResponse(null, { status: 500 })
        })
      )

      const { result } = renderHook(() => useTechniqueDetail(techniqueSlug), {
        wrapper: createWrapper(),
      })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.error).toBeTruthy()
      expect(result.current.data).toBeUndefined()
    })

    it('retries failed requests according to configuration', async () => {
      let requestCount = 0
      
      // Create a custom wrapper with retries enabled
      const createRetryWrapper = () => {
        const queryClient = new QueryClient({
          defaultOptions: {
            queries: {
              retry: 2, // Enable retries
              retryDelay: 0, // No delay for tests
              gcTime: 0,
            },
          },
        })

        const TestWrapper = ({ children }: { children: React.ReactNode }) => (
          <QueryClientProvider client={queryClient}>
            {children}
          </QueryClientProvider>
        )
        
        TestWrapper.displayName = 'TestWrapper'
        return TestWrapper
      }
      
      server.use(
        http.get(`*/api/techniques/${techniqueSlug}`, () => {
          requestCount++
          if (requestCount < 2) {
            return HttpResponse.error()
          }
          return HttpResponse.json(mockTechniques[0])
        })
      )

      const { result } = renderHook(() => useTechniqueDetail(techniqueSlug), {
        wrapper: createRetryWrapper(),
      })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      // Should eventually succeed after retry
      expect(result.current.data).toBeDefined()
      expect(requestCount).toBeGreaterThan(1)
    })
  })

  describe('Caching Behavior', () => {
    it('caches technique details', async () => {
      const wrapper = createWrapper()
      
      // First render
      const { result: result1 } = renderHook(() => useTechniqueDetail(techniqueSlug), { wrapper })
      
      await waitFor(() => {
        expect(result1.current.isLoading).toBe(false)
      })

      // Second render should use cache
      const { result: result2 } = renderHook(() => useTechniqueDetail(techniqueSlug), { wrapper })
      
      expect(result2.current.data).toBeDefined()
      expect(result2.current.isLoading).toBe(false)
    })

    it('maintains separate cache entries for different techniques', async () => {
      const wrapper = createWrapper()
      const slug1 = mockTechniques[0].slug
      const slug2 = mockTechniques[1].slug
      
      // Fetch first technique
      const { result: result1 } = renderHook(() => useTechniqueDetail(slug1), { wrapper })
      
      await waitFor(() => {
        expect(result1.current.isLoading).toBe(false)
      })

      // Fetch second technique
      const { result: result2 } = renderHook(() => useTechniqueDetail(slug2), { wrapper })
      
      await waitFor(() => {
        expect(result2.current.isLoading).toBe(false)
      })

      // Both should have different data
      expect(result1.current.data?.slug).toBe(slug1)
      expect(result2.current.data?.slug).toBe(slug2)
      expect(result1.current.data?.slug).not.toBe(result2.current.data?.slug)
    })
  })
})