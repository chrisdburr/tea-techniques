# backend/api/management/commands/reset_and_import_techniques.py
from django.core.management import call_command
from django.core.management.base import BaseCommand
from django.db import transaction

from api.models import Technique


class Command(BaseCommand):
    help = "Reset the database and import techniques in one step"

    def add_arguments(self, parser):
        parser.add_argument("--file", type=str, help="Path to the data file")
        parser.add_argument(
            "--force", action="store_true", help="Skip confirmation prompt"
        )
        parser.add_argument(
            "--format",
            type=str,
            choices=["json", "csv"],
            default="json",
            help="Format of the input file (default: json)",
        )

    def handle(self, *args, **options):
        file_path = options.get("file")
        force = options.get("force", False)
        file_format = options.get("format", "json")

        # First, reset the database
        reset_options = {"force": force, "stdout": self.stdout, "stderr": self.stderr}
        self.stdout.write(self.style.NOTICE("Step 1: Resetting database"))
        call_command("reset_database", **reset_options)

        # Delete all existing techniques and related data
        with transaction.atomic():
            deleted_count = Technique.objects.count()
            Technique.objects.all().delete()
            if deleted_count > 0:
                self.stdout.write(
                    self.style.WARNING(f"Deleted {deleted_count} existing techniques")
                )

        # Then import techniques
        import_options = {"stdout": self.stdout, "stderr": self.stderr, "force": force}
        if file_path:
            import_options["file"] = file_path

        self.stdout.write(
            self.style.NOTICE(f"Step 2: Importing techniques from {file_format} file")
        )

        if file_format == "csv":
            # Use the original CSV import command—no longer used
            call_command("import_techniques_csv", **import_options)
        else:
            # Use the new JSON import command
            call_command("import_techniques", **import_options)

        self.stdout.write(self.style.SUCCESS("✅ Reset and import complete!"))

        # Add server startup instructions at the end
        self.stdout.write(
            self.style.SUCCESS("➡️ Run 'python manage.py runserver' to start the server")
        )
