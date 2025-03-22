# backend/api/management/commands/tailscale_setup.py
import os
import subprocess
from pathlib import Path
from django.core.management.base import BaseCommand
from django.conf import settings
from django.db import connections


class Command(BaseCommand):
    help = "Special setup for Tailscale deployments with SQLite"

    def handle(self, *args, **options):
        # Force SQLite for tailscale deployment
        os.environ["USE_SQLITE"] = "True"
        
        # Get the base directory
        BASE_DIR = Path(settings.BASE_DIR)
        
        # Force Django to use SQLite
        settings.DATABASES["default"] = {
            "ENGINE": "django.db.backends.sqlite3",
            "NAME": os.path.join(BASE_DIR, "db.sqlite3"),
        }
        
        # Close existing connections to ensure we use the new config
        connections.close_all()
        
        self.stdout.write(self.style.SUCCESS("Using SQLite database for Tailscale deployment"))
        
        # Delete the SQLite database file if it exists
        db_path = BASE_DIR / "db.sqlite3"
        if db_path.exists():
            db_path.unlink()
            self.stdout.write("✓ Old database file removed")
        
        # Run migrations
        self.stdout.write("\n----- Applying migrations to new database -----")
        try:
            self.run_command("python manage.py migrate")
            
            # Add missing columns that might not be in the migrations
            self.stdout.write("\n----- Adding any missing columns to database schema -----")
            self.run_command("python manage.py add_missing_columns --force")
        except Exception as e:
            self.stdout.write(self.style.ERROR(f"Migration error: {str(e)}"))
            self.stdout.write(self.style.WARNING("Trying to continue anyway..."))
        
        # Import techniques with more robust error handling
        self.stdout.write("\n----- Importing techniques data -----")
        try:
            self.run_command("python manage.py import_techniques --use-sqlite")
        except Exception as e:
            self.stdout.write(self.style.ERROR(f"Error during import: {str(e)}"))
            # Try an alternative approach - direct import from CSV
            self.stdout.write(self.style.WARNING("Trying alternative import method..."))
            from django.core import management
            management.call_command('import_techniques', use_sqlite=True, force=True)
        
        # Verify data
        try:
            from api.models import Technique
            technique_count = Technique.objects.count()
            self.stdout.write(self.style.SUCCESS(f"✓ Successfully imported {technique_count} techniques"))
        except Exception as e:
            self.stdout.write(self.style.ERROR(f"Error checking technique count: {str(e)}"))
        
        # Create admin user
        from django.contrib.auth.models import User
        if not User.objects.filter(username="admin").exists():
            User.objects.create_superuser("admin", "admin@example.com", "admin")
            self.stdout.write("✓ Created admin user (username: admin, password: admin)")
        
        self.stdout.write(self.style.SUCCESS("\n✅ Tailscale deployment setup complete!"))
    
    def run_command(self, cmd):
        """Run a shell command and display its output with better error handling"""
        self.stdout.write(f"Running: {cmd}")
        env = os.environ.copy()
        
        try:
            # First attempt with quieter output
            result = subprocess.run(
                cmd, 
                shell=True, 
                check=True, 
                env=env,
                capture_output=True,
                text=True
            )
            self.stdout.write(self.style.SUCCESS("Command completed successfully"))
            return result
        except subprocess.CalledProcessError as e:
            self.stdout.write(self.style.ERROR(f"Command failed with exit code {e.returncode}"))
            self.stdout.write(self.style.ERROR(f"STDERR: {e.stderr}"))
            self.stdout.write(self.style.ERROR(f"STDOUT: {e.stdout}"))
            raise