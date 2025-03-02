# Database Migration Plan

This document outlines the plan for migrating from the current database schema to the proposed schema for improved scalability.

## Overview of Changes

The new database design addresses several key issues:

1. **Flexible Assurance Goals**: The system now supports adding new Assurance Goals (e.g., Safety, Security) beyond just Explainability and Fairness.

2. **Cross-Goal Categories**: Categories can now be associated with multiple Assurance Goals, enabling reuse of categories across goals.

3. **Dynamic Attributes**: Technique-specific attributes (like Fairness Approach, Project Lifecycle Stage) are now handled through a flexible AttributeType/AttributeValue system, allowing easy addition of new attributes.

4. **Improved Many-to-Many Relationships**: Categories, subcategories, and other relationships are now properly modeled with explicit many-to-many relationships.

## Migration Steps

### 1. Preparation

- Create a full backup of the current database
- Set up a staging environment for testing the migration
- Freeze the production system during migration

### 2. Schema Migration

1. Create the new tables:
   - AttributeType
   - AttributeValue
   - CategoryAssuranceGoal
   - SubCategoryCategory
   - TechniqueCategory
   - TechniqueAttribute

2. Modify existing tables:
   - Update Category to remove direct ForeignKey to AssuranceGoal
   - Update SubCategory to remove direct ForeignKey to Category
   - Update Technique to add new fields and relationships

### 3. Data Migration

1. Migrate AssuranceGoals (straightforward copy)

2. Migrate Categories:
   - For each Category, create a CategoryAssuranceGoal entry linking it to its original AssuranceGoal

3. Migrate SubCategories:
   - For each SubCategory, create a SubCategoryCategory entry linking it to its original Category

4. Create AttributeTypes:
   - Create "Fairness Approach" AttributeType with applies_to_all=False, applicable_goals=[Fairness]
   - Create "Project Lifecycle Stage" AttributeType with applies_to_all=False, applicable_goals=[Fairness]
   - Create "Scope" AttributeType with applies_to_all=False, applicable_goals=[Explainability]

5. Migrate AttributeValues:
   - Migrate all FairnessApproach records to AttributeValue with type="Fairness Approach"
   - Migrate all ProjectLifecycleStage records to AttributeValue with type="Project Lifecycle Stage"

6. Migrate Techniques:
   - Copy base fields to new Technique table
   - For each Technique, create TechniqueCategory entries
   - For each Technique with a SubCategory, create TechniqueSubCategory entries
   - For each TechniqueFairnessApproach, create corresponding TechniqueAttribute records
   - For each TechniqueProjectLifecycleStage, create corresponding TechniqueAttribute records
   - For each Technique with a scope value, create a TechniqueAttribute with appropriate scope AttributeValue

7. Migrate Tags and TechniqueTags (straightforward copy)

8. Migrate TechniqueRelationships (update ForeignKey fields)

### 4. API Implementation

1. Update the Django models, serializers, and views to use the new schema
2. Implement data validation and integrity checks
3. Add new endpoints for AttributeTypes and AttributeValues

### 5. Frontend Updates

1. Update API client to work with new endpoints
2. Modify forms to support the dynamic attribute system
3. Update filtering and search components

### 6. Testing

1. Unit tests for new models and API endpoints
2. Integration tests for full API functionality
3. End-to-end testing with frontend
4. Data integrity validation

### 7. Deployment

1. Final backup of production database
2. Apply migrations to production
3. Deploy updated API code
4. Deploy updated frontend code
5. Monitor for issues

## Data Migration Script

A Python script will be developed to handle the data migration. This script will:

1. Read data from the old schema tables
2. Transform data into the new schema format
3. Write data to the new schema tables
4. Validate the migration to ensure data integrity

## Rollback Plan

In case of issues during migration:

1. Restore database from backup
2. Revert to previous API code
3. Revert to previous frontend code

## Timeline

The migration should be scheduled during a low-traffic period and is estimated to take:

- Development: 2 weeks
- Testing: 1 week
- Deployment: 1 day (includes 4-hour maintenance window)

## Potential Challenges

1. **Data Integrity**: Ensuring all relationships are correctly maintained during migration
2. **Performance**: The migration process might be time-consuming for large datasets
3. **Application Compatibility**: Ensuring all parts of the application work with the new schema

## Post-Migration Tasks

1. Monitor application performance
2. Update documentation
3. Train users on new features (if any UI changes)
4. Conduct a post-migration review to address any issues