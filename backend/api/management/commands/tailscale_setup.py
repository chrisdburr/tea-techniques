import os
import subprocess
from pathlib import Path

from django.conf import settings
from django.core.management.base import BaseCommand
from django.db import connections


class Command(BaseCommand):
    help = "Special setup for Tailscale deployments with PostgreSQL"

    def handle(self, *args, **options):
        # Get the base directory
        BASE_DIR = Path(settings.BASE_DIR)

        # Close existing connections to ensure we use the new config
        connections.close_all()

        self.stdout.write(
            self.style.SUCCESS("Using PostgreSQL database for Tailscale deployment")
        )

        # Run migrations
        self.stdout.write("\n----- Applying migrations to database -----")
        try:
            self.run_command("python manage.py migrate")
        except Exception as e:
            self.stdout.write(self.style.ERROR(f"Migration error: {str(e)}"))
            self.stdout.write(self.style.WARNING("Trying to continue anyway..."))

        # Import techniques with more robust error handling
        self.stdout.write("\n----- Importing techniques data -----")
        try:
            self.run_command("python manage.py import_techniques")
        except Exception as e:
            self.stdout.write(self.style.ERROR(f"Error during import: {str(e)}"))
            # Try an alternative approach - direct import
            self.stdout.write(self.style.WARNING("Trying alternative import method..."))
            from django.core import management

            management.call_command("import_techniques", force=True)

        # Verify data
        try:
            from api.models import Technique

            technique_count = Technique.objects.count()
            self.stdout.write(
                self.style.SUCCESS(
                    f"✓ Successfully imported {technique_count} techniques"
                )
            )
        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f"Error checking technique count: {str(e)}")
            )

        # Create admin user
        from django.contrib.auth.models import User

        if not User.objects.filter(username="admin").exists():
            User.objects.create_superuser("admin", "admin@example.com", "admin")
            self.stdout.write("✓ Created admin user (username: admin, password: admin)")

        self.stdout.write(
            self.style.SUCCESS("\n✅ Tailscale deployment setup complete!")
        )

    def run_command(self, cmd):
        """Run a shell command and display its output with better error handling"""
        self.stdout.write(f"Running: {cmd}")
        env = os.environ.copy()

        try:
            # First attempt with quieter output - use shlex for safer execution
            import shlex

            cmd_list = shlex.split(cmd)
            result = subprocess.run(
                cmd_list, check=True, env=env, capture_output=True, text=True
            )
            self.stdout.write(self.style.SUCCESS("Command completed successfully"))
            return result
        except subprocess.CalledProcessError as e:
            self.stdout.write(
                self.style.ERROR(f"Command failed with exit code {e.returncode}")
            )
            self.stdout.write(self.style.ERROR(f"STDERR: {e.stderr}"))
            self.stdout.write(self.style.ERROR(f"STDOUT: {e.stdout}"))
            raise
