import { act, renderHook } from '@testing-library/react';
import { useFilterParams } from '@/lib/hooks/useFilterParams';

// Create object to store mock URL parameters
let mockParams: Record<string, string> = { page: '1' };

// Mock Next.js navigation hooks
jest.mock('next/navigation', () => ({
  useSearchParams: jest.fn(() => ({
    get: jest.fn((key) => mockParams[key] || null),
  })),
  useRouter: jest.fn(() => ({
    push: jest.fn(),
  })),
  usePathname: jest.fn(() => '/techniques'),
}));

describe('useFilterParams', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset mock params to default state
    mockParams = { page: '1' };
  });

  it('initializes with default values', () => {
    const initialFilters = {
      search: '',
      category: 'all',
      assurance_goal: 'all',
    };

    const { result } = renderHook(() => useFilterParams(initialFilters));

    expect(result.current.filters).toEqual({
      ...initialFilters,
      page: '1',
    });
    expect(result.current.currentPage).toBe(1);
  });

  it('updates a single filter', () => {
    const initialFilters = {
      search: '',
      category: 'all',
      assurance_goal: 'all',
    };

    const { result } = renderHook(() => useFilterParams(initialFilters));

    act(() => {
      result.current.setFilter('search', 'test query');
    });

    expect(result.current.filters.search).toBe('test query');
  });

  it('creates URL params and calls router.push when applying filters', () => {
    const router = require('next/navigation').useRouter();
    const initialFilters = {
      search: '',
      category: 'all',
      assurance_goal: 'all',
    };

    const { result } = renderHook(() => useFilterParams(initialFilters));

    // Update filters
    act(() => {
      result.current.setFilter('search', 'test');
      result.current.setFilter('category', '5');
      result.current.setFilter('assurance_goal', '3');
    });

    // Call applyFilters
    act(() => {
      result.current.applyFilters();
    });

    // Verify router.push was called with correct URL
    expect(router.push).toHaveBeenCalledWith(
      expect.stringContaining('/techniques?')
    );
    expect(router.push).toHaveBeenCalledWith(
      expect.stringContaining('categories=5')
    );
    expect(router.push).toHaveBeenCalledWith(
      expect.stringContaining('assurance_goals=3')
    );
    expect(router.push).toHaveBeenCalledWith(
      expect.stringContaining('search=test')
    );
    expect(router.push).toHaveBeenCalledWith(
      expect.stringContaining('page=1')
    );
  });

  it('resets filters to initial values', () => {
    const router = require('next/navigation').useRouter();
    const initialFilters = {
      search: '',
      category: 'all',
      assurance_goal: 'all',
    };

    const { result } = renderHook(() => useFilterParams(initialFilters));

    // First update some filters
    act(() => {
      result.current.setFilter('search', 'test query');
      result.current.setFilter('category', '5');
    });

    // Then reset
    act(() => {
      result.current.resetFilters();
    });

    // Check that router was called with the correct reset URL
    expect(router.push).toHaveBeenCalledWith('/techniques?page=1');
  });

  it('changes page and updates URL', () => {
    const router = require('next/navigation').useRouter();
    const initialFilters = {
      search: 'test',
      category: '5',
      assurance_goal: '3',
    };

    const { result } = renderHook(() => useFilterParams(initialFilters));

    // Call changePage with new page number
    act(() => {
      result.current.changePage(3);
    });

    // Verify router.push contains the right page parameter
    expect(router.push).toHaveBeenCalledWith(
      expect.stringContaining('page=3')
    );
  });
});