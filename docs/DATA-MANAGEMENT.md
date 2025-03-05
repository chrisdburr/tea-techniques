# Data Management Guide

## Overview

While this project is in development it currently uses a CSV file, `techniques.csv`, located in `backend/data/`.

## Adding or Modifying Techniques

1. Edit the `techniques.csv` file directly
2. For local development, run `python backend/scripts/reset_and_import.py` to reload the database
3. For Docker deployments, rebuild and restart the containers: `docker-compose down && docker-compose up -d --build`

> [!WARNING] 
> The `reset_and_import.py` script will also allow you to reset the database and import your updated CSV file. 

## Schema Information

The CSV includes the following key columns:
- `id`: Technique ID
- `name`: Technique name
- `description`: Technique description
- `model_dependency`: Model dependency type (i.e. agnostic or specific)
- `assurance_goals`: Comma-separated list of assurance goals to which the technique belongs
- `categories`: JSON array of category mappings
- `subcategories`: JSON array of subcategory mappings
- `attributes`: JSON array of attributes for the technique (e.g. `{"scope": "local"}`)
- `example_use_cases`: JSON array of example use cases for the technique
- `limitations`: JSON array of limitations for the technique
- `resources`: JSON array of resources for the technique (e.g. journal article or GitHub repository)
- `complexity_rating`: a numeric value (1–5) representing the complexity of the technique
- `computational_cost_rating`: a numeric value (1–5) representing the computational cost of the technique
