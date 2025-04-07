# Data Management Guide

> [!NOTE] Overview
> This project uses a JSON file, `techniques.json`, located in `backend/data/` to store technique data.
>
> For a comprehensive understanding of how data is structured, please refer to the [Model Architecture](MODEL-ARCHITECTURE.md) documentation.

## Adding or Modifying Techniques

1. Edit the `techniques.json` file directly in `backend/data/`
2. For local development:
   - To reset the database and import techniques: `USE_SQLITE=True python manage.py reset_and_import_techniques`
   - To only import techniques without resetting: `USE_SQLITE=True python manage.py import_techniques`
3. For Docker deployments, rebuild and restart the containers: `docker compose down && docker compose up -d --build`

> [!WARNING]
> The `reset_database` command will completely reset the database. Use with caution.

## Schema Information

The JSON file includes the following key fields:

- `id`: Technique ID
- `name`: Technique name
- `description`: Technique description
- `model_dependency`: Model dependency type (i.e. agnostic or specific)
- `assurance_goals`: Array of assurance goals to which the technique belongs
- `attributes`: Array of attributes for the technique (e.g. `{"type": "Scope", "value": "local"}`)
- `example_use_cases`: Array of example use cases for the technique
- `limitations`: Array of limitations for the technique
- `resources`: Array of resources for the technique (e.g. journal article or GitHub repository)
- `complexity_rating`: a numeric value (1–5) representing the complexity of the technique
- `computational_cost_rating`: a numeric value (1–5) representing the computational cost of the technique

> [!TIP]
> A full schema definition can be found in `backend/data/techniques_schema.json`

## Related Documentation

- [Model Architecture](MODEL-ARCHITECTURE.md) - Detailed information about the data model
- [API Guide](API-GUIDE.md) - How the data is exposed through the API
- [User Guide](USER-GUIDE.md) - How users interact with the data
- [Glossary](GLOSSARY.md) - Definitions of terms used in the data
