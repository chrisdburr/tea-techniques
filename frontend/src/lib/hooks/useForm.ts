// src/lib/hooks/useForm.ts
import { useState, ChangeEvent } from 'react';

type FormErrors<T> = Partial<Record<keyof T | 'submit', string>>;

interface UseFormReturn<T> {
  values: T;
  errors: FormErrors<T>;
  isSubmitting: boolean;
  handleChange: (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  handleSelectChange: (name: keyof T, value: string) => void;
  setFieldValue: <K extends keyof T>(name: K, value: T[K]) => void;
  setFieldError: (name: keyof T | 'submit', error: string) => void;
  clearFieldError: (name: keyof T) => void;
  setSubmitting: (isSubmitting: boolean) => void;
  validateForm: (validators: Record<keyof T, (value: unknown) => string | null>) => boolean;
  resetForm: (newValues?: Partial<T>) => void;
}

/**
 * Custom hook for form handling
 * @param initialValues Initial form values
 * @returns Form state and handlers
 */
export function useForm<T extends Record<string, unknown>>(initialValues: T): UseFormReturn<T> {
  const [values, setValues] = useState<T>(initialValues);
  const [errors, setErrors] = useState<FormErrors<T>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    const fieldName = name as keyof T;
    
    // Update the value - we need to allow typing even if the character is the same
    // (e.g., typing 'aa' should work even though it's the same character twice)
    setValues(prev => ({
      ...prev,
      [fieldName]: value,
    }));

    // Clear error for this field when it's changed
    if (errors[fieldName]) {
      clearFieldError(fieldName);
    }
  };

  const handleSelectChange = (name: keyof T, value: string) => {
    // Skip update if the value isn't changing
    if (values[name] === value) return;
    
    // Update the field value
    setValues(prev => ({
      ...prev,
      [name]: value,
    }));

    // Clear error for this field when it's changed
    if (errors[name]) {
      clearFieldError(name);
    }
  };

  const setFieldValue = <K extends keyof T>(name: K, value: T[K]) => {
    // Skip update if the value isn't changing
    if (values[name] === value) return;
    
    setValues(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const setFieldError = (name: keyof T | 'submit', error: string) => {
    setErrors(prev => ({
      ...prev,
      [name]: error,
    }));
  };

  const clearFieldError = (name: keyof T) => {
    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[name];
      return newErrors;
    });
  };

  const validateForm = (validators: Record<keyof T, (value: unknown) => string | null>) => {
    const newErrors: FormErrors<T> = {};
    
    Object.keys(validators).forEach(key => {
      const fieldKey = key as keyof T;
      const validator = validators[fieldKey];
      const errorMessage = validator(values[fieldKey]);
      
      if (errorMessage) {
        newErrors[fieldKey] = errorMessage;
      }
    });
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const resetForm = (newValues?: Partial<T>) => {
    // When called with newValues (especially in edit mode), we need to ensure values are set
    const updatedValues = { ...initialValues, ...(newValues || {}) };
    
    // Only update if values are actually different
    const hasChanges = Object.keys(updatedValues).some(
      key => updatedValues[key as keyof T] !== values[key as keyof T]
    );
    
    if (hasChanges) {
      setValues(updatedValues);
    }
    
    // Clear any existing errors only if we have errors
    if (Object.keys(errors).length > 0) {
      setErrors({});
    }
  };

  return {
    values,
    errors,
    isSubmitting,
    handleChange,
    handleSelectChange,
    setFieldValue,
    setFieldError,
    clearFieldError,
    setSubmitting: setIsSubmitting,
    validateForm,
    resetForm,
  };
}