import { renderHook, act } from '@testing-library/react';
import { useApiError } from '@/lib/hooks/useApiError';
import axios from 'axios';

// Mock axios isAxiosError function
jest.mock('axios', () => ({
  isAxiosError: jest.fn(),
}));

describe('useApiError', () => {
  beforeEach(() => {
    // Reset the axios mock before each test
    jest.clearAllMocks();
    (axios.isAxiosError as jest.Mock).mockReturnValue(false);
  });

  it('initializes with null error', () => {
    const { result } = renderHook(() => useApiError());
    expect(result.current.error).toBeNull();
  });

  it('handles error with status code 400 (validation errors)', () => {
    (axios.isAxiosError as jest.Mock).mockReturnValue(true);
    
    const badRequestError = {
      response: {
        status: 400,
        data: {
          name: ['This field is required'],
          description: ['This field cannot be blank'],
        },
      },
    };

    const { result } = renderHook(() => useApiError());
    
    act(() => {
      result.current.handleError(badRequestError);
    });

    expect(result.current.error).not.toBeNull();
    expect(result.current.error?.message).toBe('Validation error');
    expect(result.current.error?.details).toEqual({
      name: ['This field is required'],
      description: ['This field cannot be blank'],
    });
    expect(result.current.error?.statusCode).toBe(400);
  });

  it('handles error with DRF detail field', () => {
    (axios.isAxiosError as jest.Mock).mockReturnValue(true);
    
    const errorWithDetail = {
      response: {
        status: 403,
        data: {
          detail: 'You do not have permission to perform this action.',
        },
      },
    };

    const { result } = renderHook(() => useApiError());
    
    act(() => {
      result.current.handleError(errorWithDetail);
    });

    expect(result.current.error).not.toBeNull();
    expect(result.current.error?.message).toBe('You do not have permission to perform this action.');
    expect(result.current.error?.statusCode).toBe(403);
  });

  it('handles error with message field', () => {
    (axios.isAxiosError as jest.Mock).mockReturnValue(true);
    
    const errorWithMessage = {
      response: {
        status: 500,
        data: {
          message: 'Internal server error occurred',
        },
      },
    };

    const { result } = renderHook(() => useApiError());
    
    act(() => {
      result.current.handleError(errorWithMessage);
    });

    expect(result.current.error).not.toBeNull();
    expect(result.current.error?.message).toBe('Internal server error occurred');
    expect(result.current.error?.statusCode).toBe(500);
  });

  it('handles error with string response data', () => {
    (axios.isAxiosError as jest.Mock).mockReturnValue(true);
    
    const stringError = {
      response: {
        status: 404,
        data: 'Resource not found',
      },
    };

    const { result } = renderHook(() => useApiError());
    
    act(() => {
      result.current.handleError(stringError);
    });

    expect(result.current.error).not.toBeNull();
    expect(result.current.error?.message).toBe('Resource not found');
    expect(result.current.error?.statusCode).toBe(404);
  });

  it('handles axios error with no structured data', () => {
    (axios.isAxiosError as jest.Mock).mockReturnValue(true);
    
    const axiosError = {
      response: { status: 500 },
      message: 'Request failed with status code 500',
    };

    const { result } = renderHook(() => useApiError());
    
    act(() => {
      result.current.handleError(axiosError);
    });

    expect(result.current.error).not.toBeNull();
    expect(result.current.error?.message).toBe('Request failed with status code 500');
    expect(result.current.error?.statusCode).toBe(500);
  });

  it('handles network errors', () => {
    (axios.isAxiosError as jest.Mock).mockReturnValue(true);
    
    const networkError = {
      message: 'Network Error',
      response: undefined,
    };

    const { result } = renderHook(() => useApiError());
    
    act(() => {
      result.current.handleError(networkError);
    });

    expect(result.current.error).not.toBeNull();
    expect(result.current.error?.message).toBe('Network Error');
  });

  it('handles standard JS errors', () => {
    (axios.isAxiosError as jest.Mock).mockReturnValue(false);
    
    const jsError = new Error('Something went wrong');

    const { result } = renderHook(() => useApiError());
    
    act(() => {
      result.current.handleError(jsError);
    });

    expect(result.current.error).not.toBeNull();
    expect(result.current.error?.message).toBe('Something went wrong');
  });

  it('handles unknown errors', () => {
    (axios.isAxiosError as jest.Mock).mockReturnValue(false);
    
    const unknownError = "This is not an Error object";

    const { result } = renderHook(() => useApiError());
    
    act(() => {
      result.current.handleError(unknownError);
    });

    expect(result.current.error).not.toBeNull();
    expect(result.current.error?.message).toBe('An unknown error occurred');
  });

  it('clears error state', () => {
    (axios.isAxiosError as jest.Mock).mockReturnValue(true);
    
    // First set an error
    const error = {
      response: {
        status: 400,
        data: { detail: 'Bad request' },
      },
    };

    const { result } = renderHook(() => useApiError());
    
    act(() => {
      result.current.handleError(error);
    });

    expect(result.current.error).not.toBeNull();

    // Then clear it
    act(() => {
      result.current.clearError();
    });

    expect(result.current.error).toBeNull();
  });
});