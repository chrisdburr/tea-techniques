import '@testing-library/jest-dom';

// MSW setup is disabled temporarily to allow tests to run
// We're manually mocking all API calls in our tests

// Mock handlers that would be provided by MSW
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