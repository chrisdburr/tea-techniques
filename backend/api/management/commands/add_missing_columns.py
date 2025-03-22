# backend/api/management/commands/add_missing_columns.py
import os
from django.core.management.base import BaseCommand
from django.db import connection


class Command(BaseCommand):
    help = "Add missing columns to SQLite database for Tailscale compatibility"

    def add_arguments(self, parser):
        parser.add_argument(
            "--force", action="store_true", help="Skip confirmation prompt"
        )

    def handle(self, *args, **options):
        force = options.get("force", False)
        
        # Get the database engine from connection
        db_engine = connection.vendor
        self.stdout.write(f"Database engine: {db_engine}")
        
        # This command is specifically for SQLite
        if db_engine != 'sqlite':
            self.stdout.write(self.style.WARNING(f"This command is intended for SQLite databases only. Current database is {db_engine}."))
            return
            
        # Check if user wants to proceed with schema modification
        if not force:
            response = input(
                "This will modify your database schema. Are you sure? (y/n): "
            )
            if response.lower() != "y":
                self.stdout.write("Operation cancelled.")
                return
        
        # Get the cursor for direct SQL execution
        cursor = connection.cursor()
        
        # Check if applicable_models column exists
        try:
            cursor.execute("PRAGMA table_info(technique)")
            columns = cursor.fetchall()
            column_names = [col[1] for col in columns]
            
            self.stdout.write(f"Found columns in technique table: {', '.join(column_names)}")
            
            # Check if applicable_models column is missing
            if 'applicable_models' not in column_names:
                self.stdout.write(self.style.WARNING("Adding missing 'applicable_models' column to technique table..."))
                
                # Add the missing column
                cursor.execute("ALTER TABLE technique ADD COLUMN applicable_models text NULL")
                self.stdout.write(self.style.SUCCESS("Added 'applicable_models' column to technique table"))
            else:
                self.stdout.write(self.style.SUCCESS("Column 'applicable_models' already exists in technique table"))
                
            # Commit the changes
            connection.commit()
            
            # Verify the column was added
            cursor.execute("PRAGMA table_info(technique)")
            columns = cursor.fetchall()
            column_names = [col[1] for col in columns]
            if 'applicable_models' in column_names:
                self.stdout.write(self.style.SUCCESS("Column 'applicable_models' is now present in the schema"))
            else:
                self.stdout.write(self.style.ERROR("Failed to add 'applicable_models' column"))
                
        except Exception as e:
            self.stdout.write(self.style.ERROR(f"Error modifying database schema: {str(e)}"))
            connection.rollback()
            return
            
        self.stdout.write(self.style.SUCCESS("Database schema modification complete"))