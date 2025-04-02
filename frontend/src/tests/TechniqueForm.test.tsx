import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import TechniqueForm from '@/components/technique/TechniqueForm';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';

// Mock the next/navigation
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

// Mock API hooks with more complete mock data
jest.mock('@/lib/api/hooks', () => ({
  useCreateTechnique: () => ({ 
    mutateAsync: jest.fn().mockResolvedValue({ id: 123 }), 
    isPending: false 
  }),
  useUpdateTechnique: () => ({ 
    mutateAsync: jest.fn().mockResolvedValue({ id: 456 }), 
    isPending: false 
  }),
  useAssuranceGoals: () => ({ 
    data: { 
      results: [
        { id: 1, name: 'Accuracy' },
        { id: 2, name: 'Fairness' },
        { id: 3, name: 'Safety' }
      ] 
    }, 
    isLoading: false 
  }),
  useCategories: () => ({ 
    data: { 
      results: [
        { id: 1, name: 'Testing', assurance_goal: 1 },
        { id: 2, name: 'Monitoring', assurance_goal: 1 },
        { id: 3, name: 'Bias Detection', assurance_goal: 2 }
      ] 
    }, 
    isLoading: false 
  }),
  useSubCategories: () => ({ 
    data: { 
      results: [
        { id: 1, name: 'Unit Testing', category: 1 },
        { id: 2, name: 'Integration Testing', category: 1 },
        { id: 3, name: 'Real-time Monitoring', category: 2 }
      ] 
    }, 
    isLoading: false 
  }),
  useTags: () => ({ 
    data: { 
      results: [
        { id: 1, name: 'ML' },
        { id: 2, name: 'NLP' },
        { id: 3, name: 'Computer Vision' }
      ] 
    }, 
    isLoading: false 
  }),
  useResourceTypes: () => ({ 
    data: { 
      results: [
        { id: 1, name: 'Paper' },
        { id: 2, name: 'Code Repository' },
        { id: 3, name: 'Documentation' }
      ] 
    }, 
    isLoading: false 
  }),
  useTechniqueDetail: (id) => ({ 
    data: id ? {
      id: id,
      name: 'Test Technique',
      description: 'Test Description',
      model_dependency: 'Model-Agnostic',
      assurance_goals: [{ id: 1, name: 'Accuracy' }],
      categories: [{ id: 1, name: 'Testing' }],
      subcategories: [],
      tags: [],
      attribute_values: [],
      example_use_cases: [{ description: 'Example use case', assurance_goal: 1 }],
      limitations: [{ description: 'Limitation example' }],
      resources: [{ resource_type: 1, title: 'Resource', url: 'https://example.com', description: 'Resource Description' }],
    } : null, 
    isLoading: false 
  }),
}));

// Mock API error hook
jest.mock('@/lib/hooks/useApiError', () => ({
  useApiError: () => ({ 
    error: null, 
    handleError: jest.fn() 
  }),
}));

describe('TechniqueForm', () => {
  let queryClient: QueryClient;
  let user: ReturnType<typeof userEvent.setup>;
  const pushMock = jest.fn();
  const backMock = jest.fn();

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });

    user = userEvent.setup();

    // Setup router mock
    (useRouter as jest.Mock).mockImplementation(() => ({
      push: pushMock,
      back: backMock,
    }));
  });

  afterEach(() => {
    jest.clearAllMocks();
    queryClient.clear();
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
    
    // Check that the form is populated with the existing technique data
    expect(screen.getByLabelText(/Technique Name/i)).toHaveValue('Test Technique');
    expect(screen.getByLabelText(/Description/i)).toHaveValue('Test Description');
  });

  it('successfully submits a new technique', async () => {
    const createTechniqueMock = require('@/lib/api/hooks').useCreateTechnique().mutateAsync;

    render(
      <QueryClientProvider client={queryClient}>
        <TechniqueForm />
      </QueryClientProvider>
    );

    // Fill out the basic required fields
    await user.type(screen.getByLabelText(/Technique Name/i), 'New Test Technique');
    await user.type(screen.getByLabelText(/Description/i), 'New test description');
    
    // Navigate to the Classification tab
    await user.click(screen.getByRole('tab', { name: /Classification/i }));
    
    // Select an assurance goal (multi-select)
    const assuranceGoalSelect = screen.getByLabelText(/Assurance Goals/i);
    await user.selectOptions(assuranceGoalSelect, ['1']); // Select 'Accuracy'
    
    // Select a category
    const categorySelect = screen.getByLabelText(/Categories/i);
    await user.selectOptions(categorySelect, ['1']); // Select 'Testing'
    
    // Submit the form
    await user.click(screen.getByText('Create Technique'));
    
    // Wait for the submission to complete
    await waitFor(() => {
      expect(createTechniqueMock).toHaveBeenCalled();
      expect(pushMock).toHaveBeenCalledWith('/techniques/123');
    });
  });

  it('successfully updates an existing technique', async () => {
    const updateTechniqueMock = require('@/lib/api/hooks').useUpdateTechnique().mutateAsync;

    render(
      <QueryClientProvider client={queryClient}>
        <TechniqueForm id={456} isEditMode={true} />
      </QueryClientProvider>
    );

    // Edit the name field
    const nameInput = screen.getByLabelText(/Technique Name/i);
    await user.clear(nameInput);
    await user.type(nameInput, 'Updated Test Technique');
    
    // Submit the form
    await user.click(screen.getByText('Update Technique'));
    
    // Wait for the submission to complete
    await waitFor(() => {
      expect(updateTechniqueMock).toHaveBeenCalled();
      expect(pushMock).toHaveBeenCalledWith('/techniques/456');
    });
  });

  it('adds and removes dynamic fields - use cases', async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <TechniqueForm />
      </QueryClientProvider>
    );

    // Navigate to the Examples & Limitations tab
    await user.click(screen.getByRole('tab', { name: /Examples & Limitations/i }));
    
    // The form should start with one empty use case
    expect(screen.getByText('Example 1')).toBeInTheDocument();
    
    // Add a new use case
    await user.click(screen.getByText('Add Use Case'));
    
    // Now there should be two use cases
    expect(screen.getByText('Example 1')).toBeInTheDocument();
    expect(screen.getByText('Example 2')).toBeInTheDocument();
    
    // Fill out the second use case
    const useCaseInputs = screen.getAllByLabelText('Description');
    await user.type(useCaseInputs[1], 'New test use case');
    
    // Remove the first use case
    const removeButtons = screen.getAllByRole('button', { name: '' }); // Trash2 icon buttons have no accessible name
    await user.click(removeButtons[0]);
    
    // Now there should only be one use case (the second one)
    expect(screen.queryByText('Example 1')).toBeInTheDocument();
    expect(screen.queryByText('Example 2')).not.toBeInTheDocument();
  });

  it('shows validation errors when submitting invalid data', async () => {  
    render(
      <QueryClientProvider client={queryClient}>
        <TechniqueForm />
      </QueryClientProvider>
    );
    
    // Try to submit the form without filling required fields
    await user.click(screen.getByText('Create Technique'));
    
    // Check that validation errors are displayed
    await waitFor(() => {
      expect(screen.getByText('Name is required')).toBeInTheDocument();
      expect(screen.getByText('Description is required')).toBeInTheDocument();
    });
    
    // Navigate to the Classification tab to check those errors
    await user.click(screen.getByRole('tab', { name: /Classification/i }));
    
    await waitFor(() => {
      expect(screen.getByText('At least one assurance goal is required')).toBeInTheDocument();
      expect(screen.getByText('At least one category is required')).toBeInTheDocument();
    });
  });

  it('displays loading state when submitting', async () => {
    // Mock the isPending state to be true
    jest.spyOn(require('@/lib/api/hooks'), 'useCreateTechnique').mockImplementation(() => ({
      mutateAsync: jest.fn(() => new Promise(resolve => setTimeout(() => resolve({ id: 123 }), 100))),
      isPending: true
    }));
    
    render(
      <QueryClientProvider client={queryClient}>
        <TechniqueForm />
      </QueryClientProvider>
    );

    // Fill out the basic required fields
    await user.type(screen.getByLabelText(/Technique Name/i), 'New Test Technique');
    await user.type(screen.getByLabelText(/Description/i), 'New test description');
    
    // Navigate to the Classification tab
    await user.click(screen.getByRole('tab', { name: /Classification/i }));
    
    // Select an assurance goal (multi-select)
    const assuranceGoalSelect = screen.getByLabelText(/Assurance Goals/i);
    await user.selectOptions(assuranceGoalSelect, ['1']); // Select 'Accuracy'
    
    // Select a category
    const categorySelect = screen.getByLabelText(/Categories/i);
    await user.selectOptions(categorySelect, ['1']); // Select 'Testing'
    
    // Submit the form
    await user.click(screen.getByText('Create Technique'));
    
    // Check for loading state
    await waitFor(() => {
      expect(screen.getByText('Creating...')).toBeInTheDocument();
    });
  });

  it('handles browser back navigation', async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <TechniqueForm />
      </QueryClientProvider>
    );

    // Click the back button
    await user.click(screen.getByText('Back'));
    
    // Check that router.back was called
    expect(backMock).toHaveBeenCalled();
  });
});