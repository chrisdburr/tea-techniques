# backend/api/management/commands/reset_database.py
import os
import subprocess
from pathlib import Path
from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from django.conf import settings
from django.db import connections


class Command(BaseCommand):
    help = "Reset the database and recreate migrations"

    def add_arguments(self, parser):
        parser.add_argument(
            "--force", action="store_true", help="Skip confirmation prompt"
        )
        parser.add_argument(
            "--use-sqlite",
            action="store_true",
            default=False,
            help="Use SQLite database (default: PostgreSQL)",
        )
        parser.add_argument(
            "--create-admin",
            action="store_true",
            default=True,
            help="Create an admin user (admin/admin)",
        )

    def handle(self, *args, **options):
        force = options.get("force", False)
        use_sqlite = options.get("use_sqlite", False)
        create_admin = options.get("create_admin", True)

        # Get the base directory
        BASE_DIR = Path(settings.BASE_DIR)

        # Configure SQLite for the entire process
        if use_sqlite:
            os.environ["USE_SQLITE"] = "True"

            # Force Django to use SQLite directly
            settings.DATABASES["default"] = {
                "ENGINE": "django.db.backends.sqlite3",
                "NAME": os.path.join(BASE_DIR, "db.sqlite3"),
            }

            # Close existing connections
            connections.close_all()

            self.stdout.write(self.style.SUCCESS("Using SQLite database"))

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
        if use_sqlite:
            self.stdout.write(
                "➡️ Run 'USE_SQLITE=True python manage.py runserver' to start the server"
            )
        else:
            self.stdout.write("➡️ Run 'python manage.py runserver' to start the server")

    def reset_database(self, BASE_DIR):
        """Reset the database and migrations"""
        self.stdout.write(self.style.WARNING("\n===== DATABASE RESET PROCESS ====="))

        # 1. Delete the SQLite database file if using SQLite
        if os.environ.get("USE_SQLITE") == "True":
            db_path = BASE_DIR / "db.sqlite3"
            if db_path.exists():
                db_path.unlink()
                self.stdout.write("✓ Database file removed")
            else:
                self.stdout.write("✓ No existing database found, will create new")

        # 2. Clear existing migrations to avoid conflicts
        migrations_dir = BASE_DIR / "api" / "migrations"
        migration_count = 0
        for file_path in migrations_dir.glob("*.py"):
            if file_path.name != "__init__.py":
                file_path.unlink()
                migration_count += 1
        self.stdout.write(f"✓ Cleared {migration_count} migration files")

        # 3. Create new migrations based on current models
        self.stdout.write("\n----- Creating fresh migrations -----")
        self.run_command("python manage.py makemigrations")

        # 4. Apply migrations to set up database schema
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
        subprocess.run(cmd, shell=True, check=True, env=env)
