"""Google search provider for TEA Search pipeline."""

import asyncio
import json
import os
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
        classify_resource_type,
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
    classify_resource_type = models.classify_resource_type
    format_search_result = models.format_search_result
    validate_technique = models.validate_technique


def build_google_strategic_queries(technique: TechniqueInput) -> List[tuple]:
    """Build strategic Google queries using exactTerms + orTerms approach."""
    name = technique["name"]

    # Extract base name (without parentheses)
    base_name = name.split("(")[0].strip() if "(" in name else name

    # Tutorial/educational context terms
    tutorial_terms = [
        "tutorial",
        "guide",
        "introduction",
        "how to",
        "beginner",
        "learn",
        "getting started",
        "walkthrough",
        "step by step",
        "examples",
        "practical",
    ]

    # Documentation/reference context terms
    doc_terms = [
        "documentation",
        "reference",
        "manual",
        "API",
        "docs",
        "specification",
        "guide",
        "configuration",
        "setup",
        "installation",
        "usage",
    ]

    # Create searches that require technique name AND context terms
    # Returns tuples of (search_type, exactTerms, orTerms)
    tutorial_context = " ".join(tutorial_terms[:6])
    doc_context = " ".join(doc_terms[:6])

    return [
        ("tutorial", base_name, tutorial_context),
        ("documentation", base_name, doc_context),
    ]


async def search_google(technique: Dict, max_results: int = 10) -> List[Dict]:
    """
    Search Google for tutorials and documentation related to the technique.
    Uses exactTerms + orTerms to ensure results contain the technique name.

    Args:
        technique: Dict with name, description, assurance_goals
        max_results: Maximum number of results

    Returns:
        List of search results
    """
    config = get_config()

    # Check if Google search is configured
    if not config.is_google_available():
        print(
            "Google search not configured (missing API key or CSE ID)", file=sys.stderr
        )
        return []

    rate_limit = config.rate_limit_delay

    # Validate technique input
    technique_input = validate_technique(technique)

    # Build strategic queries (max 2 API calls)
    strategic_queries = build_google_strategic_queries(technique_input)

    results = []
    seen_urls = set()
    results_per_search = (
        max_results // len(strategic_queries) if strategic_queries else max_results
    )

    for search_type, exact_terms, or_terms in strategic_queries:
        if len(results) >= max_results:
            break

        # Google Custom Search API parameters with exactTerms and orTerms
        # This ensures results MUST contain the technique name AND at least one context term
        params = {
            "key": config.google_api_key,
            "cx": config.google_cse_id,
            "q": search_type,  # Basic search type for relevance
            "exactTerms": exact_terms,  # MUST contain the technique name
            "orTerms": or_terms,  # Must contain at least one of these context terms
            "num": min(10, results_per_search),  # Google CSE max is 10 per request
        }

        try:
            # Make API request
            response = requests.get(
                "https://www.googleapis.com/customsearch/v1",
                params=params,
                timeout=10,
            )

            if response.status_code == 200:
                data = response.json()
                for item in data.get("items", []):
                    url = item.get("link", "")
                    if url not in seen_urls:
                        seen_urls.add(url)

                        # Classify resource type based on content
                        title = item.get("title", "")
                        snippet = item.get("snippet", "")
                        resource_type = classify_resource_type(url, title, "google")

                        # Format result
                        result = format_search_result(
                            title=title,
                            url=url,
                            source="google",
                            abstract=snippet[:500] if snippet else "",
                            authors=[],
                            date="",
                            resource_type=resource_type,
                            metadata={
                                "display_link": item.get("displayLink", ""),
                                "mime_type": item.get("mime", ""),
                                "search_type": search_type,
                                "strategic_query": True,
                            },
                        )
                        results.append(result)

                        if len(results) >= max_results:
                            break
            else:
                error_data = response.json() if response.text else {}
                error_msg = error_data.get("error", {}).get("message", response.text)
                print(
                    f"Google API error (status {response.status_code}): {error_msg}",
                    file=sys.stderr,
                )

            # Rate limiting
            await asyncio.sleep(rate_limit)

        except Exception as e:
            print(f"Error with Google strategic search: {e}", file=sys.stderr)
            continue

    return results


def search_google_sync(technique: Dict, max_results: int = 10) -> List[Dict]:
    """Synchronous wrapper for search_google."""
    return asyncio.run(search_google(technique, max_results))


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
        provider="google",
        error=error,
    )


def main():
    """Main entry point for CLI testing."""
    if len(sys.argv) < 2:
        print(
            "Usage: python -m lib.tea-search.modules.search.google '<technique_json>' [max_results] [--search-id ID]"
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

        # Check configuration first
        config = get_config()
        if not config.is_google_available():
            error_response = create_response(
                [],
                "",
                search_id,
                None,
                error="Google search not configured (missing GOOGLE_API_KEY or GOOGLE_CSE_ID)",
            )
            print(json.dumps(error_response, indent=2))
            sys.exit(1)

        # Perform search
        results = search_google_sync(technique, max_results)

        # Build queries for response
        technique_input = validate_technique(technique)
        strategic_queries = build_google_strategic_queries(technique_input)

        # Format query description for response
        query_desc = f"exactTerms: {strategic_queries[0][1]} with tutorial/doc context"

        # Save results if successful
        saved_path = None
        if results:
            saved_path, search_id = save_search_results(
                results,
                provider="google",
                technique_slug=technique_input["slug"],
                search_id=search_id,
            )

        # Create and output response with search_id and saved_path
        response = create_response(results, query_desc, search_id, saved_path)
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
