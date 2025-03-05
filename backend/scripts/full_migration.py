#!/usr/bin/env python
"""
Full migration and import script for TEA Techniques
This script will:
1. Reset the database
2. Create new migrations
3. Apply migrations
4. Import techniques from CSV
5. Create a superuser

Usage:
python scripts/full_migration.py
"""

import os
import sys
import shutil
import subprocess
from pathlib import Path

# Add the parent directory to sys.path
BASE_DIR = Path(__file__).resolve().parent.parent
sys.path.append(str(BASE_DIR))

# Setup environment variables
os.environ["USE_SQLITE"] = "True"
os.environ["DJANGO_SETTINGS_MODULE"] = "config.settings"
os.environ["DEBUG"] = "True"
os.environ["SECRET_KEY"] = "development-key-only-use-in-dev"
os.environ["ALLOWED_HOSTS"] = "*"

# Import Django settings after setting environment variables
import django

django.setup()


def run_command(cmd, desc=None):
    """Run a shell command and print output."""
    if desc:
        print(f"\n{desc}...")
    print(f"Running: {cmd}")
    result = subprocess.run(cmd, shell=True, capture_output=True, text=True)

    if result.stdout:
        print(result.stdout)

    if result.returncode != 0:
        print(f"Error: {result.stderr}")
        return False
    return True


def reset_database():
    """Remove the SQLite database and migrations."""
    print("\n=== Resetting Database and Migrations ===")

    # 1. Delete the SQLite database if it exists
    db_path = BASE_DIR / "db.sqlite3"
    if db_path.exists():
        print(f"Removing database: {db_path}")
        db_path.unlink()

    # 2. Delete migration files (but keep __init__.py)
    migrations_dir = BASE_DIR / "api" / "migrations"
    if migrations_dir.exists():
        print(f"Cleaning migrations directory: {migrations_dir}")
        for file_path in migrations_dir.glob("*.py"):
            if file_path.name != "__init__.py":
                print(f"Removing: {file_path}")
                file_path.unlink()

    return True


def setup_base_data():
    """Create initial data like assurance goals."""
    print("\n=== Setting Up Base Data ===")

    from api.models import AssuranceGoal

    # Create assurance goals
    goals = [
        {
            "name": "Explainability",
            "description": "Techniques for explaining AI decisions and behaviors.",
        },
        {
            "name": "Fairness",
            "description": "Techniques for ensuring equitable outcomes across different groups.",
        },
    ]

    for goal_data in goals:
        goal, created = AssuranceGoal.objects.get_or_create(
            name=goal_data["name"], defaults={"description": goal_data["description"]}
        )
        action = "Created" if created else "Found existing"
        print(f"{action} assurance goal: {goal.name}")

    return True


def create_new_migrations():
    """Create new migrations and apply them."""
    print("\n=== Creating New Migrations ===")

    # 1. Make migrations
    if not run_command("python manage.py makemigrations", "Creating migrations"):
        return False

    # 2. Apply migrations
    if not run_command("python manage.py migrate", "Applying migrations"):
        return False

    return True


def import_techniques_from_csv():
    """Import techniques from the CSV file."""
    print("\n=== Importing Techniques from CSV ===")

    # Import techniques from CSV
    csv_path = BASE_DIR / "data" / "techniques.csv"
    if not csv_path.exists():
        print(f"Warning: CSV file not found at {csv_path}")
        csv_path = BASE_DIR / "backend" / "data" / "techniques.csv"
        if not csv_path.exists():
            print(f"Error: CSV file not found at {csv_path} either")
            return False

    import_cmd = f"python manage.py import_techniques --file={csv_path}"
    if not run_command(import_cmd, "Importing techniques"):
        return False

    return True


def create_superuser():
    """Create a superuser for admin access."""
    print("\n=== Creating Superuser ===")

    from django.contrib.auth.models import User

    if not User.objects.filter(username="admin").exists():
        User.objects.create_superuser("admin", "admin@example.com", "admin")
        print("Created superuser: admin (password: admin)")
    else:
        print("Superuser 'admin' already exists")

    return True


def main():
    """Main function to execute all steps."""
    print("Starting full migration and import process...")

    steps = [
        ("Reset database", reset_database),
        ("Create new migrations", create_new_migrations),
        ("Setup base data", setup_base_data),
        ("Import techniques from CSV", import_techniques_from_csv),
        ("Create superuser", create_superuser),
    ]

    success = True
    for step_name, step_func in steps:
        print(f"\n{'='*20}\n{step_name}\n{'='*20}")
        if not step_func():
            print(f"\nFailed at step: {step_name}")
            success = False
            break

    if success:
        print("\n=== Process Completed Successfully ===")
        print(
            "You can now run the server with: USE_SQLITE=True python manage.py runserver"
        )
    else:
        print("\n=== Process Failed ===")
        print("Please check the errors above and try again.")


if __name__ == "__main__":
    main()
