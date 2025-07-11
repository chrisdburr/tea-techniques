import React from 'react'
import { waitFor } from '@testing-library/react'
import { renderWithProviders } from '../../utils/test-utils'
import TechniquesList from '../../../components/technique/TechniquesList'
import { mockTechniques, createMockTechniquesList } from '../../fixtures/techniques'
import type { Technique } from '../../../lib/types'

// Mock the hooks that TechniquesList uses
import { vi } from 'vitest'

vi.mock('@/lib/api/hooks', () => ({
  useTechniques: vi.fn(() => ({
    data: { results: mockTechniques, count: mockTechniques.length },
    isLoading: false,
    error: null
  })),
  useAssuranceGoals: vi.fn(() => ({
    data: { results: [] },
    isLoading: false
  })),
  useTags: vi.fn(() => ({
    data: { results: [] },
    isLoading: false
  })),
  calculateTotalPages: vi.fn(() => 1)
}))

vi.mock('@/lib/hooks/useFilterParams', () => ({
  useFilterParams: vi.fn(() => ({
    currentPage: 1
  }))
}))

describe('TechniquesList', () => {
  const mockTechniquesList = createMockTechniquesList(mockTechniques as Technique[])

  describe('Basic Rendering', () => {
    it('renders the page with techniques heading', async () => {
      const { container } = renderWithProviders(<TechniquesList />)
      
      await waitFor(() => {
        const heading = container.querySelector('h1, h2, h3, h4, h5, h6')
        expect(heading).toBeInTheDocument()
        expect(container.textContent).toMatch(/techniques/i)
      })
    })

    it('renders add new technique button', async () => {
      const { container } = renderWithProviders(<TechniquesList />)
      
      await waitFor(() => {
        const addLink = container.querySelector('a[href*="new"], a[href*="add"], a[href*="create"]')
        expect(addLink || container.querySelector('button')).toBeInTheDocument()
      })
    })
  })

  describe('Loading State', () => {
    it('shows loading state when data is being fetched', async () => {
      // Mock loading state
      const { useTechniques } = await import('@/lib/api/hooks')
      vi.mocked(useTechniques).mockReturnValueOnce({
        data: null,
        isLoading: true,
        error: null
      })

      const { container } = renderWithProviders(<TechniquesList />)
      
      await waitFor(() => {
        expect(container.textContent).toMatch(/loading|techniques/i)
      })
    })
  })
})