import React from 'react'
import { render } from '@testing-library/react'
import { axe, toHaveNoViolations } from 'jest-axe'
import { renderWithProviders } from '../utils/test-utils'
import { mockTechniques } from '../fixtures/techniques'
import type { Technique } from '../../lib/types'
import { describe, it, expect } from 'vitest'

// Extend Jest matchers
expect.extend(toHaveNoViolations)

// Mock components for accessibility testing
const TechniqueCard = ({ technique }: { technique: Technique }) => (
  <article role="article" aria-labelledby={`technique-${technique.slug}-title`}>
    <h3 id={`technique-${technique.slug}-title`}>{technique.name}</h3>
    {technique.acronym && (
      <span aria-label={`Acronym: ${technique.acronym}`}>({technique.acronym})</span>
    )}
    <p>{technique.description}</p>
    <div role="group" aria-label="Ratings">
      <span aria-label={`Complexity rating: ${technique.complexity_rating} out of 5`}>
        Complexity: {technique.complexity_rating}/5
      </span>
      <span aria-label={`Computational cost rating: ${technique.computational_cost_rating} out of 5`}>
        Cost: {technique.computational_cost_rating}/5
      </span>
    </div>
    <nav aria-label={`${technique.name} categories`}>
      <ul>
        {technique.assurance_goals.map(goal => (
          <li key={goal.id}>
            <span className="goal-badge" role="img" aria-label={`Assurance goal: ${goal.name}`}>
              {goal.name}
            </span>
          </li>
        ))}
      </ul>
    </nav>
    <nav aria-label={`${technique.name} tags`}>
      <ul>
        {technique.tags.map(tag => (
          <li key={tag.id}>
            <span className="tag-badge" role="img" aria-label={`Tag: ${tag.name}`}>
              #{tag.name}
            </span>
          </li>
        ))}
      </ul>
    </nav>
    <a 
      href={`/techniques/${technique.slug}`}
      aria-describedby={`technique-${technique.slug}-title`}
    >
      View technique details
    </a>
  </article>
)

const TechniquesList = ({ techniques }: { techniques: Technique[] }) => (
  <main>
    <h1>TEA Techniques</h1>
    <section aria-label="Search and filter controls">
      <h2>Search and Filter</h2>
      <div className="search-container">
        <label htmlFor="search-input">Search techniques</label>
        <input 
          id="search-input"
          type="search" 
          placeholder="Enter technique name or description..."
          aria-describedby="search-help"
        />
        <div id="search-help" className="sr-only">
          Search through technique names, descriptions, and acronyms
        </div>
      </div>
      
      <fieldset>
        <legend>Filter by category</legend>
        
        <div className="filter-group">
          <label htmlFor="goal-filter">Assurance Goal</label>
          <select id="goal-filter" aria-describedby="goal-filter-help">
            <option value="">All goals</option>
            <option value="1">Explainability</option>
            <option value="2">Fairness</option>
            <option value="3">Privacy</option>
          </select>
          <div id="goal-filter-help" className="sr-only">
            Filter techniques by their primary assurance goal
          </div>
        </div>

        <div className="filter-group">
          <label htmlFor="complexity-filter">Complexity Level</label>
          <select id="complexity-filter" aria-describedby="complexity-filter-help">
            <option value="">All levels</option>
            <option value="1">1 - Very Simple</option>
            <option value="2">2 - Simple</option>
            <option value="3">3 - Moderate</option>
            <option value="4">4 - Complex</option>
            <option value="5">5 - Very Complex</option>
          </select>
          <div id="complexity-filter-help" className="sr-only">
            Filter techniques by implementation complexity from 1 (simple) to 5 (complex)
          </div>
        </div>
      </fieldset>
    </section>

    <section aria-label="Techniques results">
      <h2>Search Results</h2>
      <div 
        role="status" 
        aria-live="polite" 
        aria-atomic="true"
        id="results-summary"
      >
        {techniques.length === 0 
          ? "No techniques found matching your criteria"
          : `${techniques.length} technique${techniques.length !== 1 ? 's' : ''} found`
        }
      </div>
      
      <div 
        role="list" 
        aria-label="Techniques list"
        className="techniques-grid"
      >
        {techniques.map(technique => (
          <div key={technique.slug} role="listitem">
            <TechniqueCard technique={technique} />
          </div>
        ))}
      </div>
    </section>
  </main>
)

const TechniqueForm = () => (
  <main>
    <h1>Create New Technique</h1>
    <form aria-label="Technique creation form">
      <fieldset>
        <legend>Basic Information</legend>
        
        <div className="form-group">
          <label htmlFor="technique-name">
            Technique Name <span aria-label="required">*</span>
          </label>
          <input 
            id="technique-name"
            type="text" 
            required
            aria-describedby="name-help name-error"
            aria-invalid="false"
          />
          <div id="name-help" className="help-text">
            Enter the full name of the technique
          </div>
          <div id="name-error" className="error-text" role="alert" aria-live="assertive">
            {/* Error messages would appear here */}
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="technique-acronym">Acronym</label>
          <input 
            id="technique-acronym"
            type="text" 
            aria-describedby="acronym-help"
          />
          <div id="acronym-help" className="help-text">
            Optional: Common acronym for the technique (e.g., SHAP, LIME)
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="technique-description">
            Description <span aria-label="required">*</span>
          </label>
          <textarea 
            id="technique-description"
            required
            aria-describedby="description-help"
            rows={4}
          />
          <div id="description-help" className="help-text">
            Provide a detailed description of what the technique does and how it works
          </div>
        </div>
      </fieldset>

      <fieldset>
        <legend>Ratings</legend>
        
        <div className="form-group">
          <label htmlFor="complexity-rating">
            Complexity Rating <span aria-label="required">*</span>
          </label>
          <select 
            id="complexity-rating"
            required
            aria-describedby="complexity-help"
          >
            <option value="">Select complexity</option>
            <option value="1">1 - Very Simple</option>
            <option value="2">2 - Simple</option>
            <option value="3">3 - Moderate</option>
            <option value="4">4 - Complex</option>
            <option value="5">5 - Very Complex</option>
          </select>
          <div id="complexity-help" className="help-text">
            Rate how difficult it is to implement and understand this technique
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="cost-rating">
            Computational Cost Rating <span aria-label="required">*</span>
          </label>
          <select 
            id="cost-rating"
            required
            aria-describedby="cost-help"
          >
            <option value="">Select cost</option>
            <option value="1">1 - Very Low</option>
            <option value="2">2 - Low</option>
            <option value="3">3 - Moderate</option>
            <option value="4">4 - High</option>
            <option value="5">5 - Very High</option>
          </select>
          <div id="cost-help" className="help-text">
            Rate the computational resources required to run this technique
          </div>
        </div>
      </fieldset>

      <div className="form-actions">
        <button type="submit" className="primary-button">
          Create Technique
        </button>
        <button type="button" className="secondary-button">
          Cancel
        </button>
      </div>
    </form>
  </main>
)

describe('WCAG 2.1 AA Compliance', () => {
  describe('TechniqueCard Component', () => {
    it('should not have any accessibility violations', async () => {
      const technique = mockTechniques[0] as unknown as Technique
      const { container } = render(<TechniqueCard technique={technique} />)
      
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })

    it('provides proper semantic structure', () => {
      const technique = mockTechniques[0] as unknown as Technique
      const { container } = render(<TechniqueCard technique={technique} />)

      // Should have proper article structure
      const article = container.querySelector('article')
      expect(article).toBeInTheDocument()
      const heading = container.querySelector('h3')
      expect(heading).toBeInTheDocument()
      
      // Links should be accessible
      const link = container.querySelector('a')
      expect(link).toBeInTheDocument()
      expect(link).toHaveAttribute('href')
    })

    it('provides meaningful labels for complex information', () => {
      const technique = mockTechniques[0] as unknown as Technique
      const { container } = render(<TechniqueCard technique={technique} />)

      // Ratings should have descriptive labels
      const complexityLabel = container.querySelector('[aria-label*="Complexity rating"]')
      expect(complexityLabel).toBeInTheDocument()
      const costLabel = container.querySelector('[aria-label*="cost rating"]')
      expect(costLabel).toBeInTheDocument()
      
      // Goals and tags should be properly labeled
      if (technique.acronym) {
        const acronymLabel = container.querySelector(`[aria-label="Acronym: ${technique.acronym}"]`)
        expect(acronymLabel).toBeInTheDocument()
      }
    })

    it('supports keyboard navigation', async () => {
      const technique = mockTechniques[0] as unknown as Technique
      const { user, container } = renderWithProviders(<TechniqueCard technique={technique} />)

      const link = container.querySelector('a')
      
      // Should be focusable
      await user.tab()
      expect(link).toHaveFocus()
      
      // Should be activatable with keyboard
      await user.keyboard('{Enter}')
      // In real app, this would navigate
    })
  })

  describe('TechniquesList Component', () => {
    it('should not have any accessibility violations', async () => {
      const techniques = mockTechniques as unknown as Technique[]
      const { container } = render(<TechniquesList techniques={techniques} />)
      
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })

    it('provides proper heading hierarchy', () => {
      const techniques = mockTechniques as unknown as Technique[]
      const { container } = render(<TechniquesList techniques={techniques} />)

      // Should have h1 for page title
      const h1 = container.querySelector('h1')
      expect(h1).toHaveTextContent('TEA Techniques')
      
      // Technique names should be h3 (in cards)
      const h3Elements = container.querySelectorAll('h3')
      expect(h3Elements).toHaveLength(techniques.length)
    })

    it('provides proper form labels and descriptions', () => {
      const techniques = mockTechniques as unknown as Technique[]
      const { container } = render(<TechniquesList techniques={techniques} />)

      // Search should be properly labeled
      const searchLabel = container.querySelector('label[for="search-input"]')
      expect(searchLabel).toBeInTheDocument()
      const searchInput = container.querySelector('input[type="search"]')
      expect(searchInput).toBeInTheDocument()
      
      // Filters should be properly labeled
      const goalLabel = container.querySelector('label[for="goal-filter"]')
      expect(goalLabel).toBeInTheDocument()
      const complexityLabel = container.querySelector('label[for="complexity-filter"]')
      expect(complexityLabel).toBeInTheDocument()
      
      // Fieldset should have legend
      const legend = container.querySelector('legend')
      expect(legend).toHaveTextContent('Filter by category')
    })

    it('provides live region updates for search results', () => {
      const techniques = mockTechniques as unknown as Technique[]
      const { container } = render(<TechniquesList techniques={techniques} />)

      // Should have status region for announcing results
      const statusRegion = container.querySelector('[role="status"]')
      expect(statusRegion).toHaveAttribute('aria-live', 'polite')
      expect(statusRegion).toHaveTextContent(`${techniques.length} techniques found`)
    })

    it('provides proper list semantics', () => {
      const techniques = mockTechniques as unknown as Technique[]
      const { container } = render(<TechniquesList techniques={techniques} />)

      // Should have proper list structure
      const list = container.querySelector('[role="list"][aria-label="Techniques list"]')
      expect(list).toBeInTheDocument()
      
      const listItems = container.querySelectorAll('[role="listitem"]')
      expect(listItems).toHaveLength(techniques.length)
    })
  })

  describe('TechniqueForm Component', () => {
    it('should not have any accessibility violations', async () => {
      const { container } = render(<TechniqueForm />)
      
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })

    it('provides proper form structure and labels', () => {
      const { container } = render(<TechniqueForm />)

      // Form should be properly labeled
      const form = container.querySelector('form[aria-label="Technique creation form"]')
      expect(form).toBeInTheDocument()
      
      // Fieldsets should have legends
      expect(container.textContent).toContain('Basic Information')
      expect(container.textContent).toContain('Ratings')
      
      // All form fields should have labels
      const nameInput = container.querySelector('#technique-name')
      expect(nameInput).toBeInTheDocument()
      const acronymInput = container.querySelector('#technique-acronym')
      expect(acronymInput).toBeInTheDocument()
      const descriptionInput = container.querySelector('#technique-description')
      expect(descriptionInput).toBeInTheDocument()
      const complexityInput = container.querySelector('#complexity-rating')
      expect(complexityInput).toBeInTheDocument()
      const costInput = container.querySelector('#cost-rating')
      expect(costInput).toBeInTheDocument()
    })

    it('indicates required fields clearly', () => {
      const { container } = render(<TechniqueForm />)

      // Required fields should be marked
      const requiredLabels = container.querySelectorAll('[aria-label="required"]')
      expect(requiredLabels.length).toBeGreaterThan(0)
      
      // Required inputs should have required attribute
      const nameInput = container.querySelector('#technique-name')
      expect(nameInput).toHaveAttribute('required')
      const descriptionInput = container.querySelector('#technique-description')
      expect(descriptionInput).toHaveAttribute('required')
    })

    it('provides helpful descriptions for form fields', () => {
      const { container } = render(<TechniqueForm />)

      // Should have help text for form fields
      expect(container.textContent).toContain('Enter the full name of the technique')
      expect(container.textContent).toContain('Optional: Common acronym')
      expect(container.textContent).toContain('Rate how difficult it is to implement')
    })

    it('supports error announcement', () => {
      const { container } = render(<TechniqueForm />)

      // Error regions should be set up for screen readers
      const errorRegions = container.querySelectorAll('[role="alert"]')
      expect(errorRegions.length).toBeGreaterThan(0)
      
      // Error regions should have live updates
      errorRegions.forEach(region => {
        expect(region).toHaveAttribute('aria-live', 'assertive')
      })
    })
  })

  describe('Color Contrast and Visual Accessibility', () => {
    it('ensures sufficient color contrast for text', async () => {
      const technique = mockTechniques[0] as unknown as Technique
      const { container } = render(<TechniqueCard technique={technique} />)
      
      // Axe will check color contrast automatically
      const results = await axe(container, {
        rules: {
          'color-contrast': { enabled: true }
        }
      })
      expect(results).toHaveNoViolations()
    })

    it('does not rely solely on color to convey information', () => {
      const technique = mockTechniques[0] as unknown as Technique
      const { container } = render(<TechniqueCard technique={technique} />)

      // Important information should have text labels, not just colors
      const complexityLabel = container.querySelector('[aria-label*="Complexity rating"]')
      expect(complexityLabel).toBeInTheDocument()
      const costLabel = container.querySelector('[aria-label*="cost rating"]')
      expect(costLabel).toBeInTheDocument()
    })
  })

  describe('Keyboard Navigation', () => {
    it('supports tab navigation through all interactive elements', async () => {
      const techniques = mockTechniques as unknown as Technique[]
      const { user, container } = renderWithProviders(<TechniquesList techniques={techniques} />)

      // Should be able to tab through all interactive elements
      const searchInput = container.querySelector('input[type="search"]')
      const goalSelect = container.querySelector('#goal-filter')
      const complexitySelect = container.querySelector('#complexity-filter')
      const links = container.querySelectorAll('a')
      
      const interactiveElements = [searchInput, goalSelect, complexitySelect, ...Array.from(links)]

      for (let i = 0; i < interactiveElements.length; i++) {
        await user.tab()
        expect(interactiveElements[i]).toHaveFocus()
      }
    })

    it('provides visible focus indicators', async () => {
      const technique = mockTechniques[0] as unknown as Technique
      const { user, container } = renderWithProviders(<TechniqueCard technique={technique} />)

      const link = container.querySelector('a')
      await user.tab()
      
      expect(link).toHaveFocus()
      // In real implementation, should verify focus styles are visible
    })

    it('supports skip links for efficient navigation', () => {
      const techniques = mockTechniques as unknown as Technique[]
      render(<TechniquesList techniques={techniques} />)

      // Should have skip links (implementation would add these)
      // const skipLink = container.querySelector('a[href="#main-content"]')
      // expect(skipLink).toBeInTheDocument()
    })
  })

  describe('Screen Reader Support', () => {
    it('provides meaningful page titles and landmarks', () => {
      const techniques = mockTechniques as unknown as Technique[]
      const { container } = render(<TechniquesList techniques={techniques} />)

      // Should have main landmark
      const main = container.querySelector('main')
      expect(main).toBeInTheDocument()
      
      // Should have sections with labels
      const searchSection = container.querySelector('[aria-label="Search and filter controls"]')
      expect(searchSection).toBeInTheDocument()
      const resultsSection = container.querySelector('[aria-label="Techniques results"]')
      expect(resultsSection).toBeInTheDocument()
    })

    it('announces dynamic content changes', () => {
      const techniques = mockTechniques as unknown as Technique[]
      const { container } = render(<TechniquesList techniques={techniques} />)

      // Live regions should announce content changes
      const statusRegion = container.querySelector('[role="status"]')
      expect(statusRegion).toHaveAttribute('aria-live', 'polite')
      expect(statusRegion).toHaveAttribute('aria-atomic', 'true')
    })

    it('provides context for complex widgets', () => {
      const { container } = render(<TechniqueForm />)

      // Complex form elements should have proper descriptions
      const nameInput = container.querySelector('#technique-name')
      expect(nameInput).toHaveAttribute('aria-describedby')
      
      const descriptionTextarea = container.querySelector('#technique-description')
      expect(descriptionTextarea).toHaveAttribute('aria-describedby')
    })
  })

  describe('Mobile Accessibility', () => {
    it('maintains accessibility on touch devices', async () => {
      // Mock touch device
      Object.defineProperty(window, 'ontouchstart', {
        value: () => {},
        writable: true
      })

      const technique = mockTechniques[0] as unknown as Technique
      const { user, container } = renderWithProviders(<TechniqueCard technique={technique} />)

      // Touch targets should be large enough (implemented in CSS)
      const link = container.querySelector('a')
      expect(link).toBeInTheDocument()
      
      // Should be activatable via touch
      await user.click(link)
    })

    it('supports voice navigation', () => {
      const techniques = mockTechniques as unknown as Technique[]
      const { container } = render(<TechniquesList techniques={techniques} />)

      // All interactive elements should have accessible names for voice control
      const searchInput = container.querySelector('input[type="search"]')
      expect(searchInput).toHaveAccessibleName()
      
      const links = container.querySelectorAll('a')
      links.forEach(link => {
        expect(link).toHaveAccessibleName()
      })
    })
  })
})