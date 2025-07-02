import React, { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import userEvent from '@testing-library/user-event';

// Create a custom render function that includes providers
const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        staleTime: 0,
        cacheTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
  });

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};

const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => {
  const user = userEvent.setup();
  
  return {
    user,
    ...render(ui, { wrapper: AllTheProviders, ...options }),
  };
};

export * from '@testing-library/react';
export { customRender as render };

// Mock data factories for consistent test data
export const createMockTechnique = (overrides = {}) => ({
  id: 1,
  name: 'Test Technique',
  description: 'Test Description',
  complexity_rating: 3,
  computational_cost_rating: 2,
  assurance_goals: [
    { id: 1, name: 'Accuracy', description: 'Test goal' }
  ],
  tags: [
    { id: 1, name: 'applicable-models/agnostic' }
  ],
  related_techniques: [],
  resources: [],
  example_use_cases: [],
  limitations: [],
  ...overrides,
});

export const createMockAssuranceGoal = (overrides = {}) => ({
  id: 1,
  name: 'Accuracy',
  description: 'Test goal description',
  ...overrides,
});

export const createMockTag = (overrides = {}) => ({
  id: 1,
  name: 'test-tag',
  ...overrides,
});

export const createMockResourceType = (overrides = {}) => ({
  id: 1,
  name: 'Paper',
  icon: 'paper',
  ...overrides,
});

export const createMockApiResponse = <T>(data: T[], overrides = {}) => ({
  count: data.length,
  next: null,
  previous: null,
  results: data,
  ...overrides,
});

// Utility function to wait for queries to settle
export const waitForQueriesToSettle = async () => {
  // Wait a bit for any pending queries to complete
  await new Promise(resolve => setTimeout(resolve, 100));
};

// Custom Jest matchers for better test assertions
declare global {
  namespace jest {
    interface Matchers<R> {
      toBeInTheDocument(): R;
      toHaveTextContent(text: string): R;
      toHaveValue(value: string | number): R;
      toBeVisible(): R;
      toBeDisabled(): R;
    }
  }
}