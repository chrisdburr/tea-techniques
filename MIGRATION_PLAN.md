# TEA Techniques Migration Plan: Numerical IDs to Slug-Based Identifiers

## Overview

This document outlines the comprehensive migration from numerical ID-based technique identification to slug-based identifiers, incorporating the new `acronym` field and updated dataset structure.

## Key Changes Identified

- **Removed**: `id` field (numerical)
- **Added**: `slug` field (URL-friendly identifier)
- **Added**: `acronym` field (nullable string)
- **Modified**: Name format (acronyms extracted to separate field)

## Migration Task Checklist

### Phase 1: Schema Analysis and Data Validation ✅ COMPLETED

- [x] **1.1** Update `backend/data/techniques_schema.json`

  - [x] Remove `id` field requirement
  - [x] Add `slug` field as required string with uniqueness constraints and regex pattern
  - [x] Add `acronym` field as optional string
  - [x] Update field descriptions and validation rules

- [x] **1.2** Data validation and analysis
  - [x] Validate uniqueness of all slug values in migrated dataset (92 unique slugs)
  - [x] Analyze acronym field coverage (14 techniques have acronyms - 15% coverage)
  - [x] Create mapping between old numerical IDs and new slugs for reference
  - [x] Verify all slugs follow kebab-case pattern (all slugs verified)

### Phase 2: Database Schema Update (No Migration Needed) ✅ COMPLETED

- [x] **2.1** Update Django Technique model directly

  - [x] Add `slug` field as CharField with unique constraint and primary_key=True
  - [x] Add `acronym` field as CharField (nullable)
  - [x] Remove auto-generated `id` field (use slug as primary identifier)
  - [x] Update model's `__str__` method to display acronym when available

- [xOkay., ] **2.2** Reset database and import new dataset
  - [x] Update import command to use `techniques_migrated.json` as default
  - [x] Import new dataset using slugs as identifiers
  - [ ] Test database reset and import (pending - will test after all changes)

### Phase 3: Backend Architecture Updates ✅ COMPLETED

- [x] **3.1** Update Django models (`backend/api/models.py`)

  - [x] Add `slug` field to Technique model with unique constraint
  - [x] Add `acronym` field to Technique model (nullable)
  - [x] Update model's `__str__` method to include acronym if available
  - [x] Add slug validation and generation utilities

- [x] **3.2** Update API views and URLs (`backend/api/urls.py`, `backend/api/views/api_views.py`)

  - [x] Update ViewSets to use slug-based lookups (lookup_field = 'slug')
  - [x] Modify ordering and filtering to work with slugs
  - [x] Add slug and acronym to filterset_fields and search_fields
  - [x] Update ordering_fields to use slug instead of id

- [x] **3.3** Update serializers (`backend/api/serializers.py`)

  - [x] Include `slug` and `acronym` in TechniqueSerializer
  - [x] Update related_techniques to use SlugRelatedField instead of PrimaryKeyRelatedField
  - [x] Change related_technique_ids to related_technique_slugs
  - [x] Remove `id` from required fields and add `slug`

- [x] **3.4** Update management commands
  - [x] Modify `import_techniques.py` to use slug-based identification
  - [x] Update technique creation/update logic to use slug as primary key
  - [x] Change related techniques processing to use slugs instead of IDs
  - [x] Update data extraction utilities to handle new fields

### Phase 4: Frontend Architecture Updates ✅ COMPLETED

- [x] **4.1** Update TypeScript types (`frontend/src/lib/types.ts`)

  - [x] Add `slug` field to Technique interface
  - [x] Add `acronym` field to Technique interface (optional)
  - [x] Update TechniqueFormData for create/update operations
  - [x] Change related_techniques from number[] to string[] (slugs)

- [x] **4.2** Update API hooks and client (`frontend/src/lib/api/hooks.ts`)

  - [x] Change `useTechniqueDetail` hook to use slug instead of ID
  - [x] Update CRUD operations to work with slug-based endpoints
  - [x] Modify related technique fetching logic to use slugs
  - [x] Update `useMultipleTechniqueNames` to work with slugs

- [x] **4.3** Update Next.js routing

  - [x] Change dynamic route from `[id]` to `[slug]` (directory renamed)
  - [x] Update page components to extract slug from params 
  - [x] Update all Link components and navigation throughout app

- [x] **4.4** Update components
  - [x] Modify `TechniqueCard` component to use slug-based links and display acronyms
  - [x] Update `TechniqueDetail` component to display acronym in header and related techniques
  - [x] Update `TechniqueForm` component to use slug-based operations and related_technique_slugs
  - [x] Update `TechniquesList` component to use slug-based keys
  - [x] Add acronym display where appropriate (technique cards, headers, etc.)

### Phase 5: Testing Updates

- [ ] **5.1** Backend test updates
  - [ ] Update model tests for slug and acronym fields
  - [ ] Modify API tests to use slug-based endpoints
  - [ ] Update import command tests for new schema
  - [ ] Test slug uniqueness validation
  - [ ] Test acronym field handling (null values, display)

### Phase 6: Documentation and Final Steps

- [ ] **6.1** Update documentation

  - [ ] Revise `CLAUDE.md` with new command examples using migrated dataset
  - [ ] Update API documentation and examples
  - [ ] Document the new URL structure and slug format
  - [ ] Update any development/deployment guides

- [ ] **6.2** Migration validation and cleanup
  - [ ] Verify all data imported correctly with new schema
  - [ ] Test all API endpoints work with slug-based routing
  - [ ] Verify frontend navigation works end-to-end
  - [ ] Remove temporary migration code
  - [ ] Update any remaining references to numerical IDs

## Implementation Order and Dependencies

### Phase Dependencies

1. **Phase 1** (Schema/Data): Can be done in parallel after schema update
2. **Phase 2** (Database): Depends on Phase 1 completion
3. **Phase 3** (Backend): Must complete after Phase 2, before Phase 4
4. **Phase 4** (Frontend): Depends on Phase 3 backend API changes
5. **Phase 5** (Testing): Follow corresponding implementation phases
6. **Phase 6** (Documentation): After all functionality working

### Critical Path

1. Schema update → Data validation → Database migration
2. Backend model/API updates → Frontend type/hook updates → Component updates
3. Testing updates → Documentation → Final validation

## Risk Mitigation Strategies

- [ ] Maintain backward compatibility during transition where possible
- [ ] Use feature flags or environment variables for gradual rollout
- [ ] Implement comprehensive validation at each step
- [ ] Create rollback plan for database changes
- [ ] Test migration with subset of data first

## Files to be Modified

### Backend Files

- `backend/data/techniques_schema.json`
- `backend/api/models.py`
- `backend/api/views/api_views.py`
- `backend/api/urls.py`
- `backend/api/serializers.py`
- `backend/api/management/commands/import_techniques.py`
- `backend/api/management/commands/reset_and_import_techniques.py`
- `backend/api/tests/` (multiple test files)

### Frontend Files

- `frontend/src/lib/types.ts`
- `frontend/src/lib/api/hooks.ts`
- `frontend/src/app/techniques/[id]/` → `frontend/src/app/techniques/[slug]/`
- `frontend/src/components/technique/` (multiple components)
- `frontend/src/tests/` (multiple test files)

### Documentation Files

- `CLAUDE.md`
- `README.md` (if applicable)
- API documentation

## Estimated Scope

- **Schema/Data files**: 2 files
- **Backend files**: 8+ files
- **Frontend files**: 15+ files
- **Test files**: 10+ files
- **Documentation**: 2-3 files

**Total estimated changes**: ~35-40 discrete modifications across the full stack

## Success Criteria

- [ ] All techniques accessible via slug-based URLs
- [ ] Acronyms displayed where appropriate in UI
- [ ] All tests pass with new schema
- [ ] Import/export commands work with new dataset
- [ ] No broken links or navigation issues
- [ ] Performance maintained or improved
- [ ] SEO-friendly URLs working correctly

---

_This document should be updated as tasks are completed and any issues or changes are discovered during implementation._
