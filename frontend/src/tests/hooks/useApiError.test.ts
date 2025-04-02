import { renderHook, act } from "@testing-library/react";
import { useApiError } from "@/lib/hooks/useApiError";
import axios, { AxiosError, AxiosHeaders, AxiosResponse } from "axios";

// Mock console.error to avoid cluttering test output
const originalConsoleError = console.error;
beforeAll(() => {
  console.error = jest.fn();
});

afterAll(() => {
  console.error = originalConsoleError;
});

// Helper to create Axios errors for testing
function createAxiosError(status: number, data: any): AxiosError {
  const headers = new AxiosHeaders();
  
  const response: AxiosResponse = {
    data,
    status,
    statusText: status === 404 ? "Not Found" : "Error",
    headers,
    config: {
      headers
    } as any,
  };
  
  const error = new AxiosError(
    "Request failed",
    String(status),
    { headers } as any,
    null,
    response
  );
  
  return error;
}

describe("useApiError hook", () => {
  test("handles standard backend error format correctly", () => {
    const { result } = renderHook(() => useApiError());
    
    const standardizedError = createAxiosError(400, {
      detail: "Validation failed",
      status_code: 400,
      error_type: "ValidationError",
      errors: {
        name: ["This field is required"],
        description: ["This field is required"]
      }
    });
    
    act(() => {
      result.current.handleError(standardizedError);
    });
    
    expect(result.current.error).toEqual({
      message: "Validation failed",
      details: {
        name: ["This field is required"],
        description: ["This field is required"]
      },
      statusCode: 400,
      errorType: "ValidationError"
    });
  });
  
  test("handles DRF validation errors with field-specific messages", () => {
    const { result } = renderHook(() => useApiError());
    
    // DRF validation error format
    const validationError = createAxiosError(400, {
      name: ["This field is required"],
      description: ["This field is required"]
    });
    
    act(() => {
      result.current.handleError(validationError);
    });
    
    expect(result.current.error).toEqual({
      message: "Validation error",
      details: {
        name: ["This field is required"],
        description: ["This field is required"]
      },
      statusCode: 400,
      errorType: "ValidationError"
    });
  });
  
  test("handles DRF error with detail field as string", () => {
    const { result } = renderHook(() => useApiError());
    
    // DRF error with detail field
    const detailError = createAxiosError(404, {
      detail: "Not found"
    });
    
    act(() => {
      result.current.handleError(detailError);
    });
    
    expect(result.current.error).toEqual({
      message: "Not found",
      statusCode: 404,
      errorType: "APIError"
    });
  });
  
  test("handles network errors", () => {
    const { result } = renderHook(() => useApiError());
    
    // Network error (no response)
    const networkError = new AxiosError(
      "Network Error",
      "ECONNABORTED"
    );
    
    act(() => {
      result.current.handleError(networkError);
    });
    
    expect(result.current.error?.message).toContain("Network Error");
    expect(result.current.error?.errorType).toBe("NetworkError");
  });
  
  test("handles regular JS errors", () => {
    const { result } = renderHook(() => useApiError());
    
    const jsError = new Error("JavaScript error");
    
    act(() => {
      result.current.handleError(jsError);
    });
    
    expect(result.current.error).toEqual({
      message: "JavaScript error",
      errorType: "Error"
    });
  });
  
  test("handles unknown error types", () => {
    const { result } = renderHook(() => useApiError());
    
    act(() => {
      result.current.handleError("Some string error");
    });
    
    expect(result.current.error).toEqual({
      message: "An unknown error occurred",
      errorType: "UnknownError"
    });
  });
  
  test("clears error state", () => {
    const { result } = renderHook(() => useApiError());
    
    // Set an error
    act(() => {
      result.current.handleError(new Error("Test error"));
    });
    
    // Verify error is set
    expect(result.current.error).not.toBeNull();
    
    // Clear error
    act(() => {
      result.current.clearError();
    });
    
    // Verify error is cleared
    expect(result.current.error).toBeNull();
  });
});
