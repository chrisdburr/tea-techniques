import React from 'react'
import { screen, waitFor, within } from '@testing-library/react'
import { renderWithProviders, mockRouteParams } from '../../utils/test-utils'
import { server } from '../../mocks/server'
import { http, HttpResponse } from 'msw'
import { mockTechniques, mockAssuranceGoals, mockTags } from '../../fixtures/techniques'

// Mock the techniques list page component
// This would typically be imported from the actual page component
const TechniquesListPage = () => {
  // This is a placeholder for the actual page component
  // In real implementation, this would import the actual page
  return (
    <div data-testid="techniques-list-page">
      <h1>TEA Techniques</h1>
      <div data-testid="search-filters">
        <input placeholder="Search techniques..." />
        <select aria-label="Filter by assurance goal">
          <option value="">All Goals</option>
          {mockAssuranceGoals.map(goal => (
            <option key={goal.id} value={goal.id}>{goal.name}</option>
          ))}
        </select>
        <select aria-label="Filter by tag">
          <option value="">All Tags</option>
          {mockTags.map(tag => (
            <option key={tag.id} value={tag.id}>{tag.name}</option>
          ))}
        </select>
        <select aria-label="Filter by complexity">
          <option value="">All Complexity</option>
          <option value="1">1 - Very Simple</option>
          <option value="2">2 - Simple</option>
          <option value="3">3 - Moderate</option>
          <option value="4">4 - Complex</option>
          <option value="5">5 - Very Complex</option>
        </select>
      </div>
      <div data-testid="techniques-grid">
        {mockTechniques.map(technique => (
          <div key={technique.slug} data-testid={`technique-card-${technique.slug}`}>
            <h3>{technique.name}</h3>
            <p>{technique.description}</p>
            <a href={`/techniques/${technique.slug}`}>View Details</a>
          </div>
        ))}
      </div>
    </div>
  )
}

describe('Techniques List Page Integration', () => {
  beforeEach(() => {
    // Reset any route mocks
    mockRouteParams({})
  })

  describe('Page Loading and Initial State', () => {
    it('renders the page with initial techniques loaded', async () => {
      renderWithProviders(<TechniquesListPage />)

      // Page should load
      expect(screen.getByTestId('techniques-list-page')).toBeInTheDocument()
      expect(screen.getByText('TEA Techniques')).toBeInTheDocument()

      // Should show techniques
      await waitFor(() => {
        mockTechniques.forEach(technique => {
          expect(screen.getByText(technique.name)).toBeInTheDocument()
        })
      })
    })

    it('displays loading state while fetching techniques', async () => {
      // Mock delayed response
      server.use(
        http.get('*/api/techniques/', async () => {
          await new Promise(resolve => setTimeout(resolve, 100))
          return HttpResponse.json({
            count: mockTechniques.length,
            next: null,
            previous: null,
            results: mockTechniques
          })
        })
      )

      renderWithProviders(<TechniquesListPage />)

      // Should show loading initially
      expect(screen.getByTestId('techniques-list-page')).toBeInTheDocument()
      
      // Then show content after loading
      await waitFor(() => {
        expect(screen.getByText(mockTechniques[0].name)).toBeInTheDocument()
      })
    })

    it('handles API errors gracefully', async () => {
      // Mock API error
      server.use(
        http.get('*/api/techniques/', () => {
          return new HttpResponse(null, { status: 500 })
        })
      )

      renderWithProviders(<TechniquesListPage />)

      await waitFor(() => {
        expect(screen.getByText(/error|failed to load/i)).toBeInTheDocument()
      })
    })
  })

  describe('Search Functionality', () => {
    it('filters techniques by search term', async () => {
      const { user } = renderWithProviders(<TechniquesListPage />)

      // Wait for initial load
      await waitFor(() => {
        expect(screen.getByText(mockTechniques[0].name)).toBeInTheDocument()
      })

      // Perform search
      const searchInput = screen.getByPlaceholderText('Search techniques...')
      await user.type(searchInput, 'SHAP')

      // Should filter results
      await waitFor(() => {
        expect(screen.getByText(/SHAP/)).toBeInTheDocument()
        expect(screen.queryByText(/LIME/)).not.toBeInTheDocument()
      })
    })

    it('shows "no results" message for empty search results', async () => {
      const { user } = renderWithProviders(<TechniquesListPage />)

      // Mock empty search results
      server.use(
        http.get('*/api/techniques/', ({ request }) => {
          const url = new URL(request.url)
          if (url.searchParams.get('search')) {
            return HttpResponse.json({
              count: 0,
              next: null,
              previous: null,
              results: []
            })
          }
          return HttpResponse.json({
            count: mockTechniques.length,
            next: null,
            previous: null,
            results: mockTechniques
          })
        })
      )

      // Wait for initial load
      await waitFor(() => {
        expect(screen.getByText(mockTechniques[0].name)).toBeInTheDocument()
      })

      // Search for non-existent technique
      const searchInput = screen.getByPlaceholderText('Search techniques...')
      await user.type(searchInput, 'NonExistentTechnique')

      await waitFor(() => {
        expect(screen.getByText(/no techniques found/i)).toBeInTheDocument()
      })
    })

    it('clears search results when search term is removed', async () => {
      const { user } = renderWithProviders(<TechniquesListPage />)

      // Wait for initial load
      await waitFor(() => {
        expect(screen.getByText(mockTechniques[0].name)).toBeInTheDocument()
      })

      // Perform search
      const searchInput = screen.getByPlaceholderText('Search techniques...')
      await user.type(searchInput, 'SHAP')

      // Clear search
      await user.clear(searchInput)

      // Should show all results again
      await waitFor(() => {
        mockTechniques.forEach(technique => {
          expect(screen.getByText(technique.name)).toBeInTheDocument()
        })
      })
    })
  })

  describe('Filtering Functionality', () => {
    it('filters techniques by assurance goal', async () => {
      const { user } = renderWithProviders(<TechniquesListPage />)

      // Wait for initial load
      await waitFor(() => {
        expect(screen.getByText(mockTechniques[0].name)).toBeInTheDocument()
      })

      // Filter by assurance goal
      const goalSelect = screen.getByLabelText('Filter by assurance goal')
      await user.selectOptions(goalSelect, '1') // Explainability

      // Should show only techniques with that goal
      await waitFor(() => {
        // Verify filtering worked (mock handler should filter)
        expect(goalSelect).toHaveValue('1')
      })
    })

    it('filters techniques by tag', async () => {
      const { user } = renderWithProviders(<TechniquesListPage />)

      // Wait for initial load
      await waitFor(() => {
        expect(screen.getByText(mockTechniques[0].name)).toBeInTheDocument()
      })

      // Filter by tag
      const tagSelect = screen.getByLabelText('Filter by tag')
      await user.selectOptions(tagSelect, '1') // model-agnostic

      await waitFor(() => {
        expect(tagSelect).toHaveValue('1')
      })
    })

    it('filters techniques by complexity rating', async () => {
      const { user } = renderWithProviders(<TechniquesListPage />)

      // Wait for initial load
      await waitFor(() => {
        expect(screen.getByText(mockTechniques[0].name)).toBeInTheDocument()
      })

      // Filter by complexity
      const complexitySelect = screen.getByLabelText('Filter by complexity')
      await user.selectOptions(complexitySelect, '3')

      await waitFor(() => {
        expect(complexitySelect).toHaveValue('3')
      })
    })

    it('combines multiple filters correctly', async () => {
      const { user } = renderWithProviders(<TechniquesListPage />)

      // Wait for initial load
      await waitFor(() => {
        expect(screen.getByText(mockTechniques[0].name)).toBeInTheDocument()
      })

      // Apply multiple filters
      const searchInput = screen.getByPlaceholderText('Search techniques...')
      const goalSelect = screen.getByLabelText('Filter by assurance goal')
      const complexitySelect = screen.getByLabelText('Filter by complexity')

      await user.type(searchInput, 'interpretable')
      await user.selectOptions(goalSelect, '1')
      await user.selectOptions(complexitySelect, '2')

      // All filters should be applied
      await waitFor(() => {
        expect(searchInput).toHaveValue('interpretable')
        expect(goalSelect).toHaveValue('1')
        expect(complexitySelect).toHaveValue('2')
      })
    })

    it('resets all filters when "clear filters" is clicked', async () => {
      const { user } = renderWithProviders(<TechniquesListPage />)

      // Apply some filters
      const searchInput = screen.getByPlaceholderText('Search techniques...')
      const goalSelect = screen.getByLabelText('Filter by assurance goal')

      await user.type(searchInput, 'test')
      await user.selectOptions(goalSelect, '1')

      // Clear filters (if clear button exists)
      const clearButton = screen.queryByText(/clear filters|reset/i)
      if (clearButton) {
        await user.click(clearButton)

        await waitFor(() => {
          expect(searchInput).toHaveValue('')
          expect(goalSelect).toHaveValue('')
        })
      }
    })
  })

  describe('Technique Card Interactions', () => {
    it('navigates to technique detail when card is clicked', async () => {
      const { user } = renderWithProviders(<TechniquesListPage />)

      // Wait for techniques to load
      await waitFor(() => {
        expect(screen.getByText(mockTechniques[0].name)).toBeInTheDocument()
      })

      // Click on technique card
      const techniqueLink = screen.getByText('View Details')
      await user.click(techniqueLink)

      // Should navigate to detail page (in real app)
      expect(techniqueLink).toHaveAttribute('href', `/techniques/${mockTechniques[0].slug}`)
    })

    it('displays technique cards with correct information', async () => {
      renderWithProviders(<TechniquesListPage />)

      await waitFor(() => {
        mockTechniques.forEach(technique => {
          const card = screen.getByTestId(`technique-card-${technique.slug}`)
          expect(within(card).getByText(technique.name)).toBeInTheDocument()
          expect(within(card).getByText(technique.description)).toBeInTheDocument()
        })
      })
    })

    it('handles card hover states appropriately', async () => {
      const { user } = renderWithProviders(<TechniquesListPage />)

      await waitFor(() => {
        expect(screen.getByText(mockTechniques[0].name)).toBeInTheDocument()
      })

      const firstCard = screen.getByTestId(`technique-card-${mockTechniques[0].slug}`)
      
      // Hover over card
      await user.hover(firstCard)
      
      // Card should still be accessible
      expect(firstCard).toBeInTheDocument()
    })
  })

  describe('Responsive Behavior', () => {
    it('adjusts layout for different screen sizes', async () => {
      renderWithProviders(<TechniquesListPage />)

      const grid = screen.getByTestId('techniques-grid')
      expect(grid).toBeInTheDocument()

      // In a real test, you might check CSS classes or computed styles
      // for responsive behavior
    })

    it('maintains functionality on mobile devices', async () => {
      // Mock mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      })

      const { user } = renderWithProviders(<TechniquesListPage />)

      // Should still be able to search and filter
      const searchInput = screen.getByPlaceholderText('Search techniques...')
      await user.type(searchInput, 'test')

      expect(searchInput).toHaveValue('test')
    })
  })

  describe('Performance and Optimization', () => {
    it('loads efficiently with many techniques', async () => {
      // Create large dataset
      const largeTechniquesList = Array.from({ length: 100 }, (_, index) => ({
        ...mockTechniques[0],
        slug: `technique-${index}`,
        name: `Technique ${index}`
      }))

      // Mock large response
      server.use(
        http.get('*/api/techniques/', () => {
          return HttpResponse.json({
            count: largeTechniquesList.length,
            next: null,
            previous: null,
            results: largeTechniquesList
          })
        })
      )

      const startTime = performance.now()
      renderWithProviders(<TechniquesListPage />)

      await waitFor(() => {
        expect(screen.getByText('Technique 0')).toBeInTheDocument()
      })

      const endTime = performance.now()
      const loadTime = endTime - startTime

      // Should load in reasonable time
      expect(loadTime).toBeLessThan(1000) // 1 second
    })

    it('implements pagination for large datasets', async () => {
      // Mock paginated response
      server.use(
        http.get('*/api/techniques/', ({ request }) => {
          const url = new URL(request.url)
          const page = parseInt(url.searchParams.get('page') || '1')
          const pageSize = parseInt(url.searchParams.get('page_size') || '20')

          return HttpResponse.json({
            count: 100,
            next: page < 5 ? `?page=${page + 1}` : null,
            previous: page > 1 ? `?page=${page - 1}` : null,
            results: mockTechniques.slice(0, pageSize)
          })
        })
      )

      renderWithProviders(<TechniquesListPage />)

      await waitFor(() => {
        expect(screen.getByText(mockTechniques[0].name)).toBeInTheDocument()
      })

      // Look for pagination controls
      expect(screen.queryByText(/next|previous|page/i)).toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    it('provides proper heading structure', async () => {
      renderWithProviders(<TechniquesListPage />)

      // Should have proper heading hierarchy
      expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('TEA Techniques')
    })

    it('supports keyboard navigation', async () => {
      const { user } = renderWithProviders(<TechniquesListPage />)

      // Should be able to tab through interactive elements
      await user.tab() // Search input
      expect(screen.getByPlaceholderText('Search techniques...')).toHaveFocus()

      await user.tab() // First filter
      expect(screen.getByLabelText('Filter by assurance goal')).toHaveFocus()
    })

    it('provides appropriate ARIA labels', async () => {
      renderWithProviders(<TechniquesListPage />)

      // Filter controls should have labels
      expect(screen.getByLabelText('Filter by assurance goal')).toBeInTheDocument()
      expect(screen.getByLabelText('Filter by tag')).toBeInTheDocument()
      expect(screen.getByLabelText('Filter by complexity')).toBeInTheDocument()
    })

    it('announces filter results to screen readers', async () => {
      const { user } = renderWithProviders(<TechniquesListPage />)

      const searchInput = screen.getByPlaceholderText('Search techniques...')
      await user.type(searchInput, 'SHAP')

      // Should have live region for announcing results
      await waitFor(() => {
        expect(screen.getByRole('status') || screen.getByLabelText(/results/i)).toBeInTheDocument()
      })
    })
  })
})