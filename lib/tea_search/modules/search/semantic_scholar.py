"""Semantic Scholar search provider for TEA Search pipeline."""

import asyncio
import json
import os
import re
import sys
from typing import Dict, List

import requests

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


def build_semantic_scholar_query(technique: TechniqueInput) -> str:
    """Build an optimized query for Semantic Scholar search."""
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

    # Use acronym if available, otherwise use full name
    if acronym:
        query_parts.append(acronym)
        # Also add the base name for better coverage
        base_name = name.split("(")[0].strip()
        query_parts.append(base_name)
    else:
        query_parts.append(name)

    # Add key terms from description
    desc_words = description.split()
    key_words = [w for w in desc_words if len(w) > 6 and w.isalpha()][:2]
    if key_words:
        query_parts.extend(key_words)

    # Add first assurance goal for context
    goals = technique["assurance_goals"]
    if goals:
        query_parts.append(goals[0])

    return " ".join(query_parts)


async def search_semantic_scholar(technique: Dict, max_results: int = 10) -> List[Dict]:
    """
    Search Semantic Scholar for academic papers related to the technique.

    Args:
        technique: Dict with name, description, assurance_goals
        max_results: Maximum number of results

    Returns:
        List of search results
    """
    config = get_config()
    # Semantic Scholar is more strict with rate limits - use longer delay
    rate_limit = max(1.0, config.rate_limit_delay * 2)

    # Validate technique input
    technique_input = validate_technique(technique)

    # Build query
    query = build_semantic_scholar_query(technique_input)

    # Semantic Scholar API parameters
    params = {
        "query": query,
        "limit": max_results,
        "fields": "title,url,abstract,authors,year,citationCount,venue",
    }

    # Add API key if available (optional for basic access)
    headers = {}
    if config.semantic_scholar_api_key:
        headers["x-api-key"] = config.semantic_scholar_api_key

    results = []

    try:
        # Make API request
        response = requests.get(
            "https://api.semanticscholar.org/graph/v1/paper/search",
            params=params,
            headers=headers,
            timeout=10,
        )

        if response.status_code == 200:
            data = response.json()
            for paper in data.get("data", []):
                # Build paper URL if not provided
                paper_id = paper.get("paperId", "")
                url = (
                    paper.get("url")
                    or f"https://www.semanticscholar.org/paper/{paper_id}"
                )

                # Extract author names
                authors = []
                for author in paper.get("authors", [])[:5]:
                    if isinstance(author, dict):
                        authors.append(author.get("name", ""))
                    else:
                        authors.append(str(author))

                # Format result
                result = format_search_result(
                    title=paper.get("title", ""),
                    url=url,
                    source="semantic_scholar",
                    abstract=paper.get("abstract", "")[:500]
                    if paper.get("abstract")
                    else "",
                    authors=authors,
                    date=str(paper.get("year", "")) if paper.get("year") else "",
                    resource_type="paper",
                    metadata={
                        "paper_id": paper_id,
                        "citation_count": paper.get("citationCount", 0),
                        "venue": paper.get("venue", ""),
                    },
                )
                results.append(result)

        elif response.status_code == 429:
            print("Semantic Scholar rate limit exceeded", file=sys.stderr)
            # Try to get rate limit info from headers
            retry_after = response.headers.get("Retry-After", "unknown")
            print(f"  Retry after: {retry_after} seconds", file=sys.stderr)
        else:
            print(
                f"Semantic Scholar API error (status {response.status_code})",
                file=sys.stderr,
            )
            if response.text:
                print(f"  Error message: {response.text[:200]}", file=sys.stderr)

        # Rate limiting
        await asyncio.sleep(rate_limit)

    except Exception as e:
        print(f"Error searching Semantic Scholar: {e}", file=sys.stderr)

    return results


def search_semantic_scholar_sync(technique: Dict, max_results: int = 10) -> List[Dict]:
    """Synchronous wrapper for search_semantic_scholar."""
    return asyncio.run(search_semantic_scholar(technique, max_results))


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
        provider="semantic_scholar",
        error=error,
    )


def main():
    """Main entry point for CLI testing."""
    if len(sys.argv) < 2:
        print(
            "Usage: python -m lib.tea-search.modules.search.semantic_scholar '<technique_json>' [max_results] [--search-id ID]"
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
        max_results = 15
        search_id = None

        for i, arg in enumerate(sys.argv[2:], 2):
            if arg == "--search-id" and i < len(sys.argv) - 1:
                search_id = sys.argv[i + 1]
            elif arg.isdigit():
                max_results = int(arg)

        # Perform search
        results = search_semantic_scholar_sync(technique, max_results)

        # Build query for response
        technique_input = validate_technique(technique)
        query = build_semantic_scholar_query(technique_input)

        # Save results if successful
        saved_path = None
        if results:
            saved_path, search_id = save_search_results(
                results,
                provider="semantic_scholar",
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
