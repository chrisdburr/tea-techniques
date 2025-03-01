#!/usr/bin/env python3
"""
Cross-environment integration test script.
This script tests the interaction between the backend and frontend by making direct 
API calls to ensure the backend is responding correctly with expected data.
"""

import argparse
import json
import requests
import sys
from typing import Dict, List, Any, Optional, Tuple
from rich.console import Console
from rich.table import Table

console = Console()

class IntegrationTester:
    def __init__(self, base_url: str):
        self.base_url = base_url
        self.session = requests.Session()
        self.results = []
    
    def test_techniques_list(self) -> Tuple[bool, str]:
        """Test retrieving the list of techniques."""
        try:
            response = self.session.get(f"{self.base_url}/api/techniques/")
            response.raise_for_status()
            data = response.json()
            
            # Basic validation
            if not isinstance(data, list):
                return False, "Expected a list of techniques, but got a different data type"
            
            if len(data) == 0:
                console.print("[yellow]Warning: No techniques found. Consider adding some test data.[/yellow]")
            
            # Check data structure if there are techniques
            if len(data) > 0:
                required_fields = ['id', 'name', 'description', 'model_dependency']
                for field in required_fields:
                    if field not in data[0]:
                        return False, f"Missing required field '{field}' in technique data"
            
            return True, "Successfully retrieved techniques list"
        
        except requests.RequestException as e:
            return False, f"API request failed: {str(e)}"
        except json.JSONDecodeError:
            return False, "Failed to parse JSON response"
        except Exception as e:
            return False, f"Unexpected error: {str(e)}"

    def test_technique_detail(self) -> Tuple[bool, str]:
        """Test retrieving a specific technique."""
        try:
            # First get list to find a technique ID
            list_response = self.session.get(f"{self.base_url}/api/techniques/")
            list_response.raise_for_status()
            techniques = list_response.json()
            
            if not techniques:
                return False, "No techniques available to test detail view"
            
            # Get the first technique's details
            technique_id = techniques[0]['id']
            detail_response = self.session.get(f"{self.base_url}/api/techniques/{technique_id}/")
            detail_response.raise_for_status()
            technique = detail_response.json()
            
            # Validate the response
            if not isinstance(technique, dict):
                return False, "Expected a technique object, but got a different data type"
            
            if technique.get('id') != technique_id:
                return False, f"Requested technique ID {technique_id} but received {technique.get('id')}"
            
            return True, f"Successfully retrieved technique with ID {technique_id}"
        
        except requests.RequestException as e:
            return False, f"API request failed: {str(e)}"
        except json.JSONDecodeError:
            return False, "Failed to parse JSON response"
        except Exception as e:
            return False, f"Unexpected error: {str(e)}"

    def test_create_technique(self) -> Tuple[bool, str]:
        """Test creating a new technique."""
        try:
            # Create new technique data
            new_technique = {
                "name": "Integration Test Technique",
                "description": "This technique was created by the integration test script",
                "model_dependency": "Agnostic",
                "example_use_case": "Testing cross-environment integration"
            }
            
            # Make the request
            response = self.session.post(
                f"{self.base_url}/api/techniques/",
                json=new_technique,
                headers={"Content-Type": "application/json"}
            )
            response.raise_for_status()
            created_technique = response.json()
            
            # Validate the response
            if not isinstance(created_technique, dict):
                return False, "Expected a technique object in response, but got a different data type"
            
            if created_technique.get('name') != new_technique['name']:
                return False, "Created technique name doesn't match the submitted name"
            
            # Verify the technique was actually created by retrieving it
            technique_id = created_technique.get('id')
            verify_response = self.session.get(f"{self.base_url}/api/techniques/{technique_id}/")
            verify_response.raise_for_status()
            
            return True, f"Successfully created and verified new technique with ID {technique_id}"
        
        except requests.RequestException as e:
            return False, f"API request failed: {str(e)}"
        except json.JSONDecodeError:
            return False, "Failed to parse JSON response"
        except Exception as e:
            return False, f"Unexpected error: {str(e)}"

    def test_update_technique(self) -> Tuple[bool, str]:
        """Test updating an existing technique."""
        try:
            # First get list to find a technique ID
            list_response = self.session.get(f"{self.base_url}/api/techniques/")
            list_response.raise_for_status()
            techniques = list_response.json()
            
            if not techniques:
                return False, "No techniques available to test update functionality"
            
            # Get the first technique to update
            technique_id = techniques[0]['id']
            original_technique = self.session.get(f"{self.base_url}/api/techniques/{technique_id}/").json()
            
            # Create updated data
            updated_data = original_technique.copy()
            updated_data["name"] = f"{original_technique['name']} - Updated"
            updated_data["description"] = f"{original_technique['description']} - This was updated by the integration test."
            
            # Make the update request
            response = self.session.put(
                f"{self.base_url}/api/techniques/{technique_id}/",
                json=updated_data,
                headers={"Content-Type": "application/json"}
            )
            response.raise_for_status()
            updated_technique = response.json()
            
            # Validate the response
            if updated_technique.get('name') != updated_data['name']:
                return False, "Updated technique name doesn't match the submitted name"
            
            return True, f"Successfully updated technique with ID {technique_id}"
        
        except requests.RequestException as e:
            return False, f"API request failed: {str(e)}"
        except json.JSONDecodeError:
            return False, "Failed to parse JSON response"
        except Exception as e:
            return False, f"Unexpected error: {str(e)}"

    def run_all_tests(self) -> None:
        """Run all integration tests and display results."""
        tests = [
            ("List Techniques", self.test_techniques_list),
            ("Technique Detail", self.test_technique_detail),
            ("Create Technique", self.test_create_technique),
            ("Update Technique", self.test_update_technique)
        ]
        
        table = Table(title="Integration Test Results")
        table.add_column("Test", style="cyan")
        table.add_column("Result", style="green")
        table.add_column("Message")
        
        passed = 0
        failed = 0
        
        for name, test_func in tests:
            console.print(f"\nRunning test: [bold]{name}[/bold]")
            success, message = test_func()
            
            if success:
                passed += 1
                table.add_row(name, "✅ PASS", message)
            else:
                failed += 1
                table.add_row(name, "❌ FAIL", message)
        
        console.print("\n")
        console.print(table)
        console.print(f"\nResults: {passed} passed, {failed} failed")
        
        if failed > 0:
            sys.exit(1)

def main():
    parser = argparse.ArgumentParser(description="Run integration tests between frontend and backend")
    parser.add_argument("--base-url", default="http://localhost:8000", 
                        help="Base URL for the API (default: http://localhost:8000)")
    args = parser.parse_args()
    
    console.print(f"[bold]Starting integration tests against {args.base_url}[/bold]")
    
    # Run the tests
    tester = IntegrationTester(args.base_url)
    tester.run_all_tests()

if __name__ == "__main__":
    main()