#!/usr/bin/env python3
"""Search pipeline orchestrator for parallel multi-provider search."""

import asyncio
import json
import sys
from pathlib import Path
from typing import Any, Dict

from lib.tea_search.config import get_config
from lib.tea_search.modules.utils.io import generate_search_id, save_search_results


async def run_search_pipeline(
    technique_file: str, search_id: str = None
) -> Dict[str, Any]:
    """
    Run parallel searches across all providers and save results.

    Args:
        technique_file: Path to technique JSON file
        search_id: Optional search ID (generates new one if not provided)

    Returns:
        Dict with status, search_id, search_directory, and result_counts
    """
    # Load technique
    with open(technique_file) as f:
        technique = json.load(f)

    # Generate search ID if not provided
    if not search_id:
        search_id = generate_search_id()

    # Get configuration
    config = get_config()

    # Import search modules
    from lib.tea_search.modules.search.arxiv import search_arxiv
    from lib.tea_search.modules.search.github import search_github
    from lib.tea_search.modules.search.google import search_google
    from lib.tea_search.modules.search.semantic_scholar import search_semantic_scholar

    # Run all searches in parallel
    tasks = [
        search_arxiv(technique, max_results=config.arxiv_max_results),
        search_github(technique, max_results=config.github_max_results),
        search_semantic_scholar(
            technique, max_results=config.semantic_scholar_max_results
        ),
    ]

    # Add Google if configured
    if config.is_google_available():
        tasks.append(search_google(technique, max_results=config.google_max_results))

    # Execute all searches
    results = await asyncio.gather(*tasks, return_exceptions=True)

    # Process results
    arxiv_results = results[0] if not isinstance(results[0], Exception) else []
    github_results = results[1] if not isinstance(results[1], Exception) else []
    ss_results = results[2] if not isinstance(results[2], Exception) else []
    google_results = (
        results[3] if len(results) > 3 and not isinstance(results[3], Exception) else []
    )

    # Save all results to filesystem
    search_dir = Path("lib/tea_search/results/search") / search_id
    search_dir.mkdir(parents=True, exist_ok=True)

    # Get technique slug for file metadata
    technique_slug = technique.get("slug", "unknown")

    # Save each provider's results
    providers = {
        "arxiv": arxiv_results,
        "github": github_results,
        "semantic_scholar": ss_results,
        "google": google_results,
    }

    result_counts = {}
    for provider_name, provider_results in providers.items():
        if provider_results:  # Only save if we have results
            save_search_results(
                provider_results,
                provider_name,
                technique_slug,
                search_id,
                output_dir="lib/tea_search/results",
            )
            result_counts[provider_name] = len(provider_results)

    # Return summary
    return {
        "status": "success",
        "search_id": search_id,
        "search_directory": str(search_dir.absolute()),
        "result_counts": result_counts,
        "total_results": sum(result_counts.values()),
    }


def main():
    """CLI entry point for search pipeline."""
    if len(sys.argv) < 2:
        print("Usage: python -m lib.tea_search.pipeline <technique_file> [search_id]")
        sys.exit(1)

    technique_file = sys.argv[1]
    search_id = sys.argv[2] if len(sys.argv) > 2 else None

    # Run pipeline
    result = asyncio.run(run_search_pipeline(technique_file, search_id))

    # Print results as JSON
    print(json.dumps(result, indent=2))


if __name__ == "__main__":
    main()
