#!/usr/bin/env python
"""
Reset and Import Script for TEA Techniques

This script provides a complete database reset and data reimport process:
1. Deletes the existing SQLite database file (WARNING: ALL DATA WILL BE LOST)
2. Removes all migration files to ensure a clean slate
3. Creates new migrations based on current models
4. Applies migrations to create a fresh database schema
5. Imports all techniques from the CSV data file
6. Creates an admin user for the Django admin interface

USE WITH CAUTION: This will permanently delete your local database.
Only use during development or when you want to completely reset your data.
"""
import os
import sys
import shutil
import subprocess
from pathlib import Path

# Setup environment for Django
BASE_DIR = Path(__file__).resolve().parent.parent
sys.path.append(str(BASE_DIR))
os.environ.setdefault("USE_SQLITE", "True")  # Force SQLite for local dev reset
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")

import django

django.setup()


def run_command(cmd):
    """Run a shell command and display its output for transparency"""
    print(f"Running: {cmd}")
    subprocess.run(cmd, shell=True, check=True)


def reset_project():
    """
    Perform a complete reset of the development database and reload all data.
    WARNING: This will delete ALL existing data in your local database.
    """
    print("\n===== DATABASE RESET AND REIMPORT PROCESS =====")
    print("WARNING: This will delete ALL existing data!\n")

    # 1. Delete the SQLite database file
    db_path = BASE_DIR / "db.sqlite3"
    if db_path.exists():
        db_path.unlink()
        print("✓ Database file removed")
    else:
        print("✓ No existing database found, will create new")

    # 2. Clear existing migrations to avoid conflicts
    # This ensures we have a fresh migration history matching our current models
    migrations_dir = BASE_DIR / "api" / "migrations"
    migration_count = 0
    for file_path in migrations_dir.glob("*.py"):
        if file_path.name != "__init__.py":
            file_path.unlink()
            migration_count += 1
    print(f"✓ Cleared {migration_count} migration files")

    # 3. Create new migrations based on current models
    print("\n----- Creating fresh migrations -----")
    run_command("python manage.py makemigrations")

    # 4. Apply migrations to set up database schema
    print("\n----- Creating database schema -----")
    run_command("python manage.py migrate")

    # 5. Import all techniques from CSV
    print("\n----- Importing techniques data -----")
    csv_path = BASE_DIR / "data" / "techniques.csv"
    if not csv_path.exists():
        print(f"ERROR: Techniques CSV file not found at {csv_path}")
        print("Please make sure the data file exists before running this script")
        sys.exit(1)
    run_command(f"python manage.py import_techniques --file={csv_path}")

    # 6. Create admin user for easy access to admin interface
    print("\n----- Creating admin user -----")
    from django.contrib.auth.models import User

    if not User.objects.filter(username="admin").exists():
        User.objects.create_superuser("admin", "admin@example.com", "admin")
        print("✓ Created admin user (username: admin, password: admin)")
    else:
        print("✓ Admin user already exists")


if __name__ == "__main__":
    # Check if user wants to proceed
    response = input("This will COMPLETELY RESET your database. Are you sure? (y/n): ")
    if response.lower() != "y":
        print("Operation cancelled.")
        sys.exit(0)

    reset_project()
    print("\n✅ Reset and import complete!")
    print("➡️ Run 'USE_SQLITE=True python manage.py runserver' to start the server")
    print("➡️ Admin interface: http://localhost:8000/admin/ (admin/admin)")
    print("➡️ API: http://localhost:8000/api/")
