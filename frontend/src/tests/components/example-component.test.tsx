/**
 * Example component test demonstrating the comprehensive testing infrastructure
 * 
 * This test file shows:
 * - Component rendering with providers
 * - API integration testing with minimal mocking
 * - Accessibility testing with jest-axe
 * - User interaction testing
 * - Performance considerations
 * - Domain-specific test data usage
 * 
 * This serves as a template for other component tests in the project.
 */

import React from 'react'
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { renderWithProviders } from '../utils/test-utils'
import { testAccessibility } from '../utils/accessibility-test-utils'
import { createApiMocker, mockApiScenarios } from '../utils/api-test-utils'
import { mockTechniques, createMockTechnique } from '../fixtures/techniques'
import type { Technique } from '../../lib/types'

// Mock component for demonstration purposes
// In real tests, you would import actual components
const MockTechniqueCard: React.FC<{ technique: Technique }> = ({ technique }) => {
  return (
    <div 
      data-testid="technique-card"
      role="article"
      aria-labelledby={`technique-${technique.slug}-title`}
    >
      <h2 id={`technique-${technique.slug}-title`}>
        {technique.name} {technique.acronym && `(${technique.acronym})`}
      </h2>
      <p>{technique.description}</p>
      <div>
        <span>Complexity: {technique.complexity_rating}/5</span>
        <span>Cost: {technique.computational_cost_rating}/5</span>
      </div>
      <div>
        <strong>Assurance Goals:</strong>
        <ul>
          {technique.assurance_goals.map((goal) => (
            <li key={goal.id}>{goal.name}</li>
          ))}
        </ul>
      </div>
      <button 
        type="button"
        aria-label={`View details for ${technique.name}`}
      >
        View Details
      </button>
    </div>
  )
}

const MockTechniqueList: React.FC = () => {
  // This would normally use React Query to fetch data
  const techniques = mockTechniques.slice(0, 2)
  
  return (
    <main data-testid="technique-list">
      <h1>TEA Techniques</h1>
      <p>Explore techniques for trustworthy and ethical AI assurance</p>
      <div role="region" aria-label="List of TEA techniques">
        {techniques.map(technique => (
          <MockTechniqueCard key={technique.slug} technique={technique} />
        ))}
      </div>
    </main>
  )
}

describe('TechniqueCard Component', () => {
  let apiMocker: ReturnType<typeof createApiMocker>

  beforeEach(() => {
    // Set up API mocking for each test
    apiMocker = mockApiScenarios.allWorking()
  })

  afterEach(() => {
    // Clean up API mocks
    apiMocker.reset()
  })

  describe('Rendering', () => {
    it('renders technique information correctly', () => {
      const technique = mockTechniques[0] // SHAP technique
      
      const { container } = renderWithProviders(<MockTechniqueCard technique={technique} />)
      
      // Check that the component renders at all
      const card = container.querySelector('[data-testid="technique-card"]')
      expect(card).toBeInTheDocument()

      // Test that domain-specific content is rendered
      expect(container.textContent).toContain('SHapley Additive exPlanations (SHAP)')
      expect(container.textContent).toContain('SHAP explains model predictions')
      expect(container.textContent).toContain('Complexity: 3/5')
      expect(container.textContent).toContain('Cost: 2/5')
      
      // Test that assurance goals are displayed
      expect(container.textContent).toContain('Explainability')
      expect(container.textContent).toContain('Fairness')
    })

    it('handles edge cases gracefully', () => {
      const edgeCaseTechnique = createMockTechnique({
        name: 'A'.repeat(100), // Very long name
        assurance_goals: [], // No goals
        complexity_rating: 5,
        computational_cost_rating: 5,
      })

      const { container } = renderWithProviders(<MockTechniqueCard technique={edgeCaseTechnique} />)

      // Should still render without errors
      const card = container.querySelector('[data-testid="technique-card"]')
      expect(card).toBeInTheDocument()
      expect(container.textContent).toContain('Complexity: 5/5')
    })
  })

  describe('Accessibility', () => {
    it('meets WCAG accessibility standards', async () => {
      const technique = mockTechniques[0]
      const renderResult = renderWithProviders(<MockTechniqueCard technique={technique} />)

      // Test overall accessibility
      await testAccessibility(renderResult)
    })

    it('has proper semantic structure', () => {
      const technique = mockTechniques[0]
      const { container } = renderWithProviders(<MockTechniqueCard technique={technique} />)

      // Check semantic HTML structure
      const article = container.querySelector('[role="article"]')
      expect(article).toHaveAttribute('aria-labelledby', `technique-${technique.slug}-title`)

      const heading = container.querySelector('h2')
      expect(heading).toHaveAttribute('id', `technique-${technique.slug}-title`)

      const button = container.querySelector('button')
      expect(button).toHaveAttribute('aria-label', `View details for ${technique.name}`)
    })

    it('supports keyboard navigation', async () => {
      const technique = mockTechniques[0]
      const { user, container } = renderWithProviders(<MockTechniqueCard technique={technique} />)

      const button = container.querySelector('button')
      
      // Tab to button
      await user.tab()
      expect(button).toHaveFocus()
      
      // Activate with Enter
      await user.keyboard('{Enter}')
      // In a real component, this would trigger some action
    })
  })

  describe('User Interactions', () => {
    it('handles button clicks correctly', async () => {
      const technique = mockTechniques[0]
      const { user, container } = renderWithProviders(<MockTechniqueCard technique={technique} />)

      const viewButton = container.querySelector('button')

      await user.click(viewButton)
      
      // In a real component, we would test the actual behavior
      // For example, navigation to detail page or opening a modal
    })
  })

  describe('Performance', () => {
    it('renders efficiently with realistic data', () => {
      const technique = mockTechniques[0] // Complex SHAP technique
      const startTime = performance.now()
      
      renderWithProviders(<MockTechniqueCard technique={technique} />)
      
      const endTime = performance.now()
      const renderTime = endTime - startTime
      
      // Render should be fast (less than 50ms for a single component)
      expect(renderTime).toBeLessThan(50)
    })

    it('handles large datasets without performance degradation', () => {
      const largeTechnique = createMockTechnique({
        description: 'A'.repeat(10000), // Very long description
        assurance_goals: Array.from({ length: 50 }, (_, i) => ({
          id: i,
          name: `Goal ${i}`,
          description: 'Test goal'
        })),
      })

      const startTime = performance.now()
      renderWithProviders(<MockTechniqueCard technique={largeTechnique} />)
      const endTime = performance.now()
      
      // Should still render reasonably fast even with large data
      expect(endTime - startTime).toBeLessThan(100)
    })
  })
})

describe('TechniqueList Component', () => {
  let apiMocker: ReturnType<typeof createApiMocker>

  beforeEach(() => {
    apiMocker = mockApiScenarios.allWorking()
  })

  afterEach(() => {
    apiMocker.reset()
  })

  describe('Integration Testing', () => {
    it('renders list of techniques correctly', () => {
      const { container } = renderWithProviders(<MockTechniqueList />)

      // Test main content
      const main = container.querySelector('main')
      expect(main).toBeInTheDocument()
      const heading = container.querySelector('h1')
      expect(heading).toHaveTextContent('TEA Techniques')
      
      // Test that multiple techniques are rendered
      expect(container.textContent).toContain('SHapley Additive exPlanations (SHAP)')
      expect(container.textContent).toContain('Local Interpretable Model-agnostic Explanations (LIME)')
    })

    it('maintains accessibility with multiple components', async () => {
      const renderResult = renderWithProviders(<MockTechniqueList />)

      // Test accessibility of the entire list
      await testAccessibility(renderResult)
    })

    it('handles empty state gracefully', () => {
      // Test with empty techniques array
      const MockEmptyList: React.FC = () => (
        <main data-testid="technique-list">
          <h1>TEA Techniques</h1>
          <p>No techniques available</p>
          <div role="region" aria-label="List of TEA techniques">
            <p>No techniques found. Please check back later.</p>
          </div>
        </main>
      )

      const { container } = renderWithProviders(<MockEmptyList />)
      
      expect(container.textContent).toContain('No techniques found. Please check back later.')
    })
  })

  describe('Error Handling', () => {
    it('handles API errors gracefully', async () => {
      // Set up error scenario
      apiMocker.reset()
      apiMocker = mockApiScenarios.serverErrors()

      // Component would need error boundary or error handling
      // This is a placeholder for how error testing would work
      const MockErrorComponent: React.FC = () => (
        <div role="alert">
          <h2>Unable to load techniques</h2>
          <p>Please try again later or contact support.</p>
        </div>
      )

      const { container } = renderWithProviders(<MockErrorComponent />)
      
      const alert = container.querySelector('[role="alert"]')
      expect(alert).toBeInTheDocument()
      expect(container.textContent).toContain('Unable to load techniques')
    })
  })
})

describe('Test Infrastructure Validation', () => {
  it('validates mock data structure matches expected types', () => {
    const technique = mockTechniques[0]
    
    // Validate that our mock data has the expected structure
    expect(technique).toMatchObject({
      slug: expect.any(String),
      name: expect.any(String),
      description: expect.any(String),
      complexity_rating: expect.any(Number),
      computational_cost_rating: expect.any(Number),
      assurance_goals: expect.any(Array),
      tags: expect.any(Array),
      resources: expect.any(Array),
      example_use_cases: expect.any(Array),
      limitations: expect.any(Array),
      related_techniques: expect.any(Array),
    })

    // Validate ratings are in valid range
    expect(technique.complexity_rating).toBeGreaterThanOrEqual(1)
    expect(technique.complexity_rating).toBeLessThanOrEqual(5)
    expect(technique.computational_cost_rating).toBeGreaterThanOrEqual(1)
    expect(technique.computational_cost_rating).toBeLessThanOrEqual(5)
  })

  it('demonstrates API mocking capabilities', async () => {
    const mocker = createApiMocker()
    
    mocker
      .onGet('/api/techniques/', () => 
        Promise.resolve({
          ok: true,
          status: 200,
          json: () => Promise.resolve({ count: 1, results: [mockTechniques[0]] })
        } as Response)
      )
      .execute()

    const response = await fetch('/api/techniques/')
    const data = await response.json()
    
    expect(data.results).toHaveLength(1)
    expect(data.results[0].name).toBe('SHapley Additive exPlanations')
    
    mocker.reset()
  })
})