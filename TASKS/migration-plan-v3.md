# TEA Techniques Dataset v3 Migration Plan

## Phase 1 Completion Summary (Completed 2025-06-02)

### Completed Tasks:
1. **Django Models Updated** ✅
   - Removed: Category, SubCategory, AttributeType, AttributeValue models
   - Updated Technique model:
     - Removed: model_dependency, applicable_models, categories, subcategories fields
     - Added: related_techniques ManyToMany field
     - Kept: tags field (already existed)

2. **Import Script Updated** ✅
   - Removed all category/subcategory/attribute processing methods
   - Added _process_tags() method for tag handling
   - Added _process_related_techniques() method with two-pass processing
   - Updated _process_technique() to handle new schema

3. **API Serializers Updated** ✅
   - Removed CategorySerializer, SubCategorySerializer, AttributeTypeSerializer, AttributeValueSerializer
   - Updated TechniqueSerializer to include related_techniques field
   - Removed old fields from technique serialization

4. **API Views Updated** ✅
   - Removed CategoryViewSet, SubCategoryViewSet, AttributeTypesViewSet, AttributeValuesViewSet
   - Removed get_categorylist and get_subcategorylist endpoints
   - Updated TechniquesViewSet filtering to remove old fields
   - Updated debug endpoint to reflect new model structure

5. **Django Admin Updated** ✅
   - Created comprehensive TechniqueAdmin with inline editing
   - Added TagAdmin with technique count
   - Removed registrations for deleted models
   - Added filter_horizontal for tags and related_techniques

6. **Django Migrations Created** ✅
   - Generated migration: 0002_remove_attributevalue_attribute_type_and_more.py
   - Ready to apply when database reset is performed

### Next Steps:
- Phase 2: Frontend Infrastructure Changes
- Phase 3: Component Updates
- Phase 4: Filtering and Search Updates
- Phase 5: Data Migration and Testing

## Overview
This plan details the migration from the current hierarchical category/subcategory system to the new streamlined tag-based system in `techniques_v3.json`. The new schema simplifies the data structure while maintaining functionality through a comprehensive tag taxonomy.

## Key Schema Changes Identified

### 1. **Structure Simplification**
- **Removed**: `model_dependency`, `applicable_models`, `categories`, `subcategories`, `attributes`
- **Added**: `tags` array with structured hierarchical format (`prefix/category/subcategory`)
- **Added**: `related_techniques` array for cross-references
- **Simplified**: `limitations` now consistently uses object format with `description` field
- **Modified**: `assurance_goals` changed from single string to array of strings

### 2. **Tag System**
The new tags follow a hierarchical structure like:
- `applicable-models/agnostic`
- `assurance-goal-category/explainability/feature-analysis/importance-and-attribution`
- `data-type/tabular`
- `lifecycle-stage/model-development`

## Migration Steps

### Phase 1: Backend Infrastructure Changes

#### 1.1 Update Django Models (`backend/api/models.py`)
```python
# REMOVE these models entirely:
- Category (lines 27-47)
- SubCategory (lines 49-71)
- AttributeType (lines 147-163)
- AttributeValue (lines 166-192)

# UPDATE Technique model (lines 109-144):
class Technique(models.Model):
    name = models.CharField(max_length=255, unique=True)
    description = models.TextField()
    # REMOVE: model_dependency (line 121), applicable_models (lines 128-132)
    # REMOVE: categories (line 134), subcategories (lines 135-137)
    # REMOVE: relationship to attribute_values via AttributeValue.technique
    complexity_rating = models.PositiveSmallIntegerField(...)  # Keep
    computational_cost_rating = models.PositiveSmallIntegerField(...)  # Keep
    assurance_goals = models.ManyToManyField(AssuranceGoal, related_name="techniques")
    tags = models.ManyToManyField(Tag, related_name="techniques", blank=True)
    # ADD: related_techniques for cross-references
    related_techniques = models.ManyToManyField('self', blank=True, symmetrical=False)

# KEEP these models unchanged:
- AssuranceGoal (lines 7-24)
- Tag (lines 73-88) - Already exists!
- ResourceType (lines 91-106)
- TechniqueResource (lines 194-220)
- TechniqueExampleUseCase (lines 222-244)
- TechniqueLimitation (lines 247-265)
```

#### 1.2 Update Import Script (`backend/api/management/commands/import_techniques.py`)
**Major changes needed:**
- Remove `_process_categories()` method entirely
- Remove `_compare_relationships()` logic for categories/subcategories/attributes  
- Add tag processing logic
- Add related_techniques processing
- Update `_create_base_records()` to remove category/attribute creation
- Simplify `_process_technique()` method
- Add validation for tag format and hierarchy
- Ensure all techniques have required tag prefixes

**New tag processing logic:**
```python
def _process_tags(self, technique: Technique, tags_data: list) -> None:
    """Process tags for a technique."""
    for tag_name in tags_data:
        tag, _ = Tag.objects.get_or_create(name=tag_name)
        technique.tags.add(tag)

def _process_related_techniques(self, technique: Technique, related_ids: list) -> None:
    """Process related techniques after all techniques are imported."""
    for related_id in related_ids:
        try:
            related_technique = Technique.objects.get(id=related_id)
            technique.related_techniques.add(related_technique)
        except Technique.DoesNotExist:
            logger.warning(f"Related technique {related_id} not found")
```

#### 1.3 Update API Serializers (`backend/api/serializers.py`)
- Remove category/subcategory/attribute fields
- Add tag serialization
- Add related_techniques serialization
- Ensure proper handling of tag filtering

#### 1.4 Update API Views (`backend/api/views/api_views.py`)
- Remove category/subcategory/attribute filtering
- Add tag-based filtering with support for hierarchical tag queries
- Update search functionality to include tag content in search
- Remove endpoints: `/api/categories/`, `/api/subcategories/`, `/api/attribute-types/`
- Add new endpoint: `/api/tags/` for tag management and filtering

### Phase 2: Frontend Infrastructure Changes

#### 2.1 Update TypeScript Types (`frontend/src/lib/types.ts`)
```typescript
interface Technique {
  id: number;
  name: string;
  description: string;
  // REMOVE: model_dependency, applicable_models, categories, subcategories, attribute_values
  complexity_rating?: number;
  computational_cost_rating?: number;
  assurance_goals: AssuranceGoal[];
  tags: Tag[]; // Updated
  related_techniques: number[]; // New
  resources: TechniqueResource[];
  example_use_cases: TechniqueExampleUseCase[];
  limitations: TechniqueLimitation[];
}

// REMOVE: Category, SubCategory, AttributeType, AttributeValue interfaces
```

#### 2.2 Update API Hooks (`frontend/src/lib/api/hooks.ts`)
- Remove `useCategories`, `useSubCategories`, `useAttributeTypes` hooks
- Update `useTechniques` to handle new filtering parameters
- Add `useTags` hook for tag-based filtering
- Remove category/subcategory dependencies in query keys

#### 2.3 Create Tag Parsing Utilities (`frontend/src/lib/utils.ts`)
```typescript
// Utility functions to parse structured tags
export function parseTagsByPrefix(tags: Tag[], prefix: string): Tag[]
export function getTagValue(tagName: string): string
export function getApplicableModels(tags: Tag[]): string[]
export function getLifecycleStages(tags: Tag[]): string[]
export function getDataTypes(tags: Tag[]): string[]
```

### Phase 3: Component Updates

#### 3.1 Replace TechniqueForm.tsx
**Major rewrite needed:**
- Remove category/subcategory selection sections (lines 108-148, 511-620)
- Remove attribute management (lines 46, 61-66, 173-179)
- Add tag selection/management interface
- Use tag parsing utilities for form population
- Update validation to require appropriate tags instead of categories

#### 3.2 Update TechniquesList.tsx  
- Replace category/subcategory display (lines 52-72, 127-149) with tag-based display
- Update `formatCategoryName()` to work with tag parsing
- Show relevant tags instead of hierarchical categories

#### 3.3 Update TechniquesSidebar.tsx
**Significant changes needed:**
- Replace category filtering (lines 230-272) with tag-based filtering
- Create filter sections for:
  - Applicable Models (from `applicable-models/*` tags)
  - Lifecycle Stages (from `lifecycle-stage/*` tags)  
  - Data Types (from `data-type/*` tags)
  - Assurance Goal Categories (from `assurance-goal-category/*` tags)
- Remove dependency chain (goals → categories → subcategories)

#### 3.4 Replace AttributeVisualizer.tsx
- Remove entirely or repurpose for tag visualization
- Move complexity/computational cost ratings to main technique display
- Create new component for tag visualization if needed

#### 3.5 Update Technique Detail Page
- Replace category/subcategory display (lines 526-552) with structured tag display
- Remove attribute sections (lines 638-690)
- Add related techniques section
- Group tags by prefix for organized display

#### 3.6 Update CategoryTag.tsx
- Rename to `TechniqueTag.tsx`
- Update styling and display logic for new tag format
- Add support for hierarchical tag display

### Phase 4: Filtering and Search Updates

#### 4.1 Update useFilterParams.ts
- Remove category/subcategory parameter handling
- Add tag-based filtering parameters
- Update URL parameter mapping
- Simplify filter state management

#### 4.2 Update Filter Logic
- Replace hierarchical filtering with tag-based filtering
- Update `TechniquesList.tsx` filtering logic (lines 272-291, 310-353)
- Ensure proper tag aggregation for filter options

### Phase 5: Data Migration and Testing

#### 5.1 Database Migration Strategy
Since no backward compatibility is needed and this is not in production:

**Using Poetry (recommended):**
```bash
# Reset database completely
cd backend
poetry run python manage.py reset_database --force

# Import new dataset
poetry run python manage.py import_techniques --file=TASKS/techniques_v3.json
```

**Using Docker:**
```bash
# If using Docker, exec into the container first
docker-compose exec backend bash

# Then run the commands
python manage.py reset_database --force
python manage.py import_techniques --file=TASKS/techniques_v3.json
```

Note: Since this app is not in production and has only one user, we can freely reset the database without maintaining Django migrations. The migration files are created for development purposes but aren't required for the final deployment.

#### 5.2 Update Docker Configuration
- Verify Dockerfile still works with simplified models
- Update any docker-compose references to data files
- Test full Docker build pipeline

#### 5.3 Testing Updates
- Update test files in `backend/api/tests/` to remove category/attribute tests
- Add tag-based tests
- Update frontend tests in `frontend/src/tests/`
- Test form validation with new tag system

### Phase 6: Documentation Updates

#### 6.1 Create TAG_DEFINITIONS.md
Referenced in new schema - document the tag taxonomy structure and meanings.

**Tag Prefix Categories:**
- `applicable-models/`: Model dependency information (agnostic, specific types)
- `assurance-goal-category/`: Hierarchical categorization under assurance goals
- `data-type/`: Type of data the technique works with (tabular, text, image, etc.)
- `lifecycle-stage/`: When in the ML lifecycle the technique applies
- `technique-type/`: Implementation approach (algorithmic, procedural, etc.)
- `evidence-type/`: Type of evidence produced
- `expertise-needed/`: Required expertise level
- `explanatory-scope/`: Scope of explanations (global, local)
- `data-requirements/`: Special data requirements

**Migration Mapping from Old Schema:**
- `model_dependency: "Model-Agnostic"` → `applicable-models/agnostic`
- `model_dependency: "Model-Specific"` → `applicable-models/[specific-model-type]`
- `categories + subcategories` → `assurance-goal-category/[goal]/[category]/[subcategory]`
- `attributes` → Various tags based on attribute type and value

#### 6.2 Update Existing Documentation
- **API-GUIDE.md**: Remove category/subcategory endpoints, add tag endpoints
- **DATA-MANAGEMENT.md**: Update data structure documentation
- **MODEL-ARCHITECTURE.md**: Update database schema documentation  
- **FRONTEND-GUIDE.md**: Update component architecture
- **USER-GUIDE.md**: Update user interface documentation

#### 1.5 Update Django Admin (`backend/api/admin.py`)
- Remove Category, SubCategory, AttributeType, AttributeValue admin registrations
- Update TechniqueAdmin to:
  - Display tags in list view
  - Add tag filtering
  - Update inline forms to remove category/attribute management
  - Add related_techniques field
  - Implement tag autocomplete for easier management

### Phase 7: Files to Delete

#### 7.1 Backend Files
```bash
# No specific files to delete, but remove:
# - Category/SubCategory model references throughout codebase
# - Attribute-related model references
# - Related admin configurations
# - Related serializer code
```

#### 7.2 Frontend Files
- Consider removing `AttributeVisualizer.tsx` if not repurposed
- Remove any category-specific utility functions
- Clean up unused type definitions

## Implementation Timeline Estimate

### Phase-by-Phase Breakdown
1. **Backend Infrastructure (2-3 days)**
   - Model updates: 4-6 hours
   - Import script rewrite: 8-10 hours
   - API updates: 6-8 hours
   - Admin interface: 2-3 hours

2. **Frontend Infrastructure (3-4 days)**
   - Type definitions: 2-3 hours
   - API hooks: 4-5 hours
   - Utility functions: 3-4 hours
   - Component updates: 16-20 hours

3. **Testing & Validation (1-2 days)**
   - Test updates: 6-8 hours
   - Integration testing: 4-6 hours
   - Performance testing: 2-3 hours

4. **Documentation & Cleanup (1 day)**
   - Documentation updates: 4-5 hours
   - Code cleanup: 2-3 hours

**Total Estimated Time**: 7-10 days of focused development

## Deployment Strategy

### 1. Development Environment
1. Create development branch for migration
2. Implement changes phase by phase
3. Test with new dataset after each phase
4. Verify Docker builds and runs successfully

### 2. Testing
1. Run full test suite after backend changes
2. Test frontend builds successfully
3. Test Docker deployment end-to-end
4. Verify Tailscale deployment still works

### 3. Production Deployment
Since this is not in production use:
1. Deploy all changes at once
2. Reset database with new dataset
3. Verify all functionality works
4. Update any deployment scripts

## Risk Mitigation

### 1. Backup Strategy
- Backup current database before migration
- Keep copy of current codebase
- Create snapshot of current techniques.json
- Document rollback procedures (though not needed per requirements)

### 2. Validation Checkpoints
- Verify Django migrations run successfully
- Confirm frontend builds without errors
- Test API endpoints return expected data
- Validate Docker deployment
- Confirm Tailscale connectivity

### 3. Data Integrity
- Validate all techniques import successfully
- Verify tag relationships are correct
- Confirm cross-references work properly
- Test search and filtering functionality
- Validate tag format follows hierarchical structure
- Ensure no data loss during transformation
- Verify all required tag prefixes are present for each technique

## Definition of Done

✅ **Backend**: Django models updated, import script working, API endpoints functional  
✅ **Frontend**: React components updated, TypeScript types correct, builds successfully  
✅ **Database**: All techniques imported with correct tag relationships  
✅ **Testing**: All tests pass, no build errors  
✅ **Docker**: Full application builds and runs in containers  
✅ **Deployment**: Application accessible via Tailscale  
✅ **Documentation**: Updated to reflect new schema and functionality  
✅ **Search/Filter**: All filtering and search functionality works with tags  
✅ **Related Techniques**: Cross-reference functionality implemented and working

This migration represents a significant simplification of the data model while maintaining all necessary functionality through the comprehensive tag system.

## Pre-Migration Checklist

Before starting the migration:

1. **Environment Setup**
   - [ ] Create new feature branch: `git checkout -b feature/v3-schema-migration`
   - [ ] Ensure Docker environment is working
   - [ ] Run current test suite to ensure baseline functionality
   - [ ] Export current database data as backup

2. **Data Validation**
   - [ ] Verify `TASKS/techniques_v3.json` is complete and valid
   - [ ] Check all technique IDs in `related_techniques` arrays exist
   - [ ] Validate tag format consistency across all techniques
   - [ ] Ensure no duplicate technique names or IDs

3. **Dependencies Check**
   - [ ] Review and update requirements.txt/pyproject.toml if needed
   - [ ] Check frontend package.json for any updates needed
   - [ ] Verify Docker base images are up to date

## Testing Strategy

### 1. Unit Tests
- **Backend**: Update all model tests to reflect new schema
- **Frontend**: Update component tests for new props/state
- **API**: Test new filtering and search with tags

### 2. Integration Tests
- Test full import process with v3 dataset
- Verify API endpoints return expected data structure
- Test frontend-backend communication with new schema

### 3. End-to-End Tests
- Create new technique through UI
- Edit existing technique with tags
- Search and filter by various tag combinations
- Verify related techniques display correctly

### 4. Performance Tests
- Compare query performance with tag-based filtering
- Test import speed with new schema
- Verify no regression in page load times

## Implementation Notes

### File References
Based on the analysis, the following files have significant dependencies on the current schema:

**Backend (High Priority Changes):**
- `backend/api/models.py` - Remove Category, SubCategory, AttributeType, AttributeValue models
- `backend/api/management/commands/import_techniques.py` - Complete rewrite of processing logic
- `backend/api/serializers.py` - Update to handle new fields
- `backend/api/views/api_views.py` - Update filtering and endpoints

**Frontend (High Priority Changes):**
- `frontend/src/lib/types.ts` - Update all type definitions
- `frontend/src/components/technique/TechniqueForm.tsx` - Major rewrite for tag management
- `frontend/src/components/technique/TechniquesSidebar.tsx` - Replace category filtering with tag filtering
- `frontend/src/components/technique/TechniquesList.tsx` - Update display logic
- `frontend/src/components/technique/AttributeVisualizer.tsx` - Remove or repurpose
- `frontend/src/lib/api/hooks.ts` - Update API hooks
- `frontend/src/lib/hooks/useFilterParams.ts` - Simplify filter handling

**Testing Files:**
- `backend/api/tests/test_models.py` - Update model tests
- `backend/api/tests/test_api.py` - Update API tests  
- `frontend/src/tests/TechniqueForm.test.tsx` - Update form tests

## Potential Challenges and Solutions

### 1. **Tag Hierarchy Complexity**
**Challenge**: Managing deeply nested tag hierarchies like `assurance-goal-category/explainability/feature-analysis/importance-and-attribution`
**Solution**: 
- Create utility functions to parse and display tag hierarchies
- Implement tag autocomplete with hierarchical grouping
- Add validation to ensure tag format consistency

### 2. **Migration Data Transformation**
**Challenge**: Converting existing category/subcategory/attribute data to tags
**Solution**:
- Create a mapping script to transform old format to new tags
- Validate all transformations before importing
- Keep transformation logs for debugging

### 3. **Frontend Filter Complexity**
**Challenge**: Replacing hierarchical category filtering with tag-based filtering
**Solution**:
- Group tags by prefix for organized display
- Implement multi-select tag filtering
- Add "tag cloud" or grouped tag visualization

### 4. **Performance Considerations**
**Challenge**: Many-to-many tag relationships might impact query performance
**Solution**:
- Add database indexes on tag relationships
- Implement query optimization for common tag combinations
- Consider caching frequently used tag queries

### 5. **User Experience Transition**
**Challenge**: Users familiar with category/subcategory navigation need to adapt
**Solution**:
- Provide clear tag grouping in UI
- Add tooltips explaining tag meanings
- Create user guide for new navigation system

This plan provides a systematic approach to migrating your application while ensuring continued functionality and maintaining your Docker/Tailscale deployment setup.