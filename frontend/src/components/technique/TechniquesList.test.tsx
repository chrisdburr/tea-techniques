import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import TechniquesList from './TechniquesList';
import ReactQueryProvider from '@/providers/query-provider';

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter() {
    return {
      push: jest.fn(),
      back: jest.fn(),
      forward: jest.fn(),
    };
  },
}));

describe('TechniquesList', () => {
  test('renders techniques list with mocked data', async () => {
    render(
      <ReactQueryProvider>
        <TechniquesList />
      </ReactQueryProvider>
    );

    // Initially should show loading state
    expect(screen.getByText(/loading/i)).toBeInTheDocument();

    // Wait for data to load
    await waitFor(() => {
      expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
    });

    // Check if mock data appears
    expect(screen.getByText('Test Technique 1')).toBeInTheDocument();
    expect(screen.getByText('Test Technique 2')).toBeInTheDocument();
    
    // Check if descriptions are displayed
    expect(screen.getByText('Description for test technique 1')).toBeInTheDocument();
    expect(screen.getByText('Description for test technique 2')).toBeInTheDocument();
  });
});