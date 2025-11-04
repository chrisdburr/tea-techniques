#!/usr/bin/env python3
"""Test script for Phase 2 TEA Search pipeline components."""

import json
import sys
from pathlib import Path

# Add lib to path
sys.path.insert(0, str(Path(__file__).parent / "lib" / "tea-search"))

from modules.utils.io import generate_search_id, save_search_results


def run_basic_search_test():
    """Test basic search functionality with sample technique."""
    print("=" * 60)
    print("PHASE 2 TEST: Basic Search Module Test")
    print("=" * 60)

    # Load sample technique
    sample_path = Path("test/techniques/sample-technique.json")
    with open(sample_path, "r") as f:
        technique = json.load(f)

    print(f"\n✅ Loaded technique: {technique['name']}")
    print(f"   Description: {technique['description'][:100]}...")

    # Generate search ID
    search_id = generate_search_id()
    print(f"\n✅ Generated search_id: {search_id}")

    # Test saving mock results
    mock_results = [
        {
            "title": "Test Paper on Differential Privacy",
            "url": "https://example.com/paper1",
            "abstract": "This is a test paper about differential privacy...",
            "source": "test",
            "authors": ["Test Author"],
            "date": "2024-01-01",
        }
    ]

    filepath, sid = save_search_results(
        mock_results, "test_provider", technique["slug"], search_id
    )

    print(f"\n✅ Saved mock results to: {filepath}")

    # Verify file exists
    if Path(filepath).exists():
        print("✅ File verified to exist")
        with open(filepath, "r") as f:
            data = json.load(f)
            print(f"✅ File contains {data['count']} results")

    return search_id


def test_search_modules():
    """Test all search modules with sample technique."""
    print("\n" + "=" * 60)
    print("PHASE 2 TEST: All Search Modules")
    print("=" * 60)

    sample_path = Path("test/techniques/sample-technique.json")
    with open(sample_path, "r") as f:
        technique = json.load(f)

    technique_json = json.dumps(technique)
    search_id = generate_search_id()

    print(f"\n🔍 Testing search modules with search_id: {search_id}\n")

    # Test each provider
    providers = ["arxiv", "github", "google", "semantic_scholar"]
    results = {}

    for provider in providers:
        print(f"Testing {provider}...")
        try:
            # Run the module
            import subprocess

            cmd = [
                "uv",
                "run",
                "python",
                "-m",
                f"lib.tea-search.modules.search.{provider}",
                technique_json,
                "3",  # Just 3 results for testing
                "--search-id",
                search_id,
            ]

            result = subprocess.run(cmd, capture_output=True, text=True, timeout=30)

            if result.returncode == 0:
                output = json.loads(result.stdout)
                print(f"  ✅ {provider}: {output['count']} results saved")
                results[provider] = "success"
            else:
                print(f"  ❌ {provider}: {result.stderr[:100]}")
                results[provider] = "failed"

        except subprocess.TimeoutExpired:
            print(f"  ⚠️ {provider}: Timeout")
            results[provider] = "timeout"
        except Exception as e:
            print(f"  ❌ {provider}: {str(e)[:100]}")
            results[provider] = "error"

    print("\n📊 Summary:")
    for provider, status in results.items():
        emoji = "✅" if status == "success" else "❌"
        print(f"  {emoji} {provider}: {status}")

    return search_id


def test_io_functions():
    """Test I/O utility functions."""
    print("\n" + "=" * 60)
    print("PHASE 2 TEST: I/O Utilities")
    print("=" * 60)

    from modules.utils.io import (
        get_search_session_info,
        load_results,
        save_evaluation_results,
        save_selected_results,
    )

    # Generate test search ID
    search_id = generate_search_id()
    print(f"\n✅ Generated search_id: {search_id}")

    # Test saving evaluations
    mock_evaluations = [
        {
            "title": "Test Resource",
            "url": "https://example.com",
            "relevance_score": 0.85,
            "resource_type": "paper",
            "recommendation": "include",
        }
    ]

    eval_path = save_evaluation_results(mock_evaluations, search_id)
    print(f"✅ Saved evaluations: {eval_path}")

    # Test saving selections
    mock_selections = [
        {
            "title": "Selected Resource",
            "url": "https://example.com",
            "type": "paper",
            "relevance_score": 0.85,
            "description": "Test description",
        }
    ]

    select_path = save_selected_results(mock_selections, search_id)
    print(f"✅ Saved selections: {select_path}")

    # Test loading results
    loaded = load_results(eval_path)
    print(f"✅ Loaded {loaded['count']} evaluations")

    # Test session info
    session_info = get_search_session_info(search_id)
    print("✅ Session info retrieved:")
    for stage, info in session_info["stages"].items():
        if info["exists"]:
            print(f"   - {stage}: {info['file_count']} files")

    return True


if __name__ == "__main__":
    print("\n🚀 Starting Phase 2 Component Tests\n")

    try:
        # Test 1: Basic functionality
        search_id1 = run_basic_search_test()

        # Test 2: I/O utilities
        test_io_functions()

        # Test 3: All search modules (may require API keys)
        print("\n⚠️ Note: Full search module test requires API keys in .env")
        print("Skipping full search test - run manually if API keys are configured")
        # search_id2 = test_search_modules()

        print("\n" + "=" * 60)
        print("✅ PHASE 2 TESTS COMPLETED SUCCESSFULLY")
        print("=" * 60)
        print("\nNext steps:")
        print("1. Configure API keys in .env file")
        print("2. Test individual subagents with Task tool")
        print("3. Run /enrich-techniques command on sample file")

    except Exception as e:
        print(f"\n❌ Test failed: {e}")
        import traceback

        traceback.print_exc()
        sys.exit(1)
