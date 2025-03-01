import { renderHook, waitFor } from '@testing-library/react';
import { useQueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactNode } from 'react';
import { useTechniques, useAddTechnique, useUpdateTechnique } from './useTechniques';
import ReactQueryProvider from '@/providers/query-provider';

// Wrapper with React Query Provider
const wrapper = ({ children }: { children: ReactNode }) => (
  <ReactQueryProvider>{children}</ReactQueryProvider>
);

describe('useTechniques', () => {
  test('should fetch techniques successfully', async () => {
    const { result } = renderHook(() => useTechniques(), { wrapper });

    // Wait for the query to resolve
    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    // Check data
    expect(result.current.data).toHaveLength(2);
    expect(result.current.data?.[0].name).toBe('Test Technique 1');
    expect(result.current.data?.[1].name).toBe('Test Technique 2');
  });

  test('should add a technique successfully', async () => {
    const { result } = renderHook(() => useAddTechnique(), { wrapper });

    // Trigger the mutation
    result.current.mutate({
      name: 'New Test Technique',
      description: 'Description for new test technique',
      model_dependency: 'Agnostic',
      example_use_case: 'Example use case for new technique'
    });

    // Wait for the mutation to complete
    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    // Should have created a technique with id 3
    expect(result.current.data?.id).toBe(3);
    expect(result.current.data?.name).toBe('New Test Technique');
  });

  test('should update a technique successfully', async () => {
    const { result } = renderHook(() => useUpdateTechnique(), { wrapper });

    // Trigger the mutation to update technique with id 1
    result.current.mutate({
      id: 1,
      name: 'Updated Test Technique',
      description: 'Updated description'
    });

    // Wait for the mutation to complete
    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    // Check result
    expect(result.current.data?.id).toBe(1);
    expect(result.current.data?.name).toBe('Updated Test Technique');
    expect(result.current.data?.description).toBe('Updated description');
  });
});