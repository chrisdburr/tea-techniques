# Data Management Guide

## Overview

This project uses a CSV-based approach for managing all technique data. The primary source of truth is the `techniques.csv` file located in `backend/data/`.

## Adding or Modifying Techniques

1. Edit the `techniques.csv` file directly
2. For local development, run `python backend/scripts/reset_and_import.py` to reload the database
3. For Docker deployments, rebuild and restart the containers: `docker-compose down && docker-compose up -d --build`

## Schema Information

The CSV includes the following key columns:
- `name`: Technique name
- `description`: Technique description
- `model_dependency`: Model dependency type
- `assurance_goals`: Comma-separated list of assurance goals
- `categories`: JSON array of category mappings
- `subcategories`: JSON array of subcategory mappings
- (and other columns as defined)

## Data Hierarchy

The import script automatically creates:
1. Assurance goals referenced in the CSV
2. Categories within those goals
3. Subcategories within those categories
4. Techniques with all their relationships and attributes