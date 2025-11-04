"""I/O utilities for saving and loading search results."""

import json
import uuid
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple


def generate_search_id() -> str:
    """
    Generate a unique search ID for tracking results through the pipeline.

    Format: YYYYMMDD_HHMMSS_UUID8
    Example: 20250129_143025_a1b2c3d4
    """
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    short_uuid = str(uuid.uuid4())[:8]
    return f"{timestamp}_{short_uuid}"


def save_search_results(
    results: List[Dict[str, Any]],
    provider: str,
    technique_slug: str,
    search_id: str = None,
    output_dir: str = "lib/tea_search/results",
) -> Tuple[str, str]:
    """
    Save search results from a single provider with a unique ID.

    Args:
        results: List of search results from the provider
        provider: Name of the search provider (arxiv, github, etc.)
        technique_slug: Slug identifier for the technique
        search_id: Optional search ID (generated if not provided)
        output_dir: Directory to save results

    Returns:
        Tuple of (filepath, search_id)
    """
    # Generate search ID if not provided
    if search_id is None:
        search_id = generate_search_id()

    # Create output directory structure
    output_path = Path(output_dir) / "search" / search_id
    output_path.mkdir(parents=True, exist_ok=True)

    # Generate filename
    filename = f"{provider}_{search_id}.json"
    filepath = output_path / filename

    # Prepare data with metadata
    data = {
        "search_id": search_id,
        "provider": provider,
        "technique_slug": technique_slug,
        "timestamp": datetime.now().isoformat(),
        "count": len(results),
        "results": results,
    }

    # Save to file
    with open(filepath, "w") as f:
        json.dump(data, f, indent=2, default=str)

    print(f"Saved {provider} results: {filepath}")
    return str(filepath), search_id


def save_evaluation_results(
    evaluations: List[Dict[str, Any]],
    search_id: str,
    output_dir: str = "lib/tea-search/results",
) -> str:
    """
    Save evaluation results for a search session.

    Args:
        evaluations: List of evaluated resources
        search_id: Search ID to link with search results
        output_dir: Directory to save results

    Returns:
        Path to saved file
    """
    # Create output directory
    output_path = Path(output_dir) / "evaluated" / search_id
    output_path.mkdir(parents=True, exist_ok=True)

    # Generate filename
    filename = f"evaluated_{search_id}.json"
    filepath = output_path / filename

    # Prepare data with metadata
    data = {
        "search_id": search_id,
        "stage": "evaluated",
        "timestamp": datetime.now().isoformat(),
        "count": len(evaluations),
        "results": evaluations,
    }

    # Save to file
    with open(filepath, "w") as f:
        json.dump(data, f, indent=2, default=str)

    return str(filepath)


def save_selected_results(
    selected: List[Dict[str, Any]],
    search_id: str,
    output_dir: str = "lib/tea-search/results",
) -> str:
    """
    Save final selected resources for a search session.

    Args:
        selected: List of selected resources
        search_id: Search ID to link with search results
        output_dir: Directory to save results

    Returns:
        Path to saved file
    """
    # Create output directory
    output_path = Path(output_dir) / "selected" / search_id
    output_path.mkdir(parents=True, exist_ok=True)

    # Generate filename
    filename = f"selected_{search_id}.json"
    filepath = output_path / filename

    # Prepare data with metadata
    data = {
        "search_id": search_id,
        "stage": "selected",
        "timestamp": datetime.now().isoformat(),
        "count": len(selected),
        "results": selected,
    }

    # Save to file
    with open(filepath, "w") as f:
        json.dump(data, f, indent=2, default=str)

    return str(filepath)


def load_results(filepath: str) -> Dict[str, Any]:
    """
    Load results from a JSON file.

    Args:
        filepath: Path to the JSON file

    Returns:
        Dictionary containing results and metadata
    """
    with open(filepath, "r") as f:
        return json.load(f)


def save_technique_with_resources(
    technique_path: str,
    resources: List[Dict[str, Any]],
    output_path: Optional[str] = None,
) -> str:
    """
    Update a technique JSON file with discovered resources.

    Args:
        technique_path: Path to original technique JSON
        resources: List of selected resources
        output_path: Optional different output path (if None, overwrites original)

    Returns:
        Path to updated file
    """
    # Load original technique
    with open(technique_path, "r") as f:
        technique = json.load(f)

    # Add resources array
    technique["resources"] = resources
    technique["resources_updated"] = datetime.now().isoformat()
    technique["resources_count"] = len(resources)

    # Determine output path
    if output_path is None:
        output_path = technique_path

    # Save updated technique
    with open(output_path, "w") as f:
        json.dump(technique, f, indent=2)

    return output_path


def combine_search_results(
    results_by_provider: Dict[str, List[Dict]],
    technique_slug: str,
    search_id: str = None,
    save_combined: bool = False,
    output_dir: str = "lib/tea-search/results",
) -> Tuple[List[Dict], Optional[str]]:
    """
    Combine results from multiple search providers.

    Args:
        results_by_provider: Dictionary mapping provider name to results
        technique_slug: Slug identifier for the technique
        search_id: Search ID for tracking (generated if save_combined is True and not provided)
        save_combined: Whether to save combined results to file
        output_dir: Directory to save results

    Returns:
        Tuple of (combined results list, search_id if saved)
    """
    combined = []

    for provider, results in results_by_provider.items():
        # Add provider info to each result if not present
        for result in results:
            if "source" not in result:
                result["source"] = provider
            combined.append(result)

    saved_search_id = None
    if save_combined:
        if search_id is None:
            search_id = generate_search_id()

        # Save combined results
        output_path = Path(output_dir) / "combined" / search_id
        output_path.mkdir(parents=True, exist_ok=True)

        filename = f"combined_{search_id}.json"
        filepath = output_path / filename

        data = {
            "search_id": search_id,
            "technique_slug": technique_slug,
            "stage": "combined_search",
            "timestamp": datetime.now().isoformat(),
            "count": len(combined),
            "providers": list(results_by_provider.keys()),
            "results": combined,
        }

        with open(filepath, "w") as f:
            json.dump(data, f, indent=2, default=str)

        saved_search_id = search_id
        print(f"Saved combined results: {filepath}")

    return combined, saved_search_id


def load_search_results_by_id(
    search_id: str,
    provider: str = None,
    stage: str = "search",
    output_dir: str = "lib/tea-search/results",
) -> Optional[Dict[str, Any]]:
    """
    Load search results by search ID.

    Args:
        search_id: The unique search ID
        provider: Optional specific provider to load (if None, loads all)
        stage: Stage to load from (search, evaluated, selected, combined)
        output_dir: Directory containing results

    Returns:
        Results dictionary or None if not found
    """
    base_path = Path(output_dir) / stage / search_id

    if not base_path.exists():
        return None

    if provider:
        # Load specific provider results
        filename = f"{provider}_{search_id}.json"
        filepath = base_path / filename
        if filepath.exists():
            return load_results(str(filepath))
    else:
        # Load all results for this search ID
        all_results = {}
        for json_file in base_path.glob(f"*_{search_id}.json"):
            provider_name = json_file.stem.split("_")[0]
            all_results[provider_name] = load_results(str(json_file))
        return all_results if all_results else None

    return None


def get_search_session_info(
    search_id: str,
    output_dir: str = "lib/tea-search/results",
) -> Dict[str, Any]:
    """
    Get information about a complete search session.

    Args:
        search_id: The unique search ID
        output_dir: Directory containing results

    Returns:
        Dictionary with session information
    """
    session_info = {
        "search_id": search_id,
        "stages": {},
    }

    # Check each stage
    for stage in ["search", "evaluated", "selected", "combined"]:
        stage_path = Path(output_dir) / stage / search_id
        if stage_path.exists():
            files = list(stage_path.glob("*.json"))
            session_info["stages"][stage] = {
                "exists": True,
                "file_count": len(files),
                "files": [str(f.name) for f in files],
            }
        else:
            session_info["stages"][stage] = {"exists": False}

    return session_info
