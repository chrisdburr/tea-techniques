# backend/api/management/commands/reset_and_import_techniques.py
from django.core.management.base import BaseCommand
from django.core.management import call_command


class Command(BaseCommand):
    help = "Reset the database and import techniques in one step"

    def add_arguments(self, parser):
        parser.add_argument("--file", type=str, help="Path to the CSV file")
        parser.add_argument(
            "--force", action="store_true", help="Skip confirmation prompt"
        )
        parser.add_argument(
            "--use-sqlite",
            action="store_true",
            default=True,
            help="Use SQLite database (default)",
        )

    def handle(self, *args, **options):
        file_path = options.get("file")
        force = options.get("force", False)
        use_sqlite = options.get("use_sqlite", True)

        # First, reset the database
        reset_options = {"force": force, "use_sqlite": use_sqlite}
        self.stdout.write(self.style.NOTICE("Step 1: Resetting database"))
        call_command("reset_database", **reset_options)

        # Then import techniques
        import_options = {"use_sqlite": use_sqlite}
        if file_path:
            import_options["file"] = file_path

        self.stdout.write(self.style.NOTICE("Step 2: Importing techniques"))
        call_command("import_techniques", **import_options)

        self.stdout.write(self.style.SUCCESS("✅ Reset and import complete!"))
