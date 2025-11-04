#!/usr/bin/env python3
"""Test all search modules with full results."""

import json
import sys
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent))

from config import get_config


def test_full_search():
    """Test all search modules with full configured results."""
    # Load sample technique
    sample_file = (
        Path(__file__).parent.parent.parent / "test/techniques/sample-technique.json"
    )

    with open(sample_file) as f:
        technique = json.load(f)

    print("Full TEA Search Test")
    print("=" * 80)
    print(f"\nTechnique: {technique['name']}")
    print(f"Goals: {', '.join(technique['assurance_goals'])}")
    print("\n" + "=" * 80)

    # Get configuration
    config = get_config()

    # Test each module with configured max results
    total_results = 0

    # Test arXiv
    print(f"\n▶ Testing arXiv (max {config.arxiv_max_results} results)...")
    try:
        from modules.search.arxiv import search_arxiv_sync

        arxiv_results = search_arxiv_sync(
            technique, max_results=config.arxiv_max_results
        )
        print(f"  ✅ Found {len(arxiv_results)} results")
        total_results += len(arxiv_results)

        # Show first 3 results
        for i, result in enumerate(arxiv_results[:3]):
            print(f"     {i + 1}. {result['title'][:70]}...")

    except Exception as e:
        print(f"  ❌ Error: {e}")

    # Test GitHub
    print(
        f"\n▶ Testing GitHub (max {config.github_max_results} results, min {config.github_min_stars} stars)..."
    )
    try:
        from modules.search.github import search_github_sync

        github_results = search_github_sync(
            technique, max_results=config.github_max_results
        )
        print(f"  ✅ Found {len(github_results)} results")
        total_results += len(github_results)

        # Show first 3 results with stars
        for i, result in enumerate(github_results[:3]):
            stars = result.get("metadata", {}).get("stars", "?")
            print(f"     {i + 1}. {result['title']:40} (★ {stars})")

    except Exception as e:
        print(f"  ❌ Error: {e}")

    # Test Google
    print(f"\n▶ Testing Google (max {config.google_max_results} results)...")
    if config.is_google_available():
        try:
            from modules.search.google import search_google_sync

            google_results = search_google_sync(
                technique, max_results=config.google_max_results
            )
            print(f"  ✅ Found {len(google_results)} results")
            total_results += len(google_results)

            # Show first 3 results
            for i, result in enumerate(google_results[:3]):
                res_type = result.get("resource_type", "unknown")
                print(f"     {i + 1}. [{res_type:12}] {result['title'][:55]}...")

        except Exception as e:
            print(f"  ❌ Error: {e}")
    else:
        print("  ⚠️  Not configured")

    # Test Semantic Scholar
    print(
        f"\n▶ Testing Semantic Scholar (max {config.semantic_scholar_max_results} results)..."
    )
    try:
        from modules.search.semantic_scholar import search_semantic_scholar_sync

        ss_results = search_semantic_scholar_sync(
            technique, max_results=config.semantic_scholar_max_results
        )
        print(f"  ✅ Found {len(ss_results)} results")
        total_results += len(ss_results)

        # Show first 3 results with citations
        for i, result in enumerate(ss_results[:3]):
            citations = result.get("metadata", {}).get("citation_count", 0)
            print(f"     {i + 1}. {result['title'][:55]:55} (citations: {citations})")

    except Exception as e:
        print(f"  ❌ Error: {e}")

    # Summary
    print("\n" + "=" * 80)
    print(f"\n📊 TOTAL RESULTS: {total_results}")
    print("\nExpected ranges (from original pipeline):")
    print("  - arXiv: 15-20 papers")
    print("  - GitHub: 10-20 repositories (filtered by stars)")
    print("  - Google: 10-15 tutorials/docs")
    print("  - Semantic Scholar: 10-15 papers")
    print("\n✅ Phase 1 Goal: Return substantial results for downstream filtering")


if __name__ == "__main__":
    test_full_search()
