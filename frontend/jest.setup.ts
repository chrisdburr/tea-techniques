import '@testing-library/jest-dom';

// MSW integration is commented out due to module resolution issues
// We'll use the manual mocks in the test files for now and fix the MSW setup later
// Once the module resolution issue with msw/node is resolved

// Mock setup
beforeAll(() => {
  console.log('Setting up test environment');
});

// Clean up after each test
afterEach(() => {
  console.log('Cleaning up after test');
});

// Final cleanup
afterAll(() => {
  console.log('Test suite completed');
});