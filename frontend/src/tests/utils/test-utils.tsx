import React, { ReactElement } from 'react'
import { render, RenderOptions, RenderResult, cleanup } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import userEvent from '@testing-library/user-event'
import { vi, afterEach } from 'vitest'

// Test providers wrapper
interface TestProvidersProps {
  children: React.ReactNode
  queryClient?: QueryClient
}

const TestProviders: React.FC<TestProvidersProps> = ({ 
  children, 
  queryClient 
}) => {
  // Create a fresh QueryClient for each test to avoid state pollution
  const testQueryClient = queryClient || new QueryClient({
    defaultOptions: {
      queries: {
        retry: false, // Don't retry failed requests in tests
        gcTime: 0, // Don't cache query results
        staleTime: 0, // Always refetch
      },
      mutations: {
        retry: false,
      },
    },
  })

  return (
    <QueryClientProvider client={testQueryClient}>
      {children}
    </QueryClientProvider>
  )
}

// Custom render function that includes providers
interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  queryClient?: QueryClient
  initialRoute?: string
}

export const renderWithProviders = (
  ui: ReactElement,
  options: CustomRenderOptions = {}
): RenderResult & { user: ReturnType<typeof userEvent.setup> } => {
  const { queryClient, initialRoute, ...renderOptions } = options

  // Mock router navigation if initial route is provided
  if (initialRoute) {
    vi.mocked(require('next/navigation').usePathname).mockReturnValue(initialRoute)
  }

  const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <TestProviders queryClient={queryClient}>
      {children}
    </TestProviders>
  )

  const renderResult = render(ui, {
    wrapper: Wrapper,
    ...renderOptions,
  })

  // Setup user-event for better interaction testing
  const user = userEvent.setup()

  // Return enhanced result with cleanup utility
  const result = {
    ...renderResult,
    user,
    cleanup: () => cleanup(),
  }

  return result
}

// Specialized render for testing components in isolation
export const renderComponent = (
  component: ReactElement,
  options: CustomRenderOptions = {}
) => {
  return renderWithProviders(component, options)
}

// Helper for testing error boundaries
export const renderWithErrorBoundary = (
  ui: ReactElement,
  options: CustomRenderOptions = {}
) => {
  const ErrorBoundary: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [hasError, setHasError] = React.useState(false)
    const [error, setError] = React.useState<Error | null>(null)

    React.useEffect(() => {
      const errorHandler = (event: ErrorEvent) => {
        setHasError(true)
        setError(new Error(event.message))
      }

      window.addEventListener('error', errorHandler)
      return () => window.removeEventListener('error', errorHandler)
    }, [])

    if (hasError) {
      return <div data-testid="error-boundary">Error: {error?.message}</div>
    }

    return <>{children}</>
  }

  const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <ErrorBoundary>
      <TestProviders queryClient={options.queryClient}>
        {children}
      </TestProviders>
    </ErrorBoundary>
  )

  return render(ui, { wrapper: Wrapper, ...options })
}

// API testing utilities for minimal mocking approach
export const createMockFetch = () => {
  const mockFetch = vi.fn()
  global.fetch = mockFetch
  return mockFetch
}

export const mockApiResponse = <T = unknown>(data: T, status = 200) => {
  return Promise.resolve({
    ok: status >= 200 && status < 300,
    status,
    statusText: status === 200 ? 'OK' : 'Error',
    json: () => Promise.resolve(data),
    text: () => Promise.resolve(JSON.stringify(data)),
    headers: new Headers({ 'content-type': 'application/json' }),
  } as Response)
}

export const mockApiError = (message: string, status = 500) => {
  return Promise.resolve({
    ok: false,
    status,
    statusText: 'Error',
    json: () => Promise.resolve({ error: message }),
    text: () => Promise.resolve(JSON.stringify({ error: message })),
    headers: new Headers({ 'content-type': 'application/json' }),
  } as Response)
}

// Helper for testing async components
export const waitForLoadingToFinish = async () => {
  // Wait for any loading states to resolve
  await new Promise(resolve => setTimeout(resolve, 0))
}

// Test data validation helpers
export const expectToMatchTechniqueShape = (technique: unknown) => {
  expect(technique).toMatchObject({
    slug: expect.any(String),
    name: expect.any(String),
    acronym: expect.any(String),
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
}

export const expectToMatchAssuranceGoalShape = (goal: unknown) => {
  expect(goal).toMatchObject({
    id: expect.any(Number),
    name: expect.any(String),
    description: expect.any(String),
  })
}

// Performance testing helpers
export const measureRenderTime = async (renderFn: () => RenderResult) => {
  const start = performance.now()
  const result = renderFn()
  const end = performance.now()
  
  return {
    renderTime: end - start,
    result,
  }
}

// Accessibility testing setup
export const setupAccessibilityTesting = () => {
  // Configure jest-axe for better accessibility testing
  const { configureAxe } = require('jest-axe')
  
  return configureAxe({
    rules: {
      // Disable color contrast rule for non-production builds
      'color-contrast': { enabled: process.env.NODE_ENV === 'production' },
      // Allow landmark rules to be more flexible in tests
      'landmark-one-main': { enabled: false },
      'page-has-heading-one': { enabled: false },
    },
  })
}

// Form testing utilities
export const fillForm = async (
  user: ReturnType<typeof userEvent.setup>,
  formData: Record<string, string>
) => {
  for (const [fieldName, value] of Object.entries(formData)) {
    const field = document.querySelector(`[name="${fieldName}"]`) as HTMLElement
    if (field) {
      await user.clear(field)
      await user.type(field, value)
    }
  }
}

export const submitForm = async (
  user: ReturnType<typeof userEvent.setup>,
  formSelector = 'form'
) => {
  const form = document.querySelector(formSelector) as HTMLElement
  const submitButton = form?.querySelector('[type="submit"]') as HTMLElement
  
  if (submitButton) {
    await user.click(submitButton)
  } else {
    // Fallback to form submission
    await user.keyboard('{Enter}')
  }
}

// Route testing utilities
export const mockRouteParams = (params: Record<string, string>) => {
  const mockUseParams = vi.fn().mockReturnValue(params)
  vi.mock('next/navigation', async () => {
    const actual = await vi.importActual('next/navigation')
    return {
      ...actual,
      useParams: mockUseParams,
    }
  })
  return mockUseParams
}

export const mockSearchParams = (params: Record<string, string>) => {
  const searchParams = new URLSearchParams(params)
  const mockUseSearchParams = vi.fn().mockReturnValue(searchParams)
  
  vi.mock('next/navigation', async () => {
    const actual = await vi.importActual('next/navigation')
    return {
      ...actual,
      useSearchParams: mockUseSearchParams,
    }
  })
  
  return mockUseSearchParams
}

// Re-export commonly used testing utilities
export { screen, waitFor, within, fireEvent } from '@testing-library/react'
export { vi } from 'vitest'
export { default as userEvent } from '@testing-library/user-event'

// Default export for convenient importing
export default renderWithProviders