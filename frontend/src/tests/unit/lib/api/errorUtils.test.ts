import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import axios, { AxiosError } from 'axios';
import { logApiError } from '@/lib/api/errorUtils';

/* eslint-disable @typescript-eslint/no-explicit-any */

// Store original console methods
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;

// Create mock functions
const mockConsoleError = vi.fn();
const mockConsoleWarn = vi.fn();

describe('errorUtils', () => {
  beforeEach(() => {
    // Replace console methods with mocks
    console.error = mockConsoleError;
    console.warn = mockConsoleWarn;
    mockConsoleError.mockClear();
    mockConsoleWarn.mockClear();
  });

  afterEach(() => {
    // Restore original console methods
    console.error = originalConsoleError;
    console.warn = originalConsoleWarn;
    vi.clearAllMocks();
  });

  describe('logApiError', () => {
    it('should log unknown errors correctly', () => {
      const error = 'unknown string error';
      logApiError('testHook', error);

      expect(mockConsoleError).toHaveBeenCalledWith(
        '[API Error][testHook] UnknownError: unknown string error',
        expect.objectContaining({
          details: expect.objectContaining({
            hookName: 'testHook',
            type: 'UnknownError',
            message: 'unknown string error'
          }),
          originalError: error
        })
      );
    });

    it('should log standard JavaScript errors correctly', () => {
      const error = new TypeError('Test type error');
      logApiError('testHook', error);

      expect(mockConsoleError).toHaveBeenCalledWith(
        '[API Error][testHook] TypeError: Test type error',
        expect.objectContaining({
          details: expect.objectContaining({
            hookName: 'testHook',
            type: 'TypeError',
            message: 'Test type error'
          }),
          originalError: error
        })
      );
    });

    it('should handle null and undefined errors', () => {
      logApiError('testHook', null);
      expect(mockConsoleError).toHaveBeenCalledWith(
        '[API Error][testHook] UnknownError: Unknown error occurred',
        expect.objectContaining({
          details: expect.objectContaining({
            hookName: 'testHook',
            type: 'UnknownError',
            message: 'Unknown error occurred'
          })
        })
      );

      mockConsoleError.mockClear();

      logApiError('testHook', undefined);
      expect(mockConsoleError).toHaveBeenCalledWith(
        '[API Error][testHook] UnknownError: Unknown error occurred',
        expect.objectContaining({
          details: expect.objectContaining({
            hookName: 'testHook',
            type: 'UnknownError',
            message: 'Unknown error occurred'
          })
        })
      );
    });

    describe('Axios errors', () => {
      it('should log Axios error with response (client error)', () => {
        const axiosError: AxiosError = {
          name: 'AxiosError',
          message: 'Request failed with status code 400',
          config: {
            method: 'get',
            url: '/api/techniques',
            params: { page: 1 },
            data: { test: 'data' }
          } as any,
          response: {
            status: 400,
            data: { detail: 'Bad request' }
          } as any,
          isAxiosError: true,
          toJSON: () => ({})
        };

        vi.spyOn(axios, 'isAxiosError').mockReturnValue(true);
        
        logApiError('useTechniques', axiosError);

        expect(mockConsoleError).toHaveBeenCalledWith(
          '[API Error][useTechniques] ClientError: Request failed with status code 400',
          expect.objectContaining({
            details: expect.objectContaining({
              hookName: 'useTechniques',
              type: 'ClientError',
              message: 'Request failed with status code 400',
              statusCode: 400,
              responseData: { detail: 'Bad request' },
              requestInfo: {
                method: 'GET',
                url: '/api/techniques',
                params: { page: 1 },
                data: { test: 'data' }
              }
            })
          })
        );
      });

      it('should log Axios error with response (server error)', () => {
        const axiosError: AxiosError = {
          name: 'AxiosError',
          message: 'Request failed with status code 500',
          config: {
            method: 'post',
            url: '/api/techniques'
          } as any,
          response: {
            status: 500,
            data: { error: 'Internal server error' }
          } as any,
          isAxiosError: true,
          toJSON: () => ({})
        };

        vi.spyOn(axios, 'isAxiosError').mockReturnValue(true);
        
        logApiError('createTechnique', axiosError);

        expect(mockConsoleError).toHaveBeenCalledWith(
          '[API Error][createTechnique] ServerError: Request failed with status code 500',
          expect.objectContaining({
            details: expect.objectContaining({
              hookName: 'createTechnique',
              type: 'ServerError',
              message: 'Request failed with status code 500',
              statusCode: 500,
              responseData: { error: 'Internal server error' }
            })
          })
        );
      });

      it('should extract standardized error type from response data', () => {
        const axiosError: AxiosError = {
          name: 'AxiosError',
          message: 'Request failed',
          config: {} as any,
          response: {
            status: 422,
            data: { 
              error_type: 'ValidationError',
              detail: 'Validation failed'
            }
          } as any,
          isAxiosError: true,
          toJSON: () => ({})
        };

        vi.spyOn(axios, 'isAxiosError').mockReturnValue(true);
        
        logApiError('testHook', axiosError);

        expect(mockConsoleError).toHaveBeenCalledWith(
          '[API Error][testHook] ValidationError: Request failed',
          expect.objectContaining({
            details: expect.objectContaining({
              type: 'ValidationError'
            })
          })
        );
      });

      it('should log network errors (request made but no response)', () => {
        const axiosError: AxiosError = {
          name: 'AxiosError',
          message: 'Network Error',
          config: {
            method: 'get',
            url: '/api/techniques'
          } as any,
          request: {},
          isAxiosError: true,
          toJSON: () => ({})
        };

        vi.spyOn(axios, 'isAxiosError').mockReturnValue(true);
        
        logApiError('testHook', axiosError);

        expect(mockConsoleError).toHaveBeenCalledWith(
          '[API Error][testHook] NetworkError: Network Error',
          expect.objectContaining({
            details: expect.objectContaining({
              type: 'NetworkError',
              message: 'Network Error'
            })
          })
        );
      });

      it('should handle Axios error without config', () => {
        const axiosError: AxiosError = {
          name: 'AxiosError',
          message: 'Request failed',
          isAxiosError: true,
          toJSON: () => ({})
        };

        vi.spyOn(axios, 'isAxiosError').mockReturnValue(true);
        
        logApiError('testHook', axiosError);

        expect(mockConsoleError).toHaveBeenCalledWith(
          '[API Error][testHook] AxiosError: Request failed',
          expect.objectContaining({
            details: expect.objectContaining({
              type: 'AxiosError',
              message: 'Request failed'
            })
          })
        );
      });
    });

    describe('unexpected error format warnings', () => {
      it('should warn about unexpected error format', () => {
        const axiosError: AxiosError = {
          name: 'AxiosError',
          message: 'Request failed',
          config: {} as any,
          response: {
            status: 400,
            data: { 
              unexpected: 'format',
              custom: 'data'
            }
          } as any,
          isAxiosError: true,
          toJSON: () => ({})
        };

        vi.spyOn(axios, 'isAxiosError').mockReturnValue(true);
        
        logApiError('testHook', axiosError);

        expect(mockConsoleWarn).toHaveBeenCalledWith(
          '[API Error][testHook] Unexpected error format detected:',
          { unexpected: 'format', custom: 'data' }
        );
      });

      it('should not warn about standard error formats', () => {
        const axiosError: AxiosError = {
          name: 'AxiosError',
          message: 'Request failed',
          config: {} as any,
          response: {
            status: 400,
            data: { 
              detail: 'Standard error format'
            }
          } as any,
          isAxiosError: true,
          toJSON: () => ({})
        };

        vi.spyOn(axios, 'isAxiosError').mockReturnValue(true);
        
        logApiError('testHook', axiosError);

        expect(mockConsoleWarn).not.toHaveBeenCalled();
      });

      it('should not warn about error_type format', () => {
        const axiosError: AxiosError = {
          name: 'AxiosError',
          message: 'Request failed',
          config: {} as any,
          response: {
            status: 400,
            data: { 
              error_type: 'ValidationError'
            }
          } as any,
          isAxiosError: true,
          toJSON: () => ({})
        };

        vi.spyOn(axios, 'isAxiosError').mockReturnValue(true);
        
        logApiError('testHook', axiosError);

        expect(mockConsoleWarn).not.toHaveBeenCalled();
      });

      it('should not warn about errors format', () => {
        const axiosError: AxiosError = {
          name: 'AxiosError',
          message: 'Request failed',
          config: {} as any,
          response: {
            status: 400,
            data: { 
              errors: ['field error 1', 'field error 2']
            }
          } as any,
          isAxiosError: true,
          toJSON: () => ({})
        };

        vi.spyOn(axios, 'isAxiosError').mockReturnValue(true);
        
        logApiError('testHook', axiosError);

        expect(mockConsoleWarn).not.toHaveBeenCalled();
      });

      it('should handle non-object response data', () => {
        const axiosError: AxiosError = {
          name: 'AxiosError',
          message: 'Request failed',
          config: {} as any,
          response: {
            status: 400,
            data: 'string error response'
          } as any,
          isAxiosError: true,
          toJSON: () => ({})
        };

        vi.spyOn(axios, 'isAxiosError').mockReturnValue(true);
        
        logApiError('testHook', axiosError);

        expect(mockConsoleWarn).not.toHaveBeenCalled();
      });

      it('should handle null response data', () => {
        const axiosError: AxiosError = {
          name: 'AxiosError',
          message: 'Request failed',
          config: {} as any,
          response: {
            status: 400,
            data: null
          } as any,
          isAxiosError: true,
          toJSON: () => ({})
        };

        vi.spyOn(axios, 'isAxiosError').mockReturnValue(true);
        
        logApiError('testHook', axiosError);

        expect(mockConsoleWarn).not.toHaveBeenCalled();
      });
    });

    it('should handle edge cases with object errors', () => {
      const error = { customProperty: 'test', toString: () => 'custom error' };
      
      // Mock axios.isAxiosError to return false for this object
      vi.spyOn(axios, 'isAxiosError').mockReturnValue(false);
      
      logApiError('testHook', error);

      expect(mockConsoleError).toHaveBeenCalledWith(
        '[API Error][testHook] UnknownError: custom error',
        expect.objectContaining({
          details: expect.objectContaining({
            message: 'custom error'
          })
        })
      );
    });
  });
});