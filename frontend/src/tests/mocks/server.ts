import { setupServer } from 'msw/node'
import { handlers } from './handlers'

// Setup MSW server for Node.js testing environment
export const server = setupServer(...handlers)

// Enable the server before all tests
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))

// Reset handlers after each test
afterEach(() => server.resetHandlers())

// Disable the server after all tests
afterAll(() => server.close())