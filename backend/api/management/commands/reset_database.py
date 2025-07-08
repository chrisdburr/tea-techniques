# backend/api/management/commands/reset_database.py
import os
import subprocess
from pathlib import Path

from django.conf import settings
from django.contrib.auth.models import User
from django.core.management.base import BaseCommand
from django.db import connections


class Command(BaseCommand):
    help = "Reset the database and recreate migrations"

    def add_arguments(self, parser):
        parser.add_argument(
            "--force", action="store_true", help="Skip confirmation prompt"
        )
        parser.add_argument(
            "--create-admin",
            action="store_true",
            default=True,
            help="Create an admin user (admin/admin)",
        )

    def handle(self, *args, **options):
        force = options.get("force", False)
        create_admin = options.get("create_admin", True)

        # Get the base directory
        BASE_DIR = Path(settings.BASE_DIR)

        # Check if user wants to proceed with reset
        if not force:
            response = input(
                "This will COMPLETELY RESET your database. Are you sure? (y/n): "
            )
            if response.lower() != "y":
                self.stdout.write("Operation cancelled.")
                return

        # Reset database
        self.reset_database(BASE_DIR)

        # Create admin user if specified
        if create_admin:
            self.create_admin_user()

        self.stdout.write(self.style.SUCCESS("✅ Database reset complete!"))

    def reset_database(self, BASE_DIR):
        """Reset the database and migrations"""
        self.stdout.write(self.style.WARNING("\n===== DATABASE RESET PROCESS ====="))

        # Clear existing migrations to avoid conflicts
        migrations_dir = BASE_DIR / "api" / "migrations"
        migration_count = 0
        for file_path in migrations_dir.glob("*.py"):
            if file_path.name != "__init__.py":
                file_path.unlink()
                migration_count += 1
        self.stdout.write(f"✓ Cleared {migration_count} migration files")

        # Create new migrations based on current models
        self.stdout.write("\n----- Creating fresh migrations -----")
        self.run_command("python manage.py makemigrations")

        # Apply migrations to set up database schema
        self.stdout.write("\n----- Creating database schema -----")
        self.run_command("python manage.py migrate")

    def create_admin_user(self):
        """Create admin user if not exists"""
        self.stdout.write("\n----- Creating admin user -----")
        if not User.objects.filter(username="admin").exists():
            User.objects.create_superuser("admin", "admin@example.com", "admin")
            self.stdout.write("✓ Created admin user (username: admin, password: admin)")
        else:
            self.stdout.write("✓ Admin user already exists")

    def run_command(self, cmd):
        """Run a shell command and display its output"""
        self.stdout.write(f"Running: {cmd}")
        # Pass the current environment with any updates to subprocesses
        env = os.environ.copy()
        # Convert string command to list for safer execution
        import shlex
        cmd_list = shlex.split(cmd)
        subprocess.run(cmd_list, check=True, env=env)
