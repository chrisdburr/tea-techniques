// src/lib/hooks/useForm.ts
import { useState, ChangeEvent } from 'react';

type FormErrors<T> = Partial<Record<keyof T | 'submit', string>>;

// Create a type for validators that preserves the field types
export type FormValidators<T> = {
  [K in keyof T]?: (value: T[K]) => string | null;
};

interface UseFormReturn<T> {
  values: T;
  errors: FormErrors<T>;
  isSubmitting: boolean;
  handleChange: (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  handleBlur: (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  handleSelectChange: (name: keyof T, value: string) => void;
  setFieldValue: <K extends keyof T>(name: K, value: T[K]) => void;
  setFieldError: (name: keyof T | 'submit', error: string) => void;
  clearFieldError: (name: keyof T) => void;
  setSubmitting: (isSubmitting: boolean) => void;
  validateForm: () => boolean;  // Changed to not take parameters
  resetForm: (newValues?: Partial<T>) => void;
}

/**
 * Custom hook for form handling
 * @param initialValues Initial form values
 * @param validators Field validation functions
 * @returns Form state and handlers
 */

export function useForm<T extends object>(
  initialValues: T, 
  validators: FormValidators<T> = {} as FormValidators<T>
): UseFormReturn<T> {
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

  // Updated validateForm to use the stored validators
  const validateForm = () => {
    const newErrors: FormErrors<T> = {};
    
    Object.keys(validators).forEach(key => {
      const fieldKey = key as keyof T;
      const validator = validators[fieldKey];
      
      if (validator) {
        // TypeScript now knows that validator expects T[fieldKey] type
        const errorMessage = validator(values[fieldKey]);
        
        if (errorMessage) {
          newErrors[fieldKey] = errorMessage;
        }
      }
    });
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Updated handleBlur to use the stored validators
  const handleBlur = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name } = e.target;
    const fieldKey = name as keyof T;
    
    // If there's a validator for this field
    if (fieldKey in validators && validators[fieldKey]) {
      const validator = validators[fieldKey];
      if (validator) {
        const errorMessage = validator(values[fieldKey]);
        
        if (errorMessage) {
          setErrors(prev => ({
            ...prev,
            [fieldKey]: errorMessage
          }));
        } else {
          clearFieldError(fieldKey);
        }
      }
    }
  };

  return {
    values,
    errors,
    isSubmitting,
    handleChange,
    handleBlur,
    handleSelectChange,
    setFieldValue,
    setFieldError,
    clearFieldError,
    setSubmitting: setIsSubmitting,
    validateForm,
    resetForm,
  };
}
