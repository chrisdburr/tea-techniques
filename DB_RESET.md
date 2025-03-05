# TEA Techniques Database Fix

This guide helps you restore your database to a working state after schema changes.

## What Was Wrong

The issue was that your database schema and Django models didn't properly align with the structure in the `techniques.csv` file. This caused data to be loaded incorrectly or not at all, especially:

1. Resources weren't being properly loaded or displayed
2. Limitations weren't being properly loaded or displayed
3. Example use cases weren't being properly handled
4. Attributes were missing or inconsistently applied

## How to Fix

### Step 1: Install the New Scripts

Place the following scripts in your project:

- `backend/scripts/full_migration.py` - Main script to reset the database and import everything
- `backend/api/management/commands/import_techniques.py` - Updated import command that properly handles the CSV structure

### Step 2: Run the Full Migration Script

```bash
cd backend
python scripts/full_migration.py
```

This script will:
1. Delete your existing database (SQLite)
2. Remove old migrations
3. Create new migrations
4. Run the migrations
5. Import techniques from your CSV file
6. Create an admin user (username: admin, password: admin)

### Step 3: Update Frontend Components

Replace or update the following files:

1. `frontend/src/lib/types.ts` - Update with the improved type definitions
2. `frontend/src/app/techniques/[id]/page.tsx` - Update with the improved detail page
3. `frontend/src/lib/api/hooks.ts` - Update the API hooks with better error handling

### Step 4: Start the Application

```bash
# Start the backend
cd backend
USE_SQLITE=True python manage.py runserver

# In another terminal, start the frontend
cd frontend
npm run dev
```

## If You Still Have Issues

If you encounter any issues after running these steps:

1. Check the Django logs for backend errors
2. Check the browser console for frontend errors
3. The debug output in the hooks should show the raw data being returned from the API
4. Make sure your CSV file has the expected structure with JSON fields properly formatted

## Moving Forward

For the future:

1. Consider using Django's built-in inspectdb command to generate models from your database schema
2. Add more comprehensive validation to your import scripts
3. Include type checking and validation on the frontend
4. Add more detailed error logging throughout the application
5. Consider adding a more structured approach to schema migrations

By following this approach, your app should now correctly display all the fields from your techniques CSV file, including resources, limitations, and other metadata.