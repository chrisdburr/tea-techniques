"""Data models and validation for TEA Search pipeline."""

from typing import Any, Dict, List, Literal, Optional, TypedDict


class TechniqueInput(TypedDict):
    """Input structure for a technique to search."""

    slug: str
    name: str
    description: str
    assurance_goals: List[str]


class SearchResult(TypedDict):
    """Standardized search result from any provider."""

    title: str
    url: str
    source: Literal["arxiv", "github", "google", "semantic_scholar"]
    abstract: Optional[str]
    authors: Optional[List[str]]
    date: Optional[str]
    resource_type: Literal["paper", "tutorial", "tool", "documentation", "software"]
    metadata: Optional[Dict[str, Any]]


class EvaluatedResource(TypedDict):
    """Resource after evaluation by subagent."""

    title: str
    url: str
    source: str
    resource_type: str
    relevance_score: float  # 0-1
    key_insights: List[str]
    recommendation: Literal["include", "exclude"]
    rationale: str


class SelectedResource(TypedDict):
    """Final selected resource format."""

    title: str
    url: str
    type: str
    relevance_score: float
    description: str
    key_insights: Optional[List[str]]


class SearchResponse(TypedDict):
    """Response format from search modules."""

    results: List[SearchResult]
    count: int
    query: str
    provider: str
    error: Optional[str]


def validate_technique(data: Dict) -> TechniqueInput:
    """Validate and convert technique data to TechniqueInput."""
    required_fields = ["name", "description", "assurance_goals"]

    for field in required_fields:
        if field not in data:
            raise ValueError(f"Missing required field: {field}")

    # Ensure slug exists (use name if not provided)
    if "slug" not in data:
        data["slug"] = data["name"].lower().replace(" ", "-")

    # Ensure assurance_goals is a list
    if not isinstance(data["assurance_goals"], list):
        raise ValueError("assurance_goals must be a list")

    return TechniqueInput(
        slug=data["slug"],
        name=data["name"],
        description=data["description"],
        assurance_goals=data["assurance_goals"],
    )


def format_search_result(
    title: str,
    url: str,
    source: str,
    abstract: str = "",
    authors: List[str] = None,
    date: str = "",
    resource_type: str = "paper",
    metadata: Dict = None,
) -> SearchResult:
    """Format a search result to standard structure."""
    return SearchResult(
        title=title,
        url=url,
        source=source,
        abstract=abstract,
        authors=authors or [],
        date=date,
        resource_type=resource_type,
        metadata=metadata or {},
    )


def build_search_query(technique: TechniqueInput) -> str:
    """Build a search query from technique information."""
    # Start with technique name
    query_parts = [technique["name"]]

    # Add key words from description (first 10 words)
    desc_words = technique["description"].split()[:10]
    important_words = [w for w in desc_words if len(w) > 4 and w.isalpha()]
    query_parts.extend(important_words[:3])

    # Add assurance goals
    query_parts.extend(technique["assurance_goals"][:2])

    # Join and clean
    query = " ".join(query_parts)
    query = " ".join(query.split())  # Remove extra spaces

    return query


def classify_resource_type(url: str, title: str, source: str) -> str:
    """Classify the type of resource based on URL and title."""
    url_lower = url.lower()
    title_lower = title.lower()

    # Paper detection
    if source in ["arxiv", "semantic_scholar"]:
        return "paper"
    if "paper" in title_lower or "pdf" in url_lower or "publication" in title_lower:
        return "paper"

    # Software/tool detection
    if source == "github" or "github.com" in url_lower:
        return "software"
    if any(
        term in title_lower
        for term in ["library", "framework", "toolkit", "package", "sdk"]
    ):
        return "tool"

    # Tutorial detection
    if any(
        term in title_lower
        for term in ["tutorial", "guide", "how to", "getting started"]
    ):
        return "tutorial"

    # Documentation detection
    if any(term in url_lower for term in ["docs", "documentation", "api", "reference"]):
        return "documentation"
    if any(term in title_lower for term in ["documentation", "reference", "manual"]):
        return "documentation"

    # Default
    return "paper" if source in ["arxiv", "semantic_scholar"] else "tutorial"
