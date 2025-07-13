import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useFilterParams } from "@/lib/hooks/useFilterParams";

// Mock Next.js navigation hooks
const mockPush = vi.fn();
const mockGet = vi.fn();
const mockPathname = "/techniques";

vi.mock("next/navigation", () => ({
  useSearchParams: () => ({
    get: mockGet,
    toString: () => "search=test&page=2",
  }),
  useRouter: () => ({
    push: mockPush,
  }),
  usePathname: () => mockPathname,
}));

describe("useFilterParams", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGet.mockReturnValue(null);
  });

  describe("initialization", () => {
    it("should initialize with default filters when no URL params", () => {
      const initialFilters = {
        search: "",
        assurance_goal: "",
        tag: "",
      };

      const { result } = renderHook(() => useFilterParams(initialFilters, 1));

      expect(result.current.filters).toEqual(initialFilters);
      expect(result.current.currentPage).toBe(1);
    });

    it("should initialize with values from URL params", () => {
      mockGet.mockImplementation((key: string) => {
        const params: Record<string, string> = {
          search: "test query",
          page: "3",
        };
        return params[key] || null;
      });

      const initialFilters = {
        search: "",
        assurance_goal: "",
        tag: "",
      };

      const { result } = renderHook(() => useFilterParams(initialFilters, 1));

      expect(result.current.filters.search).toBe("test query");
      expect(result.current.currentPage).toBe(3);
    });

    it("should handle plural parameter names from backend", () => {
      mockGet.mockImplementation((key: string) => {
        const params: Record<string, string> = {
          assurance_goals: "fairness",
          tags: "machine-learning",
        };
        return params[key] || null;
      });

      const initialFilters = {
        search: "",
        assurance_goal: "",
        tag: "",
      };

      const { result } = renderHook(() => useFilterParams(initialFilters, 1));

      expect(result.current.filters.assurance_goal).toBe("fairness");
      expect(result.current.filters.tag).toBe("machine-learning");
    });

    it("should handle invalid page numbers gracefully", () => {
      mockGet.mockImplementation((key: string) => {
        if (key === "page") return "invalid";
        return null;
      });

      const { result } = renderHook(() => useFilterParams({}, 1));

      expect(result.current.currentPage).toBe(1);
    });

    it("should handle negative page numbers", () => {
      mockGet.mockImplementation((key: string) => {
        if (key === "page") return "-5";
        return null;
      });

      const { result } = renderHook(() => useFilterParams({}, 1));

      expect(result.current.currentPage).toBe(1);
    });
  });

  describe("updateFilter", () => {
    it("should update a single filter and reset page to 1", () => {
      const { result } = renderHook(() =>
        useFilterParams({ search: "", tag: "" }, 1),
      );

      act(() => {
        result.current.updateFilter("search", "new search");
      });

      expect(result.current.filters.search).toBe("new search");
      expect(result.current.currentPage).toBe(1);
      expect(mockPush).toHaveBeenCalledWith(
        "/techniques?search=new+search&page=1",
      );
    });

    it("should remove filter when value is empty", () => {
      const { result } = renderHook(() =>
        useFilterParams({ search: "existing", tag: "test" }, 1),
      );

      act(() => {
        result.current.updateFilter("search", "");
      });

      expect(result.current.filters.search).toBe("");
      expect(mockPush).toHaveBeenCalledWith("/techniques?tag=test&page=1");
    });

    it("should handle special plural parameter mapping", () => {
      const { result } = renderHook(() =>
        useFilterParams({ assurance_goal: "", tag: "" }, 1),
      );

      act(() => {
        result.current.updateFilter("assurance_goal", "fairness");
      });

      expect(result.current.filters.assurance_goal).toBe("fairness");
      expect(mockPush).toHaveBeenCalledWith(
        "/techniques?assurance_goals=fairness&page=1",
      );
    });

    it("should handle tag to tags mapping", () => {
      const { result } = renderHook(() => useFilterParams({ tag: "" }, 1));

      act(() => {
        result.current.updateFilter("tag", "machine-learning");
      });

      expect(result.current.filters.tag).toBe("machine-learning");
      expect(mockPush).toHaveBeenCalledWith(
        "/techniques?tags=machine-learning&page=1",
      );
    });
  });

  describe("updateMultipleFilters", () => {
    it("should update multiple filters at once", () => {
      const { result } = renderHook(() =>
        useFilterParams({ search: "", tag: "", assurance_goal: "" }, 1),
      );

      act(() => {
        result.current.updateMultipleFilters({
          search: "test query",
          tag: "ml",
        });
      });

      expect(result.current.filters.search).toBe("test query");
      expect(result.current.filters.tag).toBe("ml");
      expect(result.current.currentPage).toBe(1);
      expect(mockPush).toHaveBeenCalledWith(
        "/techniques?search=test+query&tags=ml&page=1",
      );
    });

    it("should remove empty filters when updating multiple", () => {
      const { result } = renderHook(() =>
        useFilterParams({ search: "existing", tag: "existing" }, 1),
      );

      act(() => {
        result.current.updateMultipleFilters({
          search: "",
          tag: "new-tag",
        });
      });

      expect(result.current.filters.search).toBe("");
      expect(result.current.filters.tag).toBe("new-tag");
      expect(mockPush).toHaveBeenCalledWith("/techniques?tags=new-tag&page=1");
    });
  });

  describe("setPage", () => {
    it("should update page number", () => {
      const { result } = renderHook(() =>
        useFilterParams({ search: "test" }, 1),
      );

      act(() => {
        result.current.setPage(5);
      });

      expect(result.current.currentPage).toBe(5);
      expect(mockPush).toHaveBeenCalledWith("/techniques?search=test&page=5");
    });

    it("should not allow page less than 1", () => {
      const { result } = renderHook(() => useFilterParams({}, 1));

      act(() => {
        result.current.setPage(0);
      });

      expect(result.current.currentPage).toBe(1);
      expect(mockPush).toHaveBeenCalledWith("/techniques?page=1");
    });

    it("should handle page navigation with existing filters", () => {
      const { result } = renderHook(() =>
        useFilterParams({ search: "test", tag: "ml" }, 1),
      );

      act(() => {
        result.current.setPage(3);
      });

      expect(mockPush).toHaveBeenCalledWith(
        "/techniques?search=test&tags=ml&page=3",
      );
    });
  });

  describe("clearFilters", () => {
    it("should reset all filters to initial state", () => {
      const initialFilters = { search: "", tag: "", assurance_goal: "" };

      const { result } = renderHook(() => useFilterParams(initialFilters, 1));

      // First set some filters
      act(() => {
        result.current.updateMultipleFilters({
          search: "test",
          tag: "ml",
        });
      });

      // Then clear them
      act(() => {
        result.current.clearFilters();
      });

      expect(result.current.filters).toEqual(initialFilters);
      expect(result.current.currentPage).toBe(1);
      expect(mockPush).toHaveBeenLastCalledWith("/techniques?page=1");
    });

    it("should clear filters and reset to default page", () => {
      const { result } = renderHook(() =>
        useFilterParams({ search: "test" }, 2),
      );

      act(() => {
        result.current.setPage(5);
      });

      act(() => {
        result.current.clearFilters();
      });

      expect(result.current.currentPage).toBe(2); // default page
      expect(mockPush).toHaveBeenLastCalledWith("/techniques?page=2");
    });
  });

  describe("URL parameter encoding", () => {
    it("should properly encode spaces in filter values", () => {
      const { result } = renderHook(() => useFilterParams({ search: "" }, 1));

      act(() => {
        result.current.updateFilter("search", "machine learning");
      });

      expect(mockPush).toHaveBeenCalledWith(
        "/techniques?search=machine+learning&page=1",
      );
    });

    it("should handle special characters in filter values", () => {
      const { result } = renderHook(() => useFilterParams({ search: "" }, 1));

      act(() => {
        result.current.updateFilter("search", "test & validation");
      });

      expect(mockPush).toHaveBeenCalledWith(
        "/techniques?search=test+%26+validation&page=1",
      );
    });
  });

  describe("edge cases", () => {
    it("should handle empty initial filters", () => {
      const { result } = renderHook(() => useFilterParams({}, 1));

      expect(result.current.filters).toEqual({});
      expect(result.current.currentPage).toBe(1);
    });

    it("should handle filter updates with empty object", () => {
      const { result } = renderHook(() => useFilterParams({ search: "" }, 1));

      act(() => {
        result.current.updateMultipleFilters({});
      });

      expect(result.current.filters.search).toBe("");
      expect(mockPush).toHaveBeenCalledWith("/techniques?page=1");
    });

    it("should maintain filter state consistency across re-renders", () => {
      const { result, rerender } = renderHook(() =>
        useFilterParams({ search: "", tag: "" }, 1),
      );

      act(() => {
        result.current.updateFilter("search", "test");
      });

      rerender();

      expect(result.current.filters.search).toBe("test");
    });
  });
});
