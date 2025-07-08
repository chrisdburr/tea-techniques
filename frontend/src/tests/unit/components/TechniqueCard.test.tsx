import React from 'react'
import { screen, waitFor } from '@testing-library/react'
import { renderWithProviders, expectToMatchTechniqueShape } from '../../utils/test-utils'
import TechniqueCard from '../../../components/technique/TechniqueCard'
import { mockTechniques, mockEdgeCaseTechniques } from '../../fixtures/techniques'
import type { Technique } from '../../../lib/types'

describe('TechniqueCard', () => {
  const mockTechnique = mockTechniques[0] as Technique

  describe('Basic Rendering', () => {
    it('renders technique card with basic information', () => {
      renderWithProviders(<TechniqueCard technique={mockTechnique} />)
      
      // Check that essential elements are present
      expect(screen.getByText(mockTechnique.name)).toBeInTheDocument()
      expect(screen.getByText(mockTechnique.description)).toBeInTheDocument()
      
      // Check for acronym display
      if (mockTechnique.acronym) {
        expect(screen.getByText(mockTechnique.acronym)).toBeInTheDocument()
      }
    })

    it('renders technique card as a clickable link using slug', () => {
      renderWithProviders(<TechniqueCard technique={mockTechnique} />)
      
      const linkElement = screen.getByRole('link')
      expect(linkElement).toHaveAttribute('href', `/techniques/${mockTechnique.slug}`)
    })

    it('displays complexity rating when provided', () => {
      renderWithProviders(<TechniqueCard technique={mockTechnique} />)
      
      // Look for complexity rating display
      expect(screen.getByText(/complexity/i)).toBeInTheDocument()
      expect(screen.getByText(mockTechnique.complexity_rating.toString())).toBeInTheDocument()
    })

    it('displays computational cost rating when provided', () => {
      renderWithProviders(<TechniqueCard technique={mockTechnique} />)
      
      expect(screen.getByText(/computational cost/i)).toBeInTheDocument()
      expect(screen.getByText(mockTechnique.computational_cost_rating.toString())).toBeInTheDocument()
    })
  })

  describe('Assurance Goals Display', () => {
    it('displays assurance goals when present', () => {
      renderWithProviders(<TechniqueCard technique={mockTechnique} />)
      
      mockTechnique.assurance_goals.forEach(goal => {
        expect(screen.getByText(goal.name)).toBeInTheDocument()
      })
    })

    it('handles empty assurance goals gracefully', () => {
      const techniqueWithNoGoals = {
        ...mockTechnique,
        assurance_goals: []
      }
      
      renderWithProviders(<TechniqueCard technique={techniqueWithNoGoals} />)
      
      // Should still render without errors
      expect(screen.getByText(mockTechnique.name)).toBeInTheDocument()
    })
  })

  describe('Tags Display', () => {
    it('displays tags when present', () => {
      renderWithProviders(<TechniqueCard technique={mockTechnique} />)
      
      mockTechnique.tags.forEach(tag => {
        expect(screen.getByText(tag.name)).toBeInTheDocument()
      })
    })

    it('handles empty tags gracefully', () => {
      const techniqueWithNoTags = {
        ...mockTechnique,
        tags: []
      }
      
      renderWithProviders(<TechniqueCard technique={techniqueWithNoTags} />)
      
      expect(screen.getByText(mockTechnique.name)).toBeInTheDocument()
    })
  })

  describe('Edge Cases and Robustness', () => {
    it('handles very long technique names gracefully', () => {
      const longNameTechnique = mockEdgeCaseTechniques[0] as Technique
      
      renderWithProviders(<TechniqueCard technique={longNameTechnique} />)
      
      expect(screen.getByText(longNameTechnique.name)).toBeInTheDocument()
      
      // Check that card doesn't break layout with long name
      const cardElement = screen.getByRole('link')
      expect(cardElement).toBeInTheDocument()
    })

    it('handles special characters and emojis in technique name', () => {
      const specialCharTechnique = mockEdgeCaseTechniques[1] as Technique
      
      renderWithProviders(<TechniqueCard technique={specialCharTechnique} />)
      
      expect(screen.getByText(specialCharTechnique.name)).toBeInTheDocument()
    })

    it('handles missing optional fields gracefully', () => {
      const minimalTechnique: Technique = {
        slug: 'minimal-technique',
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
      }
      
      renderWithProviders(<TechniqueCard technique={minimalTechnique} />)
      
      expect(screen.getByText('Minimal Technique')).toBeInTheDocument()
      expect(screen.getByText('Basic description')).toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    it('provides accessible navigation with proper link text', () => {
      renderWithProviders(<TechniqueCard technique={mockTechnique} />)
      
      const linkElement = screen.getByRole('link')
      expect(linkElement).toHaveAccessibleName()
    })

    it('provides semantic structure for screen readers', () => {
      renderWithProviders(<TechniqueCard technique={mockTechnique} />)
      
      // Check for proper heading structure
      expect(screen.getByRole('heading', { level: 3 })).toBeInTheDocument()
    })

    it('handles keyboard navigation appropriately', async () => {
      const { user } = renderWithProviders(<TechniqueCard technique={mockTechnique} />)
      
      const linkElement = screen.getByRole('link')
      
      // Focus the card
      await user.tab()
      expect(linkElement).toHaveFocus()
      
      // Should be able to activate with Enter
      await user.keyboard('{Enter}')
      // Note: In real app this would navigate, in test we just verify focusability
    })
  })

  describe('Performance', () => {
    it('renders within reasonable time constraints', async () => {
      const startTime = performance.now()
      
      renderWithProviders(<TechniqueCard technique={mockTechnique} />)
      
      await waitFor(() => {
        expect(screen.getByText(mockTechnique.name)).toBeInTheDocument()
      })
      
      const endTime = performance.now()
      const renderTime = endTime - startTime
      
      // Should render in under 100ms for a single card
      expect(renderTime).toBeLessThan(100)
    })
  })

  describe('Data Shape Validation', () => {
    it('receives technique data in expected format', () => {
      renderWithProviders(<TechniqueCard technique={mockTechnique} />)
      
      // Validate that the technique object matches expected shape
      expectToMatchTechniqueShape(mockTechnique)
    })
  })

  describe('Visual States', () => {
    it('applies hover states appropriately', async () => {
      const { user } = renderWithProviders(<TechniqueCard technique={mockTechnique} />)
      
      const cardElement = screen.getByRole('link')
      
      // Hover over the card
      await user.hover(cardElement)
      
      // Should still be accessible and not break
      expect(cardElement).toBeInTheDocument()
    })

    it('maintains visual consistency with different content lengths', () => {
      const shortDescriptionTechnique = {
        ...mockTechnique,
        description: 'Short description'
      }
      
      const longDescriptionTechnique = {
        ...mockTechnique,
        description: 'This is a very long description that might span multiple lines and could potentially cause layout issues if not handled properly by the component styling and layout system.'
      }
      
      // Render both and ensure they both work
      const { rerender } = renderWithProviders(<TechniqueCard technique={shortDescriptionTechnique} />)
      expect(screen.getByText('Short description')).toBeInTheDocument()
      
      rerender(<TechniqueCard technique={longDescriptionTechnique} />)
      expect(screen.getByText(/This is a very long description/)).toBeInTheDocument()
    })
  })
})