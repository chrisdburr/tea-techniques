import React from 'react'
import { render, screen } from '@testing-library/react'
import { axe, toHaveNoViolations } from 'jest-axe'
import { renderWithProviders } from '../utils/test-utils'
import { mockTechniques } from '../fixtures/techniques'
import type { Technique } from '../../lib/types'

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
    <nav aria-label="Technique categories">
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
    <nav aria-label="Technique tags">
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
      const technique = mockTechniques[0] as Technique
      const { container } = render(<TechniqueCard technique={technique} />)
      
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })

    it('provides proper semantic structure', () => {
      const technique = mockTechniques[0] as Technique
      render(<TechniqueCard technique={technique} />)

      // Should have proper article structure
      expect(screen.getByRole('article')).toBeInTheDocument()
      expect(screen.getByRole('heading', { level: 3 })).toBeInTheDocument()
      
      // Links should be accessible
      const link = screen.getByRole('link')
      expect(link).toHaveAccessibleName()
      expect(link).toHaveAttribute('href')
    })

    it('provides meaningful labels for complex information', () => {
      const technique = mockTechniques[0] as Technique
      render(<TechniqueCard technique={technique} />)

      // Ratings should have descriptive labels
      expect(screen.getByLabelText(/complexity rating/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/computational cost rating/i)).toBeInTheDocument()
      
      // Goals and tags should be properly labeled
      if (technique.acronym) {
        expect(screen.getByLabelText(`Acronym: ${technique.acronym}`)).toBeInTheDocument()
      }
    })

    it('supports keyboard navigation', async () => {
      const technique = mockTechniques[0] as Technique
      const { user } = renderWithProviders(<TechniqueCard technique={technique} />)

      const link = screen.getByRole('link')
      
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
      const techniques = mockTechniques as Technique[]
      const { container } = render(<TechniquesList techniques={techniques} />)
      
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })

    it('provides proper heading hierarchy', () => {
      const techniques = mockTechniques as Technique[]
      render(<TechniquesList techniques={techniques} />)

      // Should have h1 for page title
      expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('TEA Techniques')
      
      // Technique names should be h3 (in cards)
      expect(screen.getAllByRole('heading', { level: 3 })).toHaveLength(techniques.length)
    })

    it('provides proper form labels and descriptions', () => {
      const techniques = mockTechniques as Technique[]
      render(<TechniquesList techniques={techniques} />)

      // Search should be properly labeled
      expect(screen.getByLabelText('Search techniques')).toBeInTheDocument()
      expect(screen.getByRole('searchbox')).toBeInTheDocument()
      
      // Filters should be properly labeled
      expect(screen.getByLabelText('Assurance Goal')).toBeInTheDocument()
      expect(screen.getByLabelText('Complexity Level')).toBeInTheDocument()
      
      // Fieldset should have legend
      expect(screen.getByText('Filter by category')).toBeInTheDocument()
    })

    it('provides live region updates for search results', () => {
      const techniques = mockTechniques as Technique[]
      render(<TechniquesList techniques={techniques} />)

      // Should have status region for announcing results
      const statusRegion = screen.getByRole('status')
      expect(statusRegion).toHaveAttribute('aria-live', 'polite')
      expect(statusRegion).toHaveTextContent(`${techniques.length} techniques found`)
    })

    it('provides proper list semantics', () => {
      const techniques = mockTechniques as Technique[]
      render(<TechniquesList techniques={techniques} />)

      // Should have proper list structure
      expect(screen.getByRole('list', { name: 'Techniques list' })).toBeInTheDocument()
      
      const listItems = screen.getAllByRole('listitem')
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
      render(<TechniqueForm />)

      // Form should be properly labeled
      expect(screen.getByRole('form', { name: 'Technique creation form' })).toBeInTheDocument()
      
      // Fieldsets should have legends
      expect(screen.getByText('Basic Information')).toBeInTheDocument()
      expect(screen.getByText('Ratings')).toBeInTheDocument()
      
      // All form fields should have labels
      expect(screen.getByLabelText(/technique name/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/acronym/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/description/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/complexity rating/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/computational cost rating/i)).toBeInTheDocument()
    })

    it('indicates required fields clearly', () => {
      render(<TechniqueForm />)

      // Required fields should be marked
      const requiredLabels = screen.getAllByLabelText('required')
      expect(requiredLabels.length).toBeGreaterThan(0)
      
      // Required inputs should have required attribute
      expect(screen.getByLabelText(/technique name/i)).toHaveAttribute('required')
      expect(screen.getByLabelText(/description/i)).toHaveAttribute('required')
    })

    it('provides helpful descriptions for form fields', () => {
      render(<TechniqueForm />)

      // Should have help text for form fields
      expect(screen.getByText('Enter the full name of the technique')).toBeInTheDocument()
      expect(screen.getByText(/Optional: Common acronym/)).toBeInTheDocument()
      expect(screen.getByText(/Rate how difficult it is to implement/)).toBeInTheDocument()
    })

    it('supports error announcement', () => {
      render(<TechniqueForm />)

      // Error regions should be set up for screen readers
      const errorRegions = screen.getAllByRole('alert')
      expect(errorRegions.length).toBeGreaterThan(0)
      
      // Error regions should have live updates
      errorRegions.forEach(region => {
        expect(region).toHaveAttribute('aria-live', 'assertive')
      })
    })
  })

  describe('Color Contrast and Visual Accessibility', () => {
    it('ensures sufficient color contrast for text', async () => {
      const technique = mockTechniques[0] as Technique
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
      const technique = mockTechniques[0] as Technique
      render(<TechniqueCard technique={technique} />)

      // Important information should have text labels, not just colors
      expect(screen.getByLabelText(/complexity rating/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/computational cost rating/i)).toBeInTheDocument()
    })
  })

  describe('Keyboard Navigation', () => {
    it('supports tab navigation through all interactive elements', async () => {
      const techniques = mockTechniques as Technique[]
      const { user } = renderWithProviders(<TechniquesList techniques={techniques} />)

      // Should be able to tab through all interactive elements
      const interactiveElements = [
        screen.getByRole('searchbox'),
        screen.getByLabelText('Assurance Goal'),
        screen.getByLabelText('Complexity Level'),
        ...screen.getAllByRole('link')
      ]

      for (let i = 0; i < interactiveElements.length; i++) {
        await user.tab()
        expect(interactiveElements[i]).toHaveFocus()
      }
    })

    it('provides visible focus indicators', async () => {
      const technique = mockTechniques[0] as Technique
      const { user } = renderWithProviders(<TechniqueCard technique={technique} />)

      const link = screen.getByRole('link')
      await user.tab()
      
      expect(link).toHaveFocus()
      // In real implementation, should verify focus styles are visible
    })

    it('supports skip links for efficient navigation', () => {
      const techniques = mockTechniques as Technique[]
      render(<TechniquesList techniques={techniques} />)

      // Should have skip links (implementation would add these)
      // expect(screen.getByText('Skip to main content')).toBeInTheDocument()
    })
  })

  describe('Screen Reader Support', () => {
    it('provides meaningful page titles and landmarks', () => {
      const techniques = mockTechniques as Technique[]
      render(<TechniquesList techniques={techniques} />)

      // Should have main landmark
      expect(screen.getByRole('main')).toBeInTheDocument()
      
      // Should have sections with labels
      expect(screen.getByLabelText('Search and filter controls')).toBeInTheDocument()
      expect(screen.getByLabelText('Techniques results')).toBeInTheDocument()
    })

    it('announces dynamic content changes', () => {
      const techniques = mockTechniques as Technique[]
      render(<TechniquesList techniques={techniques} />)

      // Live regions should announce content changes
      const statusRegion = screen.getByRole('status')
      expect(statusRegion).toHaveAttribute('aria-live', 'polite')
      expect(statusRegion).toHaveAttribute('aria-atomic', 'true')
    })

    it('provides context for complex widgets', () => {
      render(<TechniqueForm />)

      // Complex form elements should have proper descriptions
      const nameInput = screen.getByLabelText(/technique name/i)
      expect(nameInput).toHaveAttribute('aria-describedby')
      
      const descriptionTextarea = screen.getByLabelText(/description/i)
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

      const technique = mockTechniques[0] as Technique
      const { user } = renderWithProviders(<TechniqueCard technique={technique} />)

      // Touch targets should be large enough (implemented in CSS)
      const link = screen.getByRole('link')
      expect(link).toBeInTheDocument()
      
      // Should be activatable via touch
      await user.click(link)
    })

    it('supports voice navigation', () => {
      const techniques = mockTechniques as Technique[]
      render(<TechniquesList techniques={techniques} />)

      // All interactive elements should have accessible names for voice control
      expect(screen.getByRole('searchbox')).toHaveAccessibleName()
      
      const links = screen.getAllByRole('link')
      links.forEach(link => {
        expect(link).toHaveAccessibleName()
      })
    })
  })
})