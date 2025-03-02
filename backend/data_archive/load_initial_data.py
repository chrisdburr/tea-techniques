from django.core.management.base import BaseCommand
from django.core.management import call_command
from django.db import transaction
import logging

logger = logging.getLogger(__name__)


class Command(BaseCommand):
    help = "Loads all initial data from fixtures"

    def handle(self, *args, **options):
        fixtures = [
            "assurance_goals.json",
            "categories.json",
            "sub_categories.json",
            "techniques.json",
            "tags.json",
        ]

        try:
            with transaction.atomic():
                for fixture in fixtures:
                    self.stdout.write(f"Loading fixture: {fixture}")
                    call_command("loaddata", fixture)
                    self.stdout.write(
                        self.style.SUCCESS(f"Successfully loaded {fixture}")
                    )

                self.stdout.write(self.style.SUCCESS("All data loaded successfully"))

        except Exception as e:
            self.stdout.write(self.style.ERROR(f"Failed to load data: {str(e)}"))
            logger.error(f"Data loading failed: {str(e)}", exc_info=True)
            raise
