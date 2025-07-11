import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AuthProvider, useAuth } from '@/lib/context/auth-context';

// Mock the API client
vi.mock('@/lib/api/client', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
    patch: vi.fn()
  }
}));

import { apiClient } from '@/lib/api/client';

const mockApiClient = apiClient as {
  get: ReturnType<typeof vi.fn>;
  post: ReturnType<typeof vi.fn>;
  put: ReturnType<typeof vi.fn>;
  delete: ReturnType<typeof vi.fn>;
  patch: ReturnType<typeof vi.fn>;
};

// Test component that uses the auth context
function TestComponent() {
  const { user, isAuthenticated, isLoading, login, logout, checkAuthStatus } = useAuth();

  return (
    <div>
      <div data-testid="loading">{isLoading ? 'loading' : 'not-loading'}</div>
      <div data-testid="authenticated">{isAuthenticated ? 'authenticated' : 'not-authenticated'}</div>
      <div data-testid="user">{user ? `${user.username} (${user.email})` : 'no-user'}</div>
      <button onClick={() => login('testuser', 'password')} data-testid="login-btn">
        Login
      </button>
      <button onClick={() => logout()} data-testid="logout-btn">
        Logout
      </button>
      <button onClick={() => checkAuthStatus()} data-testid="check-status-btn">
        Check Status
      </button>
    </div>
  );
}

describe('AuthContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('AuthProvider', () => {
    it('should render children and provide context', async () => {
      mockApiClient.get.mockRejectedValue(new Error('Unauthorized'));

      const { container } = render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      // Should render the test component
      const loadingEl = container.querySelector('[data-testid="loading"]');
      const authEl = container.querySelector('[data-testid="authenticated"]');
      const userEl = container.querySelector('[data-testid="user"]');
      expect(loadingEl).toBeInTheDocument();
      expect(authEl).toBeInTheDocument();
      expect(userEl).toBeInTheDocument();
    });

    it('should initialize with loading state and check auth status', async () => {
      mockApiClient.get.mockResolvedValue({
        data: {
          id: 1,
          username: 'testuser',
          email: 'test@example.com',
          isStaff: false
        }
      });

      const { container } = render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      // Should start in loading state
      const loadingEl = container.querySelector('[data-testid="loading"]');
      const authEl = container.querySelector('[data-testid="authenticated"]');
      const userEl = container.querySelector('[data-testid="user"]');
      expect(loadingEl).toHaveTextContent('loading');
      expect(authEl).toHaveTextContent('not-authenticated');
      expect(userEl).toHaveTextContent('no-user');

      // Wait for auth status to be updated
      await waitFor(() => {
        const updatedLoadingEl = container.querySelector('[data-testid="loading"]');
        expect(updatedLoadingEl).toHaveTextContent('not-loading');
      });

      // Should call GET /api/auth/user on mount (checkAuthStatus)
      expect(mockApiClient.get).toHaveBeenCalledWith('/api/auth/user');

      const finalAuthEl = container.querySelector('[data-testid="authenticated"]');
      const finalUserEl = container.querySelector('[data-testid="user"]');
      expect(finalAuthEl).toHaveTextContent('authenticated');
      expect(finalUserEl).toHaveTextContent('testuser (test@example.com)');
    });

    it('should handle unauthenticated state on mount', async () => {
      mockApiClient.get.mockRejectedValue(new Error('Unauthorized'));

      const { container } = render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        const loadingEl = container.querySelector('[data-testid="loading"]');
        expect(loadingEl).toHaveTextContent('not-loading');
      });

      const authEl = container.querySelector('[data-testid="authenticated"]');
      const userEl = container.querySelector('[data-testid="user"]');
      expect(authEl).toHaveTextContent('not-authenticated');
      expect(userEl).toHaveTextContent('no-user');
    });

    it('should handle auth status check errors', async () => {
      mockApiClient.get.mockRejectedValue(new Error('Network error'));

      const { container } = render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        const loadingEl = container.querySelector('[data-testid="loading"]');
        expect(loadingEl).toHaveTextContent('not-loading');
      });

      // Should default to unauthenticated state on error
      const authEl = container.querySelector('[data-testid="authenticated"]');
      const userEl = container.querySelector('[data-testid="user"]');
      expect(authEl).toHaveTextContent('not-authenticated');
      expect(userEl).toHaveTextContent('no-user');
    });
  });

  describe('login functionality', () => {
    it('should handle successful login', async () => {
      const user = userEvent.setup();
      
      // First call (mount) fails, second call (CSRF) succeeds, third call (login) succeeds
      mockApiClient.get
        .mockRejectedValueOnce(new Error('Unauthorized')) // Initial auth check
        .mockResolvedValueOnce({}); // CSRF call
      
      mockApiClient.post.mockResolvedValue({
        data: {
          id: 1,
          username: 'testuser',
          email: 'test@example.com',
          isStaff: false
        }
      });

      const { container } = render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      // Wait for initial load
      await waitFor(() => {
        const loadingEl = container.querySelector('[data-testid="loading"]');
        expect(loadingEl).toHaveTextContent('not-loading');
      });

      // Perform login
      const loginBtn = container.querySelector('[data-testid="login-btn"]');
      await act(async () => {
        await user.click(loginBtn);
      });

      expect(mockApiClient.get).toHaveBeenCalledWith('/api/auth/csrf');
      expect(mockApiClient.post).toHaveBeenCalledWith('/api/auth/login', {
        username: 'testuser',
        password: 'password'
      });

      await waitFor(() => {
        const authEl = container.querySelector('[data-testid="authenticated"]');
        expect(authEl).toHaveTextContent('authenticated');
      });

      const userEl = container.querySelector('[data-testid="user"]');
      expect(userEl).toHaveTextContent('testuser (test@example.com)');
    });

    it('should handle login errors', async () => {
      const user = userEvent.setup();
      
      mockApiClient.get
        .mockRejectedValueOnce(new Error('Unauthorized')) // Initial auth check
        .mockResolvedValueOnce({}); // CSRF call
      
      mockApiClient.post.mockRejectedValue(new Error('Invalid credentials'));

      const { container } = render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      // Wait for initial load
      await waitFor(() => {
        const loadingEl = container.querySelector('[data-testid="loading"]');
        expect(loadingEl).toHaveTextContent('not-loading');
      });

      // Attempt login
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      // React may swallow errors in event handlers, so we test that the login was attempted
      // and state remains unchanged rather than expecting the promise to reject
      const loginBtn = container.querySelector('[data-testid="login-btn"]');
      await act(async () => {
        await user.click(loginBtn);
      });
      
      // Wait a bit for any state updates
      await waitFor(() => {
        expect(mockApiClient.post).toHaveBeenCalledWith('/api/auth/login', {
          username: 'testuser',
          password: 'password'
        });
      });
      
      consoleErrorSpy.mockRestore();

      // Should remain unauthenticated after error
      const authEl = container.querySelector('[data-testid="authenticated"]');
      const userEl = container.querySelector('[data-testid="user"]');
      expect(authEl).toHaveTextContent('not-authenticated');
      expect(userEl).toHaveTextContent('no-user');
    });
  });

  describe('logout functionality', () => {
    it('should handle successful logout', async () => {
      const user = userEvent.setup();
      
      // Initially authenticated
      mockApiClient.get.mockResolvedValue({
        data: {
          id: 1,
          username: 'testuser',
          email: 'test@example.com',
          isStaff: false
        }
      });

      mockApiClient.post.mockResolvedValue({});

      const { container } = render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      // Wait for initial auth check
      await waitFor(() => {
        const authEl = container.querySelector('[data-testid="authenticated"]');
        expect(authEl).toHaveTextContent('authenticated');
      });

      // Perform logout
      const logoutBtn = container.querySelector('[data-testid="logout-btn"]');
      await act(async () => {
        await user.click(logoutBtn);
      });

      expect(mockApiClient.post).toHaveBeenCalledWith('/api/auth/logout');

      await waitFor(() => {
        const authEl = container.querySelector('[data-testid="authenticated"]');
        expect(authEl).toHaveTextContent('not-authenticated');
      });

      const userEl = container.querySelector('[data-testid="user"]');
      expect(userEl).toHaveTextContent('no-user');
    });

    it('should handle logout errors', async () => {
      const user = userEvent.setup();
      
      // Initially authenticated
      mockApiClient.get.mockResolvedValue({
        data: {
          id: 1,
          username: 'testuser',
          email: 'test@example.com',
          isStaff: false
        }
      });

      mockApiClient.post.mockRejectedValue(new Error('Network error'));

      const { container } = render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      // Wait for initial auth check
      await waitFor(() => {
        const authEl = container.querySelector('[data-testid="authenticated"]');
        expect(authEl).toHaveTextContent('authenticated');
      });

      // Attempt logout - should handle error gracefully (logout doesn't re-throw errors)
      const logoutBtn = container.querySelector('[data-testid="logout-btn"]');
      await act(async () => {
        await user.click(logoutBtn);
      });

      expect(mockApiClient.post).toHaveBeenCalledWith('/api/auth/logout');
      
      // Should still be loading false after error
      await waitFor(() => {
        const loadingEl = container.querySelector('[data-testid="loading"]');
        expect(loadingEl).toHaveTextContent('not-loading');
      });
    });
  });

  describe('manual auth status check', () => {
    it('should update auth status when checkAuthStatus is called', async () => {
      const user = userEvent.setup();
      
      // Initially unauthenticated
      mockApiClient.get
        .mockRejectedValueOnce(new Error('Unauthorized')) // Initial mount
        .mockResolvedValueOnce({ // Manual check
          data: {
            id: 1,
            username: 'testuser',
            email: 'test@example.com',
            isStaff: false
          }
        });

      const { container } = render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      // Wait for initial load (unauthenticated)
      await waitFor(() => {
        const authEl = container.querySelector('[data-testid="authenticated"]');
        expect(authEl).toHaveTextContent('not-authenticated');
      });

      // Manually check auth status
      const checkBtn = container.querySelector('[data-testid="check-status-btn"]');
      await act(async () => {
        await user.click(checkBtn);
      });

      await waitFor(() => {
        const authEl = container.querySelector('[data-testid="authenticated"]');
        expect(authEl).toHaveTextContent('authenticated');
      });

      const userEl = container.querySelector('[data-testid="user"]');
      expect(userEl).toHaveTextContent('testuser (test@example.com)');
    });
  });
});