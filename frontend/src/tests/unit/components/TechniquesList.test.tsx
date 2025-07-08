import React from 'react'
import { screen, waitFor, within } from '@testing-library/react'
import { renderWithProviders } from '../../utils/test-utils'
import TechniquesList from '../../../components/technique/TechniquesList'
import { mockTechniques, createMockTechniquesList } from '../../fixtures/techniques'
import type { Technique } from '../../../lib/types'

describe('TechniquesList', () => {
  const mockTechniquesList = createMockTechniquesList(mockTechniques as Technique[])

  describe('Basic Rendering', () => {
    it('renders list of techniques', () => {
      renderWithProviders(<TechniquesList techniques={mockTechniquesList.results} />)
      
      // Should render all techniques
      mockTechniques.forEach(technique => {
        expect(screen.getByText(technique.name)).toBeInTheDocument()
      })
    })

    it('renders empty state when no techniques provided', () => {
      renderWithProviders(<TechniquesList techniques={[]} />)
      
      expect(screen.getByText(/no techniques found/i)).toBeInTheDocument()
    })

    it('renders loading state when isLoading is true', () => {
      renderWithProviders(<TechniquesList techniques={[]} isLoading={true} />)
      
      expect(screen.getByText(/loading/i)).toBeInTheDocument()
    })
  })

  describe('Technique Cards Rendering', () => {
    it('renders each technique as a TechniqueCard component', () => {
      renderWithProviders(<TechniquesList techniques={mockTechniquesList.results} />)
      
      // Each technique should be rendered as a link (from TechniqueCard)
      const techniqueLinks = screen.getAllByRole('link')
      expect(techniqueLinks).toHaveLength(mockTechniques.length)
      
      // Verify each link points to the correct slug-based URL
      mockTechniques.forEach((technique, index) => {
        expect(techniqueLinks[index]).toHaveAttribute('href', `/techniques/${technique.slug}`)
      })
    })

    it('maintains proper order of techniques', () => {
      renderWithProviders(<TechniquesList techniques={mockTechniquesList.results} />)
      
      const techniqueNames = screen.getAllByRole('heading', { level: 3 })
      
      mockTechniques.forEach((technique, index) => {
        expect(techniqueNames[index]).toHaveTextContent(technique.name)
      })
    })
  })

  describe('Grid Layout', () => {
    it('applies proper grid layout for technique cards', () => {
      renderWithProviders(<TechniquesList techniques={mockTechniquesList.results} />)
      
      const listContainer = screen.getByRole('list') || screen.getByTestId('techniques-grid')
      expect(listContainer).toBeInTheDocument()
      
      // Should contain all technique cards
      const techniqueCards = within(listContainer).getAllByRole('link')
      expect(techniqueCards).toHaveLength(mockTechniques.length)
    })

    it('handles responsive layout appropriately', () => {
      renderWithProviders(<TechniquesList techniques={mockTechniquesList.results} />)
      
      const listContainer = screen.getByRole('list') || screen.getByTestId('techniques-grid')
      
      // Should have appropriate CSS classes for responsive design
      expect(listContainer).toHaveClass(/grid|flex|techniques/)
    })
  })

  describe('Search and Filtering Integration', () => {
    it('handles filtered technique results', () => {
      const filteredTechniques = [mockTechniques[0] as Technique]
      
      renderWithProviders(<TechniquesList techniques={filteredTechniques} />)
      
      expect(screen.getByText(mockTechniques[0].name)).toBeInTheDocument()
      expect(screen.queryByText(mockTechniques[1].name)).not.toBeInTheDocument()
    })

    it('displays search results count when provided', () => {
      const searchResults = [mockTechniques[0] as Technique]
      
      renderWithProviders(
        <TechniquesList 
          techniques={searchResults} 
          totalCount={1}
          showResultsCount={true}
        />
      )
      
      expect(screen.getByText(/1 technique/i)).toBeInTheDocument()
    })

    it('handles empty search results gracefully', () => {
      renderWithProviders(
        <TechniquesList 
          techniques={[]} 
          totalCount={0}
          isSearch={true}
        />
      )
      
      expect(screen.getByText(/no techniques match your search/i)).toBeInTheDocument()
    })
  })

  describe('Performance with Large Lists', () => {
    it('handles many techniques without performance issues', async () => {
      // Create a larger list of techniques
      const largeTechniquesList = Array.from({ length: 50 }, (_, index) => ({
        ...mockTechniques[0],
        slug: `technique-${index}`,
        name: `Technique ${index}`,
        acronym: `T${index}`
      })) as Technique[]

      const startTime = performance.now()
      
      renderWithProviders(<TechniquesList techniques={largeTechniquesList} />)
      
      await waitFor(() => {
        expect(screen.getByText('Technique 0')).toBeInTheDocument()
      })
      
      const endTime = performance.now()
      const renderTime = endTime - startTime
      
      // Should render large list in reasonable time (under 500ms)
      expect(renderTime).toBeLessThan(500)
    })

    it('implements virtualization for very large lists if applicable', () => {
      const largeTechniquesList = Array.from({ length: 100 }, (_, index) => ({
        ...mockTechniques[0],
        slug: `technique-${index}`,
        name: `Technique ${index}`
      })) as Technique[]

      renderWithProviders(<TechniquesList techniques={largeTechniquesList} />)
      
      // Check if virtualization is implemented by looking for container
      const listContainer = screen.getByRole('list') || screen.getByTestId('techniques-grid')
      expect(listContainer).toBeInTheDocument()
      
      // If virtualization is implemented, not all items should be in DOM at once
      // This test would need to be adjusted based on actual implementation
    })
  })

  describe('Error Handling', () => {
    it('handles malformed technique data gracefully', () => {
      const malformedTechnique = {
        slug: 'malformed',
        name: null, // Invalid data
        description: 'Test'
      } as any

      renderWithProviders(<TechniquesList techniques={[malformedTechnique]} />)
      
      // Should not crash and should render what it can
      expect(screen.getByText('Test')).toBeInTheDocument()
    })

    it('displays error state when error prop is provided', () => {
      renderWithProviders(
        <TechniquesList 
          techniques={[]} 
          error="Failed to load techniques"
        />
      )
      
      expect(screen.getByText(/failed to load techniques/i)).toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    it('provides proper list semantics for screen readers', () => {
      renderWithProviders(<TechniquesList techniques={mockTechniquesList.results} />)
      
      const listElement = screen.getByRole('list')
      expect(listElement).toBeInTheDocument()
      
      const listItems = screen.getAllByRole('listitem')
      expect(listItems).toHaveLength(mockTechniques.length)
    })

    it('maintains keyboard navigation through technique cards', async () => {
      const { user } = renderWithProviders(<TechniquesList techniques={mockTechniquesList.results} />)
      
      const techniqueLinks = screen.getAllByRole('link')
      
      // Tab through all technique cards
      for (let i = 0; i < techniqueLinks.length; i++) {
        await user.tab()
        expect(techniqueLinks[i]).toHaveFocus()
      }
    })

    it('provides appropriate ARIA labels and descriptions', () => {
      renderWithProviders(<TechniquesList techniques={mockTechniquesList.results} />)
      
      const listContainer = screen.getByRole('list')
      expect(listContainer).toHaveAttribute('aria-label', expect.stringContaining('techniques'))
    })
  })

  describe('Loading States', () => {
    it('shows loading skeleton while techniques are being fetched', () => {
      renderWithProviders(<TechniquesList techniques={[]} isLoading={true} />)
      
      expect(screen.getByTestId('techniques-loading') || screen.getByText(/loading/i)).toBeInTheDocument()
    })

    it('transitions from loading to loaded state smoothly', async () => {
      const { rerender } = renderWithProviders(<TechniquesList techniques={[]} isLoading={true} />)
      
      expect(screen.getByText(/loading/i)).toBeInTheDocument()
      
      rerender(<TechniquesList techniques={mockTechniquesList.results} isLoading={false} />)
      
      await waitFor(() => {
        expect(screen.queryByText(/loading/i)).not.toBeInTheDocument()
        expect(screen.getByText(mockTechniques[0].name)).toBeInTheDocument()
      })
    })
  })

  describe('Sorting and Ordering', () => {
    it('maintains technique order as provided in props', () => {
      const reorderedTechniques = [...(mockTechniques as Technique[])].reverse()
      
      renderWithProviders(<TechniquesList techniques={reorderedTechniques} />)
      
      const techniqueNames = screen.getAllByRole('heading', { level: 3 })
      
      reorderedTechniques.forEach((technique, index) => {
        expect(techniqueNames[index]).toHaveTextContent(technique.name)
      })
    })

    it('handles dynamic sorting changes', () => {
      const sortedByName = [...(mockTechniques as Technique[])].sort((a, b) => a.name.localeCompare(b.name))
      
      renderWithProviders(<TechniquesList techniques={sortedByName} />)
      
      const techniqueNames = screen.getAllByRole('heading', { level: 3 })
      
      sortedByName.forEach((technique, index) => {
        expect(techniqueNames[index]).toHaveTextContent(technique.name)
      })
    })
  })
})