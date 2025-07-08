import React from 'react'
import { screen, waitFor } from '@testing-library/react'
import { renderWithProviders } from '../../../utils/test-utils'
import BasicInfoTab from '../../../../components/technique/form/BasicInfoTab'

// Mock the hook since we're testing the component in isolation
const mockFormData = {
  name: '',
  acronym: '',
  description: '',
  complexity_rating: 1,
  computational_cost_rating: 1
}

const mockOnChange = jest.fn()
const mockErrors = {}

describe('BasicInfoTab', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Form Field Rendering', () => {
    it('renders all basic information form fields', () => {
      renderWithProviders(
        <BasicInfoTab 
          formData={mockFormData} 
          onChange={mockOnChange} 
          errors={mockErrors} 
        />
      )

      // Check for form fields
      expect(screen.getByLabelText(/technique name/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/acronym/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/description/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/complexity rating/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/computational cost rating/i)).toBeInTheDocument()
    })

    it('displays current form data values', () => {
      const filledFormData = {
        name: 'Test Technique',
        acronym: 'TT',
        description: 'This is a test technique description',
        complexity_rating: 3,
        computational_cost_rating: 4
      }

      renderWithProviders(
        <BasicInfoTab 
          formData={filledFormData} 
          onChange={mockOnChange} 
          errors={mockErrors} 
        />
      )

      expect(screen.getByDisplayValue('Test Technique')).toBeInTheDocument()
      expect(screen.getByDisplayValue('TT')).toBeInTheDocument()
      expect(screen.getByDisplayValue('This is a test technique description')).toBeInTheDocument()
      expect(screen.getByDisplayValue('3')).toBeInTheDocument()
      expect(screen.getByDisplayValue('4')).toBeInTheDocument()
    })
  })

  describe('Form Interactions', () => {
    it('calls onChange when technique name is updated', async () => {
      const { user } = renderWithProviders(
        <BasicInfoTab 
          formData={mockFormData} 
          onChange={mockOnChange} 
          errors={mockErrors} 
        />
      )

      const nameInput = screen.getByLabelText(/technique name/i)
      await user.type(nameInput, 'New Technique Name')

      await waitFor(() => {
        expect(mockOnChange).toHaveBeenCalledWith({
          ...mockFormData,
          name: 'New Technique Name'
        })
      })
    })

    it('calls onChange when acronym is updated', async () => {
      const { user } = renderWithProviders(
        <BasicInfoTab 
          formData={mockFormData} 
          onChange={mockOnChange} 
          errors={mockErrors} 
        />
      )

      const acronymInput = screen.getByLabelText(/acronym/i)
      await user.type(acronymInput, 'NTN')

      await waitFor(() => {
        expect(mockOnChange).toHaveBeenCalledWith({
          ...mockFormData,
          acronym: 'NTN'
        })
      })
    })

    it('calls onChange when description is updated', async () => {
      const { user } = renderWithProviders(
        <BasicInfoTab 
          formData={mockFormData} 
          onChange={mockOnChange} 
          errors={mockErrors} 
        />
      )

      const descriptionInput = screen.getByLabelText(/description/i)
      await user.type(descriptionInput, 'Updated description')

      await waitFor(() => {
        expect(mockOnChange).toHaveBeenCalledWith({
          ...mockFormData,
          description: 'Updated description'
        })
      })
    })

    it('calls onChange when complexity rating is updated', async () => {
      const { user } = renderWithProviders(
        <BasicInfoTab 
          formData={mockFormData} 
          onChange={mockOnChange} 
          errors={mockErrors} 
        />
      )

      const complexitySelect = screen.getByLabelText(/complexity rating/i)
      await user.selectOptions(complexitySelect, '5')

      await waitFor(() => {
        expect(mockOnChange).toHaveBeenCalledWith({
          ...mockFormData,
          complexity_rating: 5
        })
      })
    })

    it('calls onChange when computational cost rating is updated', async () => {
      const { user } = renderWithProviders(
        <BasicInfoTab 
          formData={mockFormData} 
          onChange={mockOnChange} 
          errors={mockErrors} 
        />
      )

      const costSelect = screen.getByLabelText(/computational cost rating/i)
      await user.selectOptions(costSelect, '2')

      await waitFor(() => {
        expect(mockOnChange).toHaveBeenCalledWith({
          ...mockFormData,
          computational_cost_rating: 2
        })
      })
    })
  })

  describe('Validation and Error Display', () => {
    it('displays field-specific error messages', () => {
      const errorsWithMessages = {
        name: 'Name is required',
        description: 'Description must be at least 10 characters',
        complexity_rating: 'Rating must be between 1 and 5'
      }

      renderWithProviders(
        <BasicInfoTab 
          formData={mockFormData} 
          onChange={mockOnChange} 
          errors={errorsWithMessages} 
        />
      )

      expect(screen.getByText('Name is required')).toBeInTheDocument()
      expect(screen.getByText('Description must be at least 10 characters')).toBeInTheDocument()
      expect(screen.getByText('Rating must be between 1 and 5')).toBeInTheDocument()
    })

    it('applies error styling to fields with errors', () => {
      const errorsWithMessages = {
        name: 'Name is required'
      }

      renderWithProviders(
        <BasicInfoTab 
          formData={mockFormData} 
          onChange={mockOnChange} 
          errors={errorsWithMessages} 
        />
      )

      const nameInput = screen.getByLabelText(/technique name/i)
      expect(nameInput).toHaveClass(/error|invalid|border-red/)
    })

    it('removes error styling when field is corrected', () => {
      const { rerender } = renderWithProviders(
        <BasicInfoTab 
          formData={mockFormData} 
          onChange={mockOnChange} 
          errors={{ name: 'Name is required' }} 
        />
      )

      let nameInput = screen.getByLabelText(/technique name/i)
      expect(nameInput).toHaveClass(/error|invalid|border-red/)

      // Re-render without errors
      rerender(
        <BasicInfoTab 
          formData={{ ...mockFormData, name: 'Valid Name' }} 
          onChange={mockOnChange} 
          errors={{}} 
        />
      )

      nameInput = screen.getByLabelText(/technique name/i)
      expect(nameInput).not.toHaveClass(/error|invalid|border-red/)
    })
  })

  describe('Rating Selectors', () => {
    it('provides correct rating options for complexity', () => {
      renderWithProviders(
        <BasicInfoTab 
          formData={mockFormData} 
          onChange={mockOnChange} 
          errors={mockErrors} 
        />
      )

      const complexitySelect = screen.getByLabelText(/complexity rating/i)
      const options = complexitySelect.querySelectorAll('option')

      // Should have options 1-5
      expect(options).toHaveLength(5)
      expect(options[0]).toHaveValue('1')
      expect(options[4]).toHaveValue('5')
    })

    it('provides correct rating options for computational cost', () => {
      renderWithProviders(
        <BasicInfoTab 
          formData={mockFormData} 
          onChange={mockOnChange} 
          errors={mockErrors} 
        />
      )

      const costSelect = screen.getByLabelText(/computational cost rating/i)
      const options = costSelect.querySelectorAll('option')

      // Should have options 1-5
      expect(options).toHaveLength(5)
      expect(options[0]).toHaveValue('1')
      expect(options[4]).toHaveValue('5')
    })

    it('includes helpful labels for rating values', () => {
      renderWithProviders(
        <BasicInfoTab 
          formData={mockFormData} 
          onChange={mockOnChange} 
          errors={mockErrors} 
        />
      )

      // Check for descriptive rating labels
      expect(screen.getByText(/very low|simple|easy/i)).toBeInTheDocument()
      expect(screen.getByText(/very high|complex|difficult/i)).toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    it('provides proper labels for all form fields', () => {
      renderWithProviders(
        <BasicInfoTab 
          formData={mockFormData} 
          onChange={mockOnChange} 
          errors={mockErrors} 
        />
      )

      // All form fields should have accessible labels
      expect(screen.getByLabelText(/technique name/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/acronym/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/description/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/complexity rating/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/computational cost rating/i)).toBeInTheDocument()
    })

    it('associates error messages with form fields using aria-describedby', () => {
      const errorsWithMessages = {
        name: 'Name is required'
      }

      renderWithProviders(
        <BasicInfoTab 
          formData={mockFormData} 
          onChange={mockOnChange} 
          errors={errorsWithMessages} 
        />
      )

      const nameInput = screen.getByLabelText(/technique name/i)
      const errorMessage = screen.getByText('Name is required')

      expect(nameInput).toHaveAttribute('aria-describedby')
      expect(errorMessage).toHaveAttribute('id')
    })

    it('supports keyboard navigation between form fields', async () => {
      const { user } = renderWithProviders(
        <BasicInfoTab 
          formData={mockFormData} 
          onChange={mockOnChange} 
          errors={mockErrors} 
        />
      )

      const nameInput = screen.getByLabelText(/technique name/i)
      const acronymInput = screen.getByLabelText(/acronym/i)
      const descriptionInput = screen.getByLabelText(/description/i)

      // Tab through form fields
      await user.tab()
      expect(nameInput).toHaveFocus()

      await user.tab()
      expect(acronymInput).toHaveFocus()

      await user.tab()
      expect(descriptionInput).toHaveFocus()
    })

    it('provides helpful placeholder text', () => {
      renderWithProviders(
        <BasicInfoTab 
          formData={mockFormData} 
          onChange={mockOnChange} 
          errors={mockErrors} 
        />
      )

      expect(screen.getByPlaceholderText(/enter technique name/i)).toBeInTheDocument()
      expect(screen.getByPlaceholderText(/e\.g\.|optional/i)).toBeInTheDocument()
    })
  })

  describe('Character Limits and Input Validation', () => {
    it('handles long technique names appropriately', async () => {
      const { user } = renderWithProviders(
        <BasicInfoTab 
          formData={mockFormData} 
          onChange={mockOnChange} 
          errors={mockErrors} 
        />
      )

      const nameInput = screen.getByLabelText(/technique name/i)
      const longName = 'A'.repeat(200)
      
      await user.type(nameInput, longName)

      // Should handle long input without breaking
      expect(nameInput).toBeInTheDocument()
    })

    it('validates acronym format if specified', async () => {
      const { user } = renderWithProviders(
        <BasicInfoTab 
          formData={mockFormData} 
          onChange={mockOnChange} 
          errors={mockErrors} 
        />
      )

      const acronymInput = screen.getByLabelText(/acronym/i)
      
      // Should accept uppercase acronyms
      await user.type(acronymInput, 'SHAP')
      expect(acronymInput).toHaveValue('SHAP')
    })

    it('handles textarea resizing for description field', async () => {
      const { user } = renderWithProviders(
        <BasicInfoTab 
          formData={mockFormData} 
          onChange={mockOnChange} 
          errors={mockErrors} 
        />
      )

      const descriptionInput = screen.getByLabelText(/description/i)
      const longDescription = 'This is a very long description that should test the textarea behavior and auto-resizing functionality if implemented in the component.'
      
      await user.type(descriptionInput, longDescription)
      
      expect(descriptionInput).toHaveValue(longDescription)
    })
  })
})