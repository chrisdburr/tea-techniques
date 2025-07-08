import '@testing-library/jest-dom'
import { server } from './mocks/server'

// Setup MSW
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

// Mock Next.js router
const mockPush = jest.fn()
const mockReplace = jest.fn()
const mockPrefetch = jest.fn()
const mockBack = jest.fn()
const mockPathname = jest.fn(() => '/')

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: mockReplace,
    prefetch: mockPrefetch,
    back: mockBack,
  }),
  usePathname: mockPathname,
  useSearchParams: () => new URLSearchParams(),
  useParams: () => ({}),
}))

// Mock window.matchMedia for responsive testing
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // deprecated
    removeListener: jest.fn(), // deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
})

// Mock ResizeObserver
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}))

// Mock IntersectionObserver
global.IntersectionObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}))

// Console error/warning suppression for tests
const originalError = console.error
beforeAll(() => {
  console.error = (...args: any[]) => {
    if (
      typeof args[0] === 'string' &&
      args[0].includes('Warning: ReactDOM.render is deprecated')
    ) {
      return
    }
    originalError.call(console, ...args)
  }
})

afterAll(() => {
  console.error = originalError
})

// Performance testing utilities
global.performance = global.performance || {
  now: () => Date.now(),
  mark: jest.fn(),
  measure: jest.fn(),
}

// Setup for accessibility testing
import { configureAxe } from 'jest-axe'

const axe = configureAxe({
  rules: {
    // Disable color contrast rule for non-production builds
    'color-contrast': { enabled: process.env.NODE_ENV === 'production' },
    // Allow more flexible landmark rules in tests
    'landmark-one-main': { enabled: false },
    'page-has-heading-one': { enabled: false },
    // Focus management rules that may not apply in test environment
    'focus-order-semantics': { enabled: false },
  },
})

export { axe }

// Global test timeout
jest.setTimeout(10000) // 10 seconds for async operations

// Clean up after each test
afterEach(() => {
  jest.clearAllMocks()
  mockPush.mockClear()
  mockReplace.mockClear()
  mockPrefetch.mockClear()
  mockBack.mockClear()
  mockPathname.mockClear()
})