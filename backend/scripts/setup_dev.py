#!/usr/bin/env python
"""
Development setup script for the TEA Techniques project.

This script:
1. Creates a SQLite database for development
2. Migrates the database
3. Loads initial fixture data
4. Creates some sample techniques
"""

import os
import sys
import subprocess
import django
from pathlib import Path

# Set SQLite and development env variables
os.environ["USE_SQLITE"] = "True"
os.environ["DJANGO_SETTINGS_MODULE"] = "config.settings"
os.environ["DEBUG"] = "True"
os.environ["ALLOWED_HOSTS"] = "*"
os.environ["SECRET_KEY"] = "dev-secret-key"
os.environ["CORS_ALLOWED_ORIGINS"] = "http://localhost:3000"

# Add the parent directory to the sys.path to allow importing Django app settings
BASE_DIR = Path(__file__).resolve().parent.parent
sys.path.append(str(BASE_DIR))

# Initialize Django
django.setup()

print("Setting up development environment with SQLite database...")


def run_command(command):
    """Run a shell command and print output."""
    print(f"Running: {command}")
    result = subprocess.run(command, shell=True, capture_output=True, text=True)
    if result.returncode != 0:
        print(f"Error: {result.stderr}")
        sys.exit(1)
    print(result.stdout)
    return result.stdout


def setup_sqlite_database():
    # Remove existing SQLite database if it exists
    sqlite_db = BASE_DIR / "db.sqlite3"
    if sqlite_db.exists():
        print(f"Removing existing SQLite database: {sqlite_db}")
        sqlite_db.unlink()

    # Run migrations
    print("Creating new SQLite database and running migrations...")
    run_command("python manage.py migrate")

    # Load initial fixtures
    print("Loading initial fixtures...")
    run_command("python manage.py loaddata api/fixtures/assurance_goals.json")
    run_command("python manage.py loaddata api/fixtures/categories.json")
    run_command("python manage.py loaddata api/fixtures/sub_categories.json")

    # Generate and load techniques
    print("Generating technique fixtures...")
    try:
        run_command("cd scripts && python generate_techniques.py")
        run_command("python manage.py loaddata api/fixtures/techniques.json")
    except Exception as e:
        print(f"Warning: Error loading techniques: {e}")
        print("Creating sample techniques manually...")
        create_sample_techniques()


def create_sample_techniques():
    """Create a few sample techniques to populate the database."""
    from api.models import Technique, Category, AssuranceGoal

    # Create some sample techniques manually
    try:
        # Get required related objects
        explainability_goal = AssuranceGoal.objects.get(id=1)
        fairness_goal = AssuranceGoal.objects.get(id=2)

        feature_analysis_category = Category.objects.get(id=1)
        model_approx_category = Category.objects.get(id=2)
        fairness_category = Category.objects.get(id=9)

        # Create sample techniques
        if not Technique.objects.filter(
            name="SHAP (SHapley Additive exPlanations)"
        ).exists():
            Technique.objects.create(
                name="SHAP (SHapley Additive exPlanations)",
                description="Assigns importance values to each feature by computing their contribution to individual predictions, based on Shapley values from cooperative game theory.",
                assurance_goal=explainability_goal,
                category=feature_analysis_category,
                model_dependency="Model-Agnostic",
                example_use_case="Explaining individual predictions in complex models like neural networks or ensemble models.",
            )

        if not Technique.objects.filter(
            name="LIME (Local Interpretable Model-Agnostic Explanations)"
        ).exists():
            Technique.objects.create(
                name="LIME (Local Interpretable Model-Agnostic Explanations)",
                description="Generates local surrogate models that approximate complex model behaviour around a specific instance using interpretable models like linear models.",
                assurance_goal=explainability_goal,
                category=model_approx_category,
                model_dependency="Model-Agnostic",
                example_use_case="Explaining why a customer was denied a loan by approximating the model's decision locally.",
            )

        if not Technique.objects.filter(name="Adversarial Debiasing").exists():
            Technique.objects.create(
                name="Adversarial Debiasing",
                description="Uses adversarial techniques to remove information about protected attributes from representations while maintaining predictive performance.",
                assurance_goal=fairness_goal,
                category=fairness_category,
                model_dependency="Model-Specific",
                example_use_case="Removing gender bias from language models while preserving semantic content.",
            )

        print(f"Created {Technique.objects.count()} sample techniques.")

    except Exception as e:
        print(f"Error creating sample techniques: {e}")


def create_sample_admin():
    """Create a sample admin user."""
    from django.contrib.auth.models import User

    if not User.objects.filter(username="admin").exists():
        print("Creating admin user (username: admin, password: admin)...")
        User.objects.create_superuser("admin", "admin@example.com", "admin")


if __name__ == "__main__":
    setup_sqlite_database()
    create_sample_admin()

    print("\n" + "=" * 80)
    print("Development environment set up successfully!")
    print("=" * 80)
    print("\nYou can now run the development server:")
    print("  USE_SQLITE=True python manage.py runserver")
    print("\nThen run the Next.js frontend:")
    print("  cd ../frontend && npm run dev")
    print("\nAdmin interface available at http://localhost:8000/admin/")
    print("  Username: admin")
    print("  Password: admin")
    print("\nAPI available at http://localhost:8000/api/")
    print("Frontend available at http://localhost:3000/")
