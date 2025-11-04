"""arXiv search provider for TEA Search pipeline."""

import asyncio
import json

# Add parent directories to path for imports
import os
import re
import sys
from typing import Dict, List

import arxiv

# Get the tea-search directory
tea_search_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, tea_search_dir)

# Import using relative imports since we're in the package
try:
    from ...config import get_config
    from ...models import (
        SearchResponse,
        SearchResult,
        TechniqueInput,
        format_search_result,
        validate_technique,
    )
except ImportError:
    # Fallback for direct module execution
    sys.path.insert(0, os.path.dirname(tea_search_dir))
    import config
    import models

    get_config = config.get_config
    SearchResponse = models.SearchResponse
    SearchResult = models.SearchResult
    TechniqueInput = models.TechniqueInput
    format_search_result = models.format_search_result
    validate_technique = models.validate_technique


def build_arxiv_query(technique: TechniqueInput) -> str:
    """Build an optimized query for arXiv search using OR logic for better coverage."""
    name = technique["name"]
    description = technique["description"]

    # Extract acronym if present
    acronym = None
    if "(" in name and ")" in name:
        matches = re.findall(r"\(([A-Z]+[A-Z0-9-]*)\)", name)
        if matches:
            acronym = matches[0]

    # Build query components
    query_parts = []

    # Use OR logic for technique name and acronym (matches original TEA search)
    if acronym:
        # Use both full name and acronym with OR for better coverage
        clean_name = name.split("(")[0].strip()
        query_parts.append(f'("{clean_name}" OR {acronym})')
    else:
        query_parts.append(f'"{name}"')

    # Add key terms from description
    desc_words = description.split()
    key_words = [w for w in desc_words if len(w) > 5 and w.isalpha()][:2]
    if key_words:
        query_parts.append(" ".join(key_words))

    # Add assurance goals as context
    goals = technique["assurance_goals"]
    if goals:
        query_parts.append(" ".join(goals[:1]))

    return " ".join(query_parts)


async def search_arxiv(technique: Dict, max_results: int = 10) -> List[Dict]:
    """
    Search arXiv for papers related to the technique.

    Args:
        technique: Dict with name, description, assurance_goals
        max_results: Maximum number of results

    Returns:
        List of search results
    """
    config = get_config()
    rate_limit = config.rate_limit_delay

    # Validate technique input
    technique_input = validate_technique(technique)

    # Build query
    query = build_arxiv_query(technique_input)

    # Configure search
    search = arxiv.Search(
        query=query,
        max_results=max_results,
        sort_by=arxiv.SortCriterion.Relevance,
        sort_order=arxiv.SortOrder.Descending,
    )

    # Execute search
    client = arxiv.Client()
    results = []

    try:
        for paper in client.results(search):
            result = format_search_result(
                title=paper.title,
                url=paper.pdf_url,
                source="arxiv",
                abstract=paper.summary[:500] if paper.summary else "",
                authors=[author.name for author in paper.authors][:5],
                date=paper.published.strftime("%Y-%m-%d") if paper.published else "",
                resource_type="paper",
                metadata={
                    "arxiv_id": paper.entry_id,
                    "categories": paper.categories,
                    "comment": paper.comment,
                },
            )
            results.append(result)

            # Rate limiting
            await asyncio.sleep(rate_limit)

    except Exception as e:
        print(f"Error searching arXiv: {e}", file=sys.stderr)
        return []

    return results


def search_arxiv_sync(technique: Dict, max_results: int = 10) -> List[Dict]:
    """Synchronous wrapper for search_arxiv."""
    return asyncio.run(search_arxiv(technique, max_results))


def create_response(
    results: List[SearchResult],
    query: str,
    search_id: str = None,
    saved_path: str = None,
    error: str = None,
) -> SearchResponse:
    """Create a standardized search response."""
    return SearchResponse(
        results=results,
        count=len(results),
        query=query,
        provider="arxiv",
        error=error,
    )


def main():
    """Main entry point for CLI testing."""
    if len(sys.argv) < 2:
        print(
            "Usage: python -m lib.tea-search.modules.search.arxiv '<technique_json>' [max_results] [--search-id ID]"
        )
        sys.exit(1)

    try:
        # Import I/O utilities
        sys.path.insert(
            0,
            os.path.dirname(
                os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
            ),
        )
        from modules.utils.io import save_search_results

        # Parse input JSON
        technique_json = sys.argv[1]
        technique = json.loads(technique_json)

        # Parse optional arguments
        max_results = 10
        search_id = None

        for i, arg in enumerate(sys.argv[2:], 2):
            if arg == "--search-id" and i < len(sys.argv) - 1:
                search_id = sys.argv[i + 1]
            elif arg.isdigit():
                max_results = int(arg)

        # Perform search
        results = search_arxiv_sync(technique, max_results)

        # Build query for response
        technique_input = validate_technique(technique)
        query = build_arxiv_query(technique_input)

        # Save results if successful
        saved_path = None
        if results:
            saved_path, search_id = save_search_results(
                results,
                provider="arxiv",
                technique_slug=technique_input["slug"],
                search_id=search_id,
            )

        # Create and output response with search_id and saved_path
        response = create_response(results, query, search_id, saved_path)
        # Add search_id and saved_path to response
        response["search_id"] = search_id
        if saved_path:
            response["saved_to"] = saved_path

        print(json.dumps(response, indent=2))

    except json.JSONDecodeError as e:
        error_response = create_response([], "", error=f"Invalid JSON input: {e}")
        print(json.dumps(error_response, indent=2))
        sys.exit(1)
    except Exception as e:
        error_response = create_response([], "", error=str(e))
        print(json.dumps(error_response, indent=2))
        sys.exit(1)


if __name__ == "__main__":
    main()
