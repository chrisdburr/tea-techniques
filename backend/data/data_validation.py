import csv
import json
import requests
from bs4 import BeautifulSoup
import time
from datetime import datetime
import re
import os
import sys
from difflib import SequenceMatcher
import argparse


def similarity_score(a, b):
    """Calculate text similarity between two strings using SequenceMatcher."""
    return SequenceMatcher(None, a, b).ratio()


def normalize_title(title):
    """Normalize a title by removing common prefixes, suffixes, and special characters."""
    # Convert to lowercase
    title = title.lower()

    # Remove arXiv identifier pattern [xxxx.xxxxx]
    title = re.sub(r"\[\d{4}\.\d{5}\]", "", title)

    # Remove GitHub prefix pattern
    title = re.sub(r"^github\s*-\s*[^:]+:\s*", "", title)

    # Remove version/documentation suffixes
    title = re.sub(r"—\s*[^—]+\s*documentation$", "", title)
    title = re.sub(r"— [^—]+ \d+\.\d+(\.\d+)? documentation$", "", title)

    # Remove common site suffixes
    title = re.sub(r"\|\s*(openreview|springerlink|plos\s+one)$", "", title)

    # Remove punctuation and extra spaces
    title = re.sub(r"[^\w\s]", " ", title)
    title = re.sub(r"\s+", " ", title).strip()

    return title


def extract_main_title_words(title, min_length=4):
    """Extract the main meaningful words from a title for keyword matching."""
    # Normalize the title
    title = normalize_title(title)

    # Split into words and filter out short words and common words
    words = title.split()
    stopwords = {
        "and",
        "the",
        "for",
        "with",
        "from",
        "using",
        "via",
        "in",
        "on",
        "of",
        "to",
        "a",
        "an",
    }

    return [
        word
        for word in words
        if len(word) >= min_length and word.lower() not in stopwords
    ]


def check_url_resolves_to_title(
    url,
    expected_title,
    similarity_threshold=0.6,
    keyword_match_threshold=0.7,
    verbose=True,
):
    """
    Sends a GET request to the url, parses out the <title> text,
    and checks if the title matches the expected title using flexible matching.

    Parameters:
    - url: URL to check
    - expected_title: Expected title text
    - similarity_threshold: Threshold for similarity score (0-1)
    - keyword_match_threshold: Threshold for keyword matching (0-1)
    - verbose: Whether to print verbose output

    Returns a tuple of (bool, str, dict).
      - bool: indicates success/failure
      - str: explains reason if failure or success details
      - dict: additional details about the match
    """
    if verbose:
        print(f"  Checking URL: {url}")
        print(f"  Expected title to contain: '{expected_title}'")

    start_time = time.time()
    try:
        if verbose:
            print("  Sending request...", end="", flush=True)
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
        }
        response = requests.get(url, timeout=10, headers=headers)
        request_time = time.time() - start_time
        if verbose:
            print(f" Done ({request_time:.2f}s)")

        if response.status_code != 200:
            return (
                False,
                f"HTTP {response.status_code}",
                {"status_code": response.status_code},
            )

        if verbose:
            print("  Parsing HTML...", end="", flush=True)
        soup = BeautifulSoup(response.text, "html.parser")
        title_tag = soup.find("title")
        if not title_tag:
            return (False, "No <title> found.", {"page_title": None})

        page_title = title_tag.get_text().strip()
        if verbose:
            print(f" Done. Found title: '{page_title}'")

        # Method 1: Direct substring check (case-insensitive)
        direct_match = expected_title.lower() in page_title.lower()

        # Method 2: Similarity score
        sim_score = similarity_score(
            normalize_title(expected_title), normalize_title(page_title)
        )

        # Method 3: Keyword matching
        expected_keywords = extract_main_title_words(expected_title)
        actual_keywords = extract_main_title_words(page_title)

        if not expected_keywords:
            keyword_match_ratio = 0
        else:
            matching_keywords = [
                k for k in expected_keywords if any(k in a for a in actual_keywords)
            ]
            keyword_match_ratio = len(matching_keywords) / len(expected_keywords)

        match_details = {
            "page_title": page_title,
            "normalized_expected": normalize_title(expected_title),
            "normalized_actual": normalize_title(page_title),
            "direct_match": direct_match,
            "similarity_score": sim_score,
            "expected_keywords": expected_keywords,
            "actual_keywords": actual_keywords,
            "matching_keywords": (
                matching_keywords if "matching_keywords" in locals() else []
            ),
            "keyword_match_ratio": keyword_match_ratio,
            "review_priority": 0,  # To be calculated below
        }

        # Decision logic:
        # 1. If it's a direct substring match, it's a success
        if direct_match:
            match_details["review_priority"] = 10  # Low priority - clear success
            return (
                True,
                f"Direct match! Expected title is contained in the page title.",
                match_details,
            )

        # 2. If similarity score is high enough, it's a success
        if sim_score >= similarity_threshold:
            match_details["review_priority"] = 20  # Low-medium priority
            return (
                True,
                f"Similar match (score: {sim_score:.2f})! Titles are similar enough.",
                match_details,
            )

        # 3. If enough keywords match, it's a success
        if keyword_match_ratio >= keyword_match_threshold:
            match_details["review_priority"] = 30  # Medium priority
            return (
                True,
                f"Keyword match ({keyword_match_ratio:.0%})! Main keywords from expected title appear in page title.",
                match_details,
            )

        # For failures, calculate review priority:
        # Higher similarity scores are more likely to be just formatting issues (high priority for review)
        # Very low scores might be completely wrong URLs (also high priority)
        if sim_score > 0.4:  # Close but not close enough
            match_details["review_priority"] = 40  # High priority - likely fixable
        elif sim_score < 0.2:  # Very different
            match_details["review_priority"] = 50  # Highest priority - likely wrong URL
        else:
            match_details["review_priority"] = 45  # Medium-high priority

        # Otherwise, it's a failure
        return (
            False,
            f"Title mismatch: Expected '{expected_title}', got '{page_title}'. Similarity: {sim_score:.2f}, Keyword match: {keyword_match_ratio:.0%}",
            match_details,
        )

    except requests.exceptions.RequestException as e:
        # Covers timeouts, connection errors, etc.
        return (
            False,
            f"Request error: {e}",
            {"error": str(e), "review_priority": 60},
        )  # Very high priority - broken link
    finally:
        total_time = time.time() - start_time
        if verbose:
            print(f"  Check completed in {total_time:.2f} seconds")


def export_to_csv(results, filename):
    """Export results to a CSV file."""
    try:
        # Create directory if it doesn't exist
        os.makedirs(os.path.dirname(filename), exist_ok=True)

        print(f"Exporting CSV results to: {os.path.abspath(filename)}")

        with open(filename, "w", newline="", encoding="utf-8") as csvfile:
            fieldnames = [
                "row_id",
                "resource_title",
                "url",
                "status",
                "reason",
                "actual_title",
                "similarity_score",
                "keyword_match_ratio",
                "review_priority",
                "suggestion",
            ]
            writer = csv.DictWriter(csvfile, fieldnames=fieldnames)
            writer.writeheader()

            for row_id, title, url, passed, reason, match_details in results:
                # Prepare suggestion based on match details
                suggestion = ""
                if not passed:
                    if "status_code" in match_details:
                        suggestion = f"Check if URL is correct (HTTP {match_details['status_code']})"
                    elif (
                        "page_title" in match_details
                        and match_details["page_title"] is None
                    ):
                        suggestion = "Page has no title element"
                    elif "error" in match_details:
                        suggestion = f"Connection error - verify URL is accessible"
                    elif "page_title" in match_details:
                        suggestion = f"Consider updating expected title to: '{match_details.get('page_title', '')}'"

                # Get values or defaults
                status = "PASS" if passed else "FAIL"
                actual_title = (
                    match_details.get("page_title", "")
                    if "page_title" in match_details
                    else ""
                )
                similarity = (
                    match_details.get("similarity_score", 0)
                    if "similarity_score" in match_details
                    else 0
                )
                keyword_ratio = (
                    match_details.get("keyword_match_ratio", 0)
                    if "keyword_match_ratio" in match_details
                    else 0
                )
                review_priority = match_details.get("review_priority", 0)

                writer.writerow(
                    {
                        "row_id": row_id,
                        "resource_title": title,
                        "url": url,
                        "status": status,
                        "reason": reason,
                        "actual_title": actual_title,
                        "similarity_score": f"{similarity:.2f}" if similarity else "",
                        "keyword_match_ratio": (
                            f"{keyword_ratio:.2f}" if keyword_ratio else ""
                        ),
                        "review_priority": review_priority,
                        "suggestion": suggestion,
                    }
                )

        print(f"Successfully wrote {len(results)} rows to {filename}")
        return True
    except Exception as e:
        print(f"ERROR: Failed to export CSV: {e}")
        return False


def generate_html_report(results, filename, summary_data=None):
    """Generate an HTML report with sortable tables."""
    try:
        # Create directory if it doesn't exist
        os.makedirs(os.path.dirname(filename), exist_ok=True)

        print(f"Generating HTML report at: {os.path.abspath(filename)}")

        html_start = """<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>URL Validation Results</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        h1, h2 { color: #333; }
        .summary { margin-bottom: 30px; background-color: #f5f5f5; padding: 15px; border-radius: 5px; }
        table { border-collapse: collapse; width: 100%; margin-bottom: 20px; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f2f2f2; cursor: pointer; position: relative; }
        th:hover { background-color: #ddd; }
        th::after { content: ""; position: absolute; right: 5px; }
        th.sorted-asc::after { content: "▲"; }
        th.sorted-desc::after { content: "▼"; }
        tr:nth-child(even) { background-color: #f9f9f9; }
        tr:hover { background-color: #f1f1f1; }
        .pass { background-color: #dff0d8; }
        .fail { background-color: #f2dede; }
        .filters { margin-bottom: 15px; }
        .filters input, .filters select { margin-right: 10px; padding: 5px; }
        .priority-high { background-color: #ffcccc; }
        .priority-medium { background-color: #ffffcc; }
        .priority-low { background-color: #ccffcc; }
        .error-type { font-weight: bold; }
    </style>
</head>
<body>
    <h1>URL Validation Results</h1>
"""

        # Add summary section
        if summary_data:
            summary_html = f"""
    <div class="summary">
        <h2>Summary</h2>
        <p>Generated on: {summary_data.get('timestamp', '')}</p>
        <p>Total rows: {summary_data.get('total_rows', 0)}</p>
        <p>Total resources: {summary_data.get('total_resources', 0)}</p>
        <p>Successful checks: {summary_data.get('total_success', 0)} ({summary_data.get('success_percentage', '0')}%)</p>
        <p>Failed checks: {summary_data.get('total_failure', 0)} ({summary_data.get('failure_percentage', '0')}%)</p>
        
        <h3>Failure Types:</h3>
        <ul>
"""
            # Add failure types
            for failure_type, count in summary_data.get("failure_types", {}).items():
                if count > 0:
                    percentage = count / summary_data.get("total_failure", 1) * 100
                    summary_html += f"            <li>{failure_type.replace('_', ' ').title()}: {count} ({percentage:.1f}%)</li>\n"

            summary_html += """
        </ul>
    </div>
"""
        else:
            summary_html = ""

        # Add filter controls
        filter_controls = """
    <div class="filters">
        <input type="text" id="searchInput" placeholder="Search...">
        <select id="statusFilter">
            <option value="all">All Status</option>
            <option value="PASS">Pass</option>
            <option value="FAIL">Fail</option>
        </select>
        <select id="priorityFilter">
            <option value="all">All Priorities</option>
            <option value="high">High Priority</option>
            <option value="medium">Medium Priority</option>
            <option value="low">Low Priority</option>
        </select>
        <button onclick="resetFilters()">Reset Filters</button>
    </div>
"""

        # Start the table
        table_html = """
    <table id="resultsTable">
        <thead>
            <tr>
                <th onclick="sortTable(0)">Row ID</th>
                <th onclick="sortTable(1)">Resource Title</th>
                <th onclick="sortTable(2)">URL</th>
                <th onclick="sortTable(3)">Status</th>
                <th onclick="sortTable(4)">Actual Title</th>
                <th onclick="sortTable(5)">Similarity</th>
                <th onclick="sortTable(6)">Keyword Match</th>
                <th onclick="sortTable(7)" class="sorted-desc">Priority</th>
                <th onclick="sortTable(8)">Suggestion</th>
            </tr>
        </thead>
        <tbody>
"""

        # Add rows
        for row_id, title, url, passed, reason, match_details in results:
            status = "PASS" if passed else "FAIL"
            status_class = "pass" if passed else "fail"

            # Get priority class
            priority = match_details.get("review_priority", 0)
            if priority >= 50:
                priority_class = "priority-high"
            elif priority >= 30:
                priority_class = "priority-medium"
            else:
                priority_class = "priority-low"

            # Get actual title
            actual_title = (
                match_details.get("page_title", "")
                if "page_title" in match_details
                else ""
            )

            # Get metrics
            similarity = (
                match_details.get("similarity_score", 0)
                if "similarity_score" in match_details
                else 0
            )
            keyword_ratio = (
                match_details.get("keyword_match_ratio", 0)
                if "keyword_match_ratio" in match_details
                else 0
            )

            # Get suggestion
            suggestion = ""
            if not passed:
                if "status_code" in match_details:
                    suggestion = (
                        f"Check if URL is correct (HTTP {match_details['status_code']})"
                    )
                elif (
                    "page_title" in match_details
                    and match_details["page_title"] is None
                ):
                    suggestion = "Page has no title element"
                elif "error" in match_details:
                    suggestion = f"Connection error - verify URL is accessible"
                elif "page_title" in match_details:
                    suggestion = (
                        f"Consider updating expected title to: '{actual_title}'"
                    )

            # Add the row
            table_html += f"""
            <tr class="{status_class} {priority_class}" data-priority="{priority}" data-status="{status}">
                <td>{row_id}</td>
                <td>{title}</td>
                <td><a href="{url}" target="_blank">{url}</a></td>
                <td>{status}</td>
                <td>{actual_title}</td>
                <td>{similarity:.2f}</td>
                <td>{keyword_ratio:.2f}</td>
                <td>{priority}</td>
                <td>{suggestion}</td>
            </tr>
"""

        # Close the table
        table_html += """
        </tbody>
    </table>
"""

        # Add JavaScript for sorting and filtering
        js_code = """
    <script>
        // Initial sort by priority (column 7) in descending order
        window.onload = function() {
            sortTable(7, true); // Sort by priority column in descending order
        };
        
        function sortTable(columnIndex, initialSort = false) {
            const table = document.getElementById('resultsTable');
            const header = table.getElementsByTagName('th')[columnIndex];
            const tbody = table.getElementsByTagName('tbody')[0];
            const rows = Array.from(tbody.getElementsByTagName('tr'));
            
            // Check current sort direction
            let sortDirection = 'asc';
            if (!initialSort) {
                if (header.classList.contains('sorted-asc')) {
                    sortDirection = 'desc';
                }
            } else {
                sortDirection = 'desc'; // For initial load
            }
            
            // Remove sorting classes from all headers
            const headers = table.getElementsByTagName('th');
            for (let i = 0; i < headers.length; i++) {
                headers[i].classList.remove('sorted-asc', 'sorted-desc');
            }
            
            // Add appropriate class to the current header
            header.classList.add(sortDirection === 'asc' ? 'sorted-asc' : 'sorted-desc');
            
            // Sort the rows
            rows.sort((a, b) => {
                let aValue = a.getElementsByTagName('td')[columnIndex].textContent;
                let bValue = b.getElementsByTagName('td')[columnIndex].textContent;
                
                // Handle numeric values
                if (!isNaN(aValue) && !isNaN(bValue)) {
                    aValue = parseFloat(aValue) || 0;
                    bValue = parseFloat(bValue) || 0;
                }
                
                // Compare values
                if (aValue < bValue) {
                    return sortDirection === 'asc' ? -1 : 1;
                } else if (aValue > bValue) {
                    return sortDirection === 'asc' ? 1 : -1;
                }
                return 0;
            });
            
            // Update the table
            rows.forEach(row => tbody.appendChild(row));
            
            // Apply filters after sorting
            applyFilters();
        }
        
        function applyFilters() {
            const searchTerm = document.getElementById('searchInput').value.toLowerCase();
            const statusFilter = document.getElementById('statusFilter').value;
            const priorityFilter = document.getElementById('priorityFilter').value;
            
            const rows = document.querySelectorAll('#resultsTable tbody tr');
            
            rows.forEach(row => {
                let showRow = true;
                
                // Check search term
                if (searchTerm) {
                    const text = row.textContent.toLowerCase();
                    if (!text.includes(searchTerm)) {
                        showRow = false;
                    }
                }
                
                // Check status filter
                if (statusFilter !== 'all') {
                    const rowStatus = row.getAttribute('data-status');
                    if (rowStatus !== statusFilter) {
                        showRow = false;
                    }
                }
                
                // Check priority filter
                if (priorityFilter !== 'all') {
                    const priority = parseInt(row.getAttribute('data-priority'));
                    if (priorityFilter === 'high' && priority < 50) showRow = false;
                    if (priorityFilter === 'medium' && (priority < 30 || priority >= 50)) showRow = false;
                    if (priorityFilter === 'low' && priority >= 30) showRow = false;
                }
                
                // Show or hide the row
                row.style.display = showRow ? '' : 'none';
            });
        }
        
        function resetFilters() {
            document.getElementById('searchInput').value = '';
            document.getElementById('statusFilter').value = 'all';
            document.getElementById('priorityFilter').value = 'all';
            applyFilters();
        }
        
        // Attach event listeners
        document.getElementById('searchInput').addEventListener('input', applyFilters);
        document.getElementById('statusFilter').addEventListener('change', applyFilters);
        document.getElementById('priorityFilter').addEventListener('change', applyFilters);
    </script>
"""

        # Build the complete HTML
        complete_html = (
            html_start
            + summary_html
            + filter_controls
            + table_html
            + js_code
            + """
</body>
</html>
"""
        )

        # Write the HTML file
        with open(filename, "w", encoding="utf-8") as f:
            f.write(complete_html)

        print(f"Successfully created HTML report at {filename}")
        return True
    except Exception as e:
        print(f"ERROR: Failed to create HTML report: {e}")
        return False


def main(csv_path, output_dir="validation_results", verbose=True):
    # Create output directory if it doesn't exist
    try:
        # Use absolute path for clarity in the output
        output_dir = os.path.abspath(output_dir)

        if not os.path.exists(output_dir):
            os.makedirs(output_dir)
            print(f"Created output directory: {output_dir}")
        else:
            print(f"Using existing output directory: {output_dir}")

    except Exception as e:
        print(f"ERROR: Failed to create output directory: {e}")
        print(f"Will try to save files in current directory instead.")
        output_dir = os.path.abspath(".")

    timestamp = datetime.now().strftime("%Y-%m-%d_%H-%M-%S")

    if verbose:
        print(f"\n{'='*80}")
        print(
            f"STARTING URL VALIDATION at {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}"
        )
        print(f"CSV file: {csv_path}")
        print(f"{'='*80}\n")

    # Check if the CSV file exists
    if not os.path.exists(csv_path):
        print(f"ERROR: CSV file not found: {csv_path}")
        print(f"Current working directory: {os.getcwd()}")
        print(f"Files in current directory: {os.listdir('.')}")
        return

    start_time = time.time()

    # We'll track all results in a list
    results = (
        []
    )  # (row_id, resource_title, url, passed_bool, failure_reason, match_details)
    total_rows = 0
    total_resources = 0
    total_success = 0
    total_failure = 0
    failure_types = {
        "http_error": 0,
        "no_title": 0,
        "title_mismatch": 0,
        "request_error": 0,
        "other": 0,
    }

    try:
        with open(csv_path, "r", encoding="utf-8") as csvfile:
            reader = csv.DictReader(csvfile)

            if verbose:
                print(f"CSV columns found: {', '.join(reader.fieldnames)}")
                print("\nBeginning validation process...")

            for row in reader:
                total_rows += 1
                row_id = row.get("id", "N/A")
                if verbose:
                    print(f"\n{'-'*80}")
                    print(f"Processing Row ID: {row_id} (row #{total_rows})")

                resources_str = row.get("resources", "")

                # If there are no resources, record that we had no checks
                if not resources_str:
                    if verbose:
                        print("  No resources field or empty value.")
                    results.append((row_id, "", "", True, "No resources to check.", {}))
                    continue

                # Try to parse the resources column, which we expect is JSON
                try:
                    if verbose:
                        print(f"  Parsing resources JSON...")
                    resources = json.loads(resources_str)
                    if verbose:
                        print(
                            f"  Successfully parsed JSON with {len(resources) if isinstance(resources, list) else 0} resources"
                        )
                except json.JSONDecodeError as e:
                    if verbose:
                        print(f"  ERROR: Invalid JSON in resources field: {e}")
                    results.append(
                        (
                            row_id,
                            "",
                            "",
                            False,
                            f"resources field not valid JSON: {e}",
                            {"review_priority": 99},
                        )
                    )
                    total_failure += 1
                    failure_types["other"] += 1
                    continue

                # If resources is not a list, skip
                if not isinstance(resources, list):
                    if verbose:
                        print(
                            f"  ERROR: resources field is not a list, got {type(resources).__name__}"
                        )
                    results.append(
                        (
                            row_id,
                            "",
                            "",
                            False,
                            f"resources field not a list, got {type(resources).__name__}.",
                            {"review_priority": 99},
                        )
                    )
                    total_failure += 1
                    failure_types["other"] += 1
                    continue

                if not resources:
                    if verbose:
                        print("  Resources list is empty.")
                    results.append(
                        (
                            row_id,
                            "",
                            "",
                            True,
                            "Resources list is empty.",
                            {"review_priority": 0},
                        )
                    )
                    continue

                # For each resource, check the URL
                if verbose:
                    print(f"  Found {len(resources)} resources to check")
                for i, resource in enumerate(resources, 1):
                    total_resources += 1
                    if verbose:
                        print(f"\n  Resource #{i}:")

                    resource_title = resource.get("title", "")
                    if not resource_title and verbose:
                        print("    WARNING: No title provided for this resource")

                    url = resource.get("url")

                    if not url:
                        # If there's no URL, record as a failure
                        if verbose:
                            print("    ERROR: No URL provided for this resource")
                        total_failure += 1
                        failure_types["other"] += 1
                        results.append(
                            (
                                row_id,
                                resource_title,
                                "",
                                False,
                                "No URL provided.",
                                {"review_priority": 99},
                            )
                        )
                        continue

                    # Check the URL
                    passed, reason, match_details = check_url_resolves_to_title(
                        url, resource_title, verbose=verbose
                    )

                    if passed:
                        if verbose:
                            print(f"    ✅ SUCCESS: {reason}")
                        total_success += 1
                    else:
                        if verbose:
                            print(f"    ❌ FAILED: {reason}")
                        total_failure += 1

                        # Categorize the failure
                        if "status_code" in match_details:
                            failure_types["http_error"] += 1
                        elif (
                            "page_title" in match_details
                            and match_details["page_title"] is None
                        ):
                            failure_types["no_title"] += 1
                        elif "error" in match_details:
                            failure_types["request_error"] += 1
                        elif "page_title" in match_details:
                            failure_types["title_mismatch"] += 1
                        else:
                            failure_types["other"] += 1

                    results.append(
                        (row_id, resource_title, url, passed, reason, match_details)
                    )

    except FileNotFoundError:
        print(f"ERROR: CSV file not found: {csv_path}")
        print(f"Current working directory: {os.getcwd()}")
        print(f"Files in current directory: {os.listdir('.')}")
        return
    except Exception as e:
        print(f"ERROR: An unexpected error occurred: {e}")
        return

    # Calculate elapsed time
    elapsed_time = time.time() - start_time

    # Sort results by review priority (highest first)
    results.sort(
        key=lambda x: x[5].get("review_priority", 0) if isinstance(x[5], dict) else 0,
        reverse=True,
    )

    # Export to files
    csv_filename = os.path.join(output_dir, f"validation_results_{timestamp}.csv")
    html_filename = os.path.join(output_dir, f"validation_results_{timestamp}.html")

    # Also save a copy with a fixed name for easier access
    latest_csv = os.path.join(output_dir, "latest_validation_results.csv")
    latest_html = os.path.join(output_dir, "latest_validation_results.html")

    csv_success = export_to_csv(results, csv_filename)

    # Prepare summary data for HTML report
    summary_data = {
        "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        "total_rows": total_rows,
        "total_resources": total_resources,
        "total_success": total_success,
        "total_failure": total_failure,
        "success_percentage": (
            f"{(total_success/total_resources*100):.1f}" if total_resources else "0"
        ),
        "failure_percentage": (
            f"{(total_failure/total_resources*100):.1f}" if total_resources else "0"
        ),
        "failure_types": failure_types,
    }

    html_success = generate_html_report(results, html_filename, summary_data)

    # Create the "latest" copies
    if csv_success:
        try:
            import shutil

            shutil.copy2(csv_filename, latest_csv)
            print(f"Also saved results to: {os.path.abspath(latest_csv)}")
        except Exception as e:
            print(f"Warning: Could not create copy at {latest_csv}: {e}")

    if html_success:
        try:
            import shutil

            shutil.copy2(html_filename, latest_html)
            print(f"Also saved HTML report to: {os.path.abspath(latest_html)}")
        except Exception as e:
            print(f"Warning: Could not create copy at {latest_html}: {e}")

    # Generate summary statistics
    if verbose:
        print(f"\n{'='*80}")
        print(f"VALIDATION SUMMARY")
        print(f"{'='*80}")
        print(f"Completed at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        print(f"Total processing time: {elapsed_time:.2f} seconds")
        print(f"\nTotal rows processed: {total_rows}")
        print(f"Total resources checked: {total_resources}")
        print(
            f"Successful checks: {total_success} ({(total_success/total_resources*100):.1f}% of resources)"
            if total_resources
            else "Successful checks: 0 (0%)"
        )
        print(
            f"Failed checks: {total_failure} ({(total_failure/total_resources*100):.1f}% of resources)"
            if total_resources
            else "Failed checks: 0 (0%)"
        )

        # Failure breakdown
        if total_failure > 0:
            print("\nFailure breakdown:")
            for failure_type, count in failure_types.items():
                if count > 0:
                    print(
                        f"  - {failure_type.replace('_', ' ').title()}: {count} ({count/total_failure*100:.1f}%)"
                    )

        print(f"\nOutput files:")
        if csv_success:
            print(f"  - CSV: {os.path.abspath(csv_filename)}")
            print(f"  - CSV (latest): {os.path.abspath(latest_csv)}")
        if html_success:
            print(f"  - HTML: {os.path.abspath(html_filename)}")
            print(f"  - HTML (latest): {os.path.abspath(latest_html)}")
        print(f"\nOpen the HTML file in a browser to view the interactive report.")
        print(f"Results are sorted by review priority (highest priority items first).")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="URL Validation Script")
    parser.add_argument(
        "--csv", default="revised-techniques.csv", help="Path to CSV file"
    )
    parser.add_argument(
        "--output", default="validation_results", help="Output directory for results"
    )
    parser.add_argument("--quiet", action="store_true", help="Suppress verbose output")

    args = parser.parse_args()

    print(f"Starting validation with:")
    print(f"  - CSV file: {args.csv}")
    print(f"  - Output directory: {args.output}")
    print(f"  - Current working directory: {os.getcwd()}")

    main(args.csv, args.output, not args.quiet)
