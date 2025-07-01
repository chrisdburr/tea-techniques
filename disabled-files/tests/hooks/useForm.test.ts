import { renderHook, act } from '@testing-library/react';
import { useForm, FormValidators } from '@/lib/hooks/useForm';

interface TestFormValues {
  name: string;
  email: string;
  age: number;
}

describe('useForm', () => {
  // Test initial values
  it('initializes with provided values', () => {
    const initialValues: TestFormValues = {
      name: 'John Doe',
      email: 'john@example.com',
      age: 30,
    };

    const { result } = renderHook(() => useForm<TestFormValues>(initialValues));

    expect(result.current.values).toEqual(initialValues);
    expect(result.current.errors).toEqual({});
    expect(result.current.isSubmitting).toBe(false);
  });

  // Test handleChange
  it('updates values via handleChange', () => {
    const initialValues: TestFormValues = {
      name: '',
      email: '',
      age: 0,
    };

    const { result } = renderHook(() => useForm<TestFormValues>(initialValues));

    act(() => {
      result.current.handleChange({
        target: { name: 'name', value: 'Jane Doe' },
      } as React.ChangeEvent<HTMLInputElement>);
    });

    expect(result.current.values.name).toBe('Jane Doe');
  });

  // Test handleSelectChange
  it('updates values via handleSelectChange', () => {
    const initialValues: TestFormValues = {
      name: '',
      email: '',
      age: 0,
    };

    const { result } = renderHook(() => useForm<TestFormValues>(initialValues));

    act(() => {
      result.current.handleSelectChange('age', '25');
    });

    expect(result.current.values.age).toBe('25');
  });

  // Test setFieldValue
  it('updates values via setFieldValue', () => {
    const initialValues: TestFormValues = {
      name: '',
      email: '',
      age: 0,
    };

    const { result } = renderHook(() => useForm<TestFormValues>(initialValues));

    act(() => {
      result.current.setFieldValue('email', 'jane@example.com');
    });

    expect(result.current.values.email).toBe('jane@example.com');
  });

  // Test validation
  it('validates fields using provided validators', () => {
    const initialValues: TestFormValues = {
      name: '',
      email: 'invalid-email',
      age: 15,
    };

    const validators: FormValidators<TestFormValues> = {
      name: (value) => (value ? null : 'Name is required'),
      email: (value) => (
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) ? null : 'Invalid email format'
      ),
      age: (value) => (value >= 18 ? null : 'Must be 18 or older'),
    };

    const { result } = renderHook(() => 
      useForm<TestFormValues>(initialValues, validators)
    );

    act(() => {
      const isValid = result.current.validateForm();
      expect(isValid).toBe(false);
    });

    expect(result.current.errors).toEqual({
      name: 'Name is required',
      email: 'Invalid email format',
      age: 'Must be 18 or older',
    });
  });

  // Test field-level validation on blur
  it('validates individual field on blur', () => {
    const initialValues: TestFormValues = {
      name: '',
      email: 'test@example.com',
      age: 25,
    };

    const validators: FormValidators<TestFormValues> = {
      name: (value) => (value ? null : 'Name is required'),
    };

    const { result } = renderHook(() => 
      useForm<TestFormValues>(initialValues, validators)
    );

    act(() => {
      result.current.handleBlur({
        target: { name: 'name', value: '' }
      } as React.FocusEvent<HTMLInputElement>);
    });

    expect(result.current.errors.name).toBe('Name is required');
    expect(Object.keys(result.current.errors).length).toBe(1); // Only name field has error
  });

  // Test set/clear field error
  it('manually sets and clears field errors', () => {
    const initialValues: TestFormValues = {
      name: 'John Doe',
      email: 'john@example.com',
      age: 30,
    };

    const { result } = renderHook(() => useForm<TestFormValues>(initialValues));

    act(() => {
      result.current.setFieldError('email', 'Email already in use');
    });

    expect(result.current.errors.email).toBe('Email already in use');

    act(() => {
      result.current.clearFieldError('email');
    });

    expect(result.current.errors.email).toBeUndefined();
  });

  // Test resetForm
  it('resets form to initial values', () => {
    const initialValues: TestFormValues = {
      name: '',
      email: '',
      age: 0,
    };

    const { result } = renderHook(() => useForm<TestFormValues>(initialValues));

    // Change some values and add errors
    act(() => {
      result.current.setFieldValue('name', 'Jane Doe');
      result.current.setFieldValue('email', 'jane@example.com');
      result.current.setFieldError('age', 'Invalid age');
    });

    // Reset the form
    act(() => {
      result.current.resetForm();
    });

    // Check values are reset and errors cleared
    expect(result.current.values).toEqual(initialValues);
    expect(result.current.errors).toEqual({});
  });

  // Test resetForm with new values
  it('resets form with new values', () => {
    const initialValues: TestFormValues = {
      name: '',
      email: '',
      age: 0,
    };

    const { result } = renderHook(() => useForm<TestFormValues>(initialValues));

    const newValues = {
      name: 'Jane Doe',
      email: 'jane@example.com',
    };

    // Reset with new values
    act(() => {
      result.current.resetForm(newValues);
    });

    // Check values are updated
    expect(result.current.values).toEqual({
      ...initialValues,
      ...newValues,
    });
  });
});
