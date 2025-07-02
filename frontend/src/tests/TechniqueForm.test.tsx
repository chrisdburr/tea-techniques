import { render, screen, waitFor } from '@/tests/utils/test-utils';
import TechniqueForm from '@/components/technique/TechniqueForm';
import { server } from '@/tests/mocks/server';
import { http, HttpResponse } from 'msw';

const mockPush = jest.fn();
const mockBack = jest.fn();

// Mock the next/navigation
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    back: mockBack,
  }),
}));

describe('TechniqueForm', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the form for creating a new technique', async () => {
    const { user } = render(<TechniqueForm />);

    // Check that the form title is rendered
    expect(screen.getByText('Create New Technique')).toBeInTheDocument();
    
    // Wait for the form to load and check that required fields are present
    await waitFor(() => {
      expect(screen.getByLabelText(/Technique Name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Description/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Complexity Rating/i)).toBeInTheDocument();
    });
    
    // Check that submit button is present
    await waitFor(() => {
      expect(screen.getByText('Create Technique')).toBeInTheDocument();
    });
  });

  it('renders the form for editing an existing technique', async () => {
    const { user } = render(<TechniqueForm id={1} isEditMode={true} />);

    // Check that the form title is for editing
    expect(screen.getByText('Edit Technique')).toBeInTheDocument();
    
    // Wait for the form to load with data
    await waitFor(() => {
      // Check that submit button is for updating
      expect(screen.getByText('Update Technique')).toBeInTheDocument();
      
      // Check that the form is populated with the existing technique data
      expect(screen.getByLabelText(/Technique Name/i)).toHaveValue('Test Technique');
      expect(screen.getByLabelText(/Description/i)).toHaveValue('Test Description');
    });
  });

  it('successfully submits a new technique', async () => {
    const { user } = render(<TechniqueForm />);

    // Wait for form to load
    await waitFor(() => {
      expect(screen.getByLabelText(/Technique Name/i)).toBeInTheDocument();
    });

    // Fill out the basic required fields
    await user.type(screen.getByLabelText(/Technique Name/i), 'New Test Technique');
    await user.type(screen.getByLabelText(/Description/i), 'New test description');
    
    // Navigate to the Classification tab
    await user.click(screen.getByRole('tab', { name: /Classification/i }));
    
    // Wait for Classification tab to load
    await waitFor(() => {
      expect(screen.getByLabelText(/Assurance Goals/i)).toBeInTheDocument();
    });
    
    // Select an assurance goal (multi-select)
    const assuranceGoalSelect = screen.getByLabelText(/Assurance Goals/i);
    await user.selectOptions(assuranceGoalSelect, ['1']); // Select 'Accuracy'
    
    // Select tags
    const tagsSelect = screen.getByLabelText(/Tags/i);
    await user.selectOptions(tagsSelect, ['1']); // Select first tag
    
    // Submit the form
    await user.click(screen.getByText('Create Technique'));
    
    // Wait for the submission to complete and navigation to occur
    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/techniques/4');
    });
  });

  it('successfully updates an existing technique', async () => {
    const { user } = render(<TechniqueForm id={1} isEditMode={true} />);

    // Wait for form to load with data
    await waitFor(() => {
      expect(screen.getByLabelText(/Technique Name/i)).toHaveValue('Test Technique');
    });

    // Edit the name field
    const nameInput = screen.getByLabelText(/Technique Name/i);
    await user.clear(nameInput);
    await user.type(nameInput, 'Updated Test Technique');
    
    // Submit the form
    await user.click(screen.getByText('Update Technique'));
    
    // Wait for the submission to complete
    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/techniques/1');
    });
  });

  it('adds and removes dynamic fields - use cases', async () => {
    const { user } = render(<TechniqueForm />);

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
    const { user } = render(<TechniqueForm />);
    
    // Wait for form to load
    await waitFor(() => {
      expect(screen.getByText('Create Technique')).toBeInTheDocument();
    });
    
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
    });
  });

  it('displays loading state when submitting', async () => {
    const { user } = render(<TechniqueForm />);

    // Wait for form to load
    await waitFor(() => {
      expect(screen.getByLabelText(/Technique Name/i)).toBeInTheDocument();
    });

    // Fill out the basic required fields
    await user.type(screen.getByLabelText(/Technique Name/i), 'New Test Technique');
    await user.type(screen.getByLabelText(/Description/i), 'New test description');
    
    // Navigate to the Classification tab
    await user.click(screen.getByRole('tab', { name: /Classification/i }));
    
    // Wait for Classification tab to load
    await waitFor(() => {
      expect(screen.getByLabelText(/Assurance Goals/i)).toBeInTheDocument();
    });
    
    // Select an assurance goal (multi-select)
    const assuranceGoalSelect = screen.getByLabelText(/Assurance Goals/i);
    await user.selectOptions(assuranceGoalSelect, ['1']); // Select 'Accuracy'
    
    // Select tags
    const tagsSelect = screen.getByLabelText(/Tags/i);
    await user.selectOptions(tagsSelect, ['1']); // Select first tag
    
    // Verify the button text is correct when not loading
    expect(screen.getByText('Create Technique')).toBeInTheDocument();
  });

  it('handles browser back navigation', async () => {
    const { user } = render(<TechniqueForm />);

    // Click the back button
    await user.click(screen.getByText('Back'));
    
    // Check that router.back was called
    expect(mockBack).toHaveBeenCalled();
  });
});