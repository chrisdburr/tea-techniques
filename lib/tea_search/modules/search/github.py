"""GitHub search provider for TEA Search pipeline."""

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


def extract_technique_components(name: str) -> tuple:
    """Extract clean name, core name, and acronym from technique name."""
    # Clean technique name
    clean_name = re.sub(r"[^\w\s-]", " ", name)
    clean_name = re.sub(r"\s+", " ", clean_name).strip()

    # Extract core name (before parentheses)
    core_name = clean_name
    if "(" in name:
        core_name = name.split("(")[0].strip()

    # Extract acronym
    acronym = None
    if "(" in name and ")" in name:
        matches = re.findall(r"\(([A-Za-z0-9-]+)\)", name)
        if matches:
            acronym = matches[0]

    return clean_name, core_name, acronym


def build_github_queries(technique: TechniqueInput) -> List[str]:
    """Build optimized queries for GitHub search."""
    clean_name, core_name, acronym = extract_technique_components(technique["name"])

    queries = []

    # Priority 1: Basic "best match" search (GitHub's default algorithm)
    if core_name:
        # Simple search that GitHub's "best match" algorithm handles well
        queries.append(core_name.lower())

    # Priority 2: Framework-specific searches (catches Opacus, TensorFlow Privacy, etc.)
    if core_name:
        # Search with popular ML frameworks
        queries.append(f"{core_name.lower()} pytorch")
        queries.append(f"{core_name.lower()} tensorflow")

    # Priority 3: Technique name IN REPO NAME (most directly relevant)
    if core_name:
        # Convert to hyphenated form for common repo naming
        hyphenated = core_name.lower().replace(" ", "-")
        # Search for repos with the technique directly in the name
        queries.append(f"{hyphenated} in:name")

    # Priority 4: Implementation-focused searches
    if core_name:
        # Look for actual implementations
        queries.append(f"{core_name.lower()} implementation library")

    # Priority 5: Topic-based search (many repos tag with topics)
    if core_name:
        # Use hyphenated form which is common in topics
        hyphenated = core_name.lower().replace(" ", "-")
        queries.append(f"topic:{hyphenated}")

    # Priority 6: Acronym searches (only if meaningful)
    if acronym and len(acronym) >= 3:  # Avoid 2-letter acronyms (too generic)
        # Acronym with context keywords
        queries.append(f"{acronym} {core_name.lower().split()[0]}")

    return queries[:6]  # Allow up to 6 queries for better coverage


async def search_github(technique: Dict, max_results: int = 10) -> List[Dict]:
    """
    Search GitHub for repositories related to the technique.

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

    # Build queries
    queries = build_github_queries(technique_input)

    # GitHub API setup
    headers = {"Accept": "application/vnd.github.v3+json"}
    if config.github_api_key:
        headers["Authorization"] = f"token {config.github_api_key}"

    results = []
    seen_urls = set()

    for query in queries:
        if len(results) >= max_results:
            break

        # Search parameters - adjust based on query type
        if "topic:" in query:
            # Topic searches are very specific
            params = {
                "q": query,  # No star filter for topic searches
                "sort": "stars",
                "order": "desc",
                "per_page": min(10, max_results - len(results)),
            }
        elif "in:name" in query:
            # Name searches are specific, accept lower stars
            params = {
                "q": f"{query} stars:>10",
                "sort": "stars",
                "order": "desc",
                "per_page": min(10, max_results - len(results)),
            }
        elif any(framework in query for framework in ["pytorch", "tensorflow"]):
            # Framework-specific searches should find key libraries
            params = {
                "q": f"{query} stars:>50",
                "sort": "stars",
                "order": "desc",
                "per_page": min(10, max_results - len(results)),
            }
        elif "implementation" in query.lower() or "library" in query.lower():
            # Implementation/library searches
            params = {
                "q": f"{query} stars:>20",
                "sort": "stars",
                "order": "desc",
                "per_page": min(10, max_results - len(results)),
            }
        else:
            # Basic search - use GitHub's "best match" algorithm (no sort parameter)
            # This is what GitHub.com uses by default and works very well
            params = {
                "q": f"{query} stars:>100",
                # Omit sort to use GitHub's "best match" algorithm
                "per_page": min(10, max_results - len(results)),
            }

        try:
            # Make API request
            response = requests.get(
                "https://api.github.com/search/repositories",
                headers=headers,
                params=params,
                timeout=10,
            )

            if response.status_code == 200:
                data = response.json()
                for item in data.get("items", []):
                    if (
                        item
                        and item.get("html_url")
                        and item["html_url"] not in seen_urls
                    ):
                        seen_urls.add(item["html_url"])

                        # Safely extract owner login
                        owner_login = None
                        if item.get("owner") and isinstance(item["owner"], dict):
                            owner_login = item["owner"].get("login")

                        # Safely extract license
                        license_id = None
                        if item.get("license") and isinstance(item["license"], dict):
                            license_id = item["license"].get("spdx_id")

                        # Format result
                        result = format_search_result(
                            title=item.get("full_name", ""),
                            url=item["html_url"],
                            source="github",
                            abstract=(item.get("description") or "")[:500],
                            authors=[owner_login] if owner_login else [],
                            date=item.get("created_at", "")[:10]
                            if item.get("created_at")
                            else "",
                            resource_type="software",
                            metadata={
                                "stars": item.get("stargazers_count", 0),
                                "language": item.get("language"),
                                "topics": item.get("topics", []),
                                "license": license_id,
                            },
                        )
                        results.append(result)

                        if len(results) >= max_results:
                            break

            # Rate limiting
            await asyncio.sleep(rate_limit)

        except Exception as e:
            print(f"Error searching GitHub with query '{query}': {e}", file=sys.stderr)
            continue

    return results


def search_github_sync(technique: Dict, max_results: int = 10) -> List[Dict]:
    """Synchronous wrapper for search_github."""
    return asyncio.run(search_github(technique, max_results))


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
        provider="github",
        error=error,
    )


def main():
    """Main entry point for CLI testing."""
    if len(sys.argv) < 2:
        print(
            "Usage: python -m lib.tea-search.modules.search.github '<technique_json>' [max_results] [--search-id ID]"
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
        max_results = 20
        search_id = None

        for i, arg in enumerate(sys.argv[2:], 2):
            if arg == "--search-id" and i < len(sys.argv) - 1:
                search_id = sys.argv[i + 1]
            elif arg.isdigit():
                max_results = int(arg)

        # Perform search
        results = search_github_sync(technique, max_results)

        # Build queries for response
        technique_input = validate_technique(technique)
        queries = build_github_queries(technique_input)

        # Save results if successful
        saved_path = None
        if results:
            saved_path, search_id = save_search_results(
                results,
                provider="github",
                technique_slug=technique_input["slug"],
                search_id=search_id,
            )

        # Create and output response with search_id and saved_path
        response = create_response(results, " | ".join(queries), search_id, saved_path)
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
