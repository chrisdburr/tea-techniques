import { render, screen } from '@testing-library/react';
import TechniqueForm from '@/components/technique/TechniqueForm';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';

// Mock the next/navigation
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

// Mock the API hooks
jest.mock('@/lib/api/hooks', () => ({
  useCreateTechnique: () => ({ mutateAsync: jest.fn(), isPending: false }),
  useUpdateTechnique: () => ({ mutateAsync: jest.fn(), isPending: false }),
  useAssuranceGoals: () => ({ data: { results: [] }, isLoading: false }),
  useCategories: () => ({ data: { results: [] }, isLoading: false }),
  useSubCategories: () => ({ data: { results: [] }, isLoading: false }),
  useTags: () => ({ data: { results: [] }, isLoading: false }),
  useResourceTypes: () => ({ data: { results: [] }, isLoading: false }),
  useTechniqueDetail: () => ({ data: null, isLoading: false }),
}));

// Mock API error hook
jest.mock('@/lib/hooks/useApiError', () => ({
  useApiError: () => ({ error: null, handleError: jest.fn() }),
}));

describe('TechniqueForm', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });

    // Setup router mock
    (useRouter as jest.Mock).mockImplementation(() => ({
      push: jest.fn(),
      back: jest.fn(),
    }));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders the form for creating a new technique', () => {
    render(
      <QueryClientProvider client={queryClient}>
        <TechniqueForm />
      </QueryClientProvider>
    );

    // Check that the form title is rendered
    expect(screen.getByText('Create New Technique')).toBeInTheDocument();
    
    // Check that required fields are present
    expect(screen.getByLabelText(/Technique Name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Description/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Model Dependency/i)).toBeInTheDocument();
    
    // Check that submit button is present
    expect(screen.getByText('Create Technique')).toBeInTheDocument();
  });

  it('renders the form for editing an existing technique', () => {
    render(
      <QueryClientProvider client={queryClient}>
        <TechniqueForm id={1} isEditMode={true} />
      </QueryClientProvider>
    );

    // Check that the form title is for editing
    expect(screen.getByText('Edit Technique')).toBeInTheDocument();
    
    // Check that submit button is for updating
    expect(screen.getByText('Update Technique')).toBeInTheDocument();
  });
});