# Combined Migration Plan for TEA Techniques Project

This document outlines the comprehensive plan to migrate both the backend and frontend of the TEA Techniques project to support the new data model defined in the requirements.

## 1. Overview

The migration involves transforming the current single-relationship data model to a more flexible structure that allows:

1. Multiple relationships between Techniques and AssuranceGoals, Categories, and SubCategories
2. Enhanced attribute management through a flexible attribute system
3. Support for multiple resources, example use cases, and limitations
4. Better relationship handling between techniques

## 2. Backend Migration Plan

### 2.1 Key Model Changes

#### 2.1.1 TechniqueRelationship Model Enhancement

```python
class TechniqueRelationship(models.Model):
    technique_from = models.ForeignKey(
        Technique, 
        related_name='related_from', 
        on_delete=models.CASCADE
    )
    technique_to = models.ForeignKey(
        Technique, 
        related_name='related_to', 
        on_delete=models.CASCADE
    )
    relationship_type = models.CharField(
        max_length=50, 
        default="similar"
    )
    
    class Meta:
        db_table = 'technique_relationship'
        unique_together = ('technique_from', 'technique_to', 'relationship_type')
        verbose_name_plural = "Technique Relationships"
```

#### 2.1.2 Convert Single FKs to Many-to-Many Relationships

```python
class Technique(models.Model):
    # ...
    # Convert from foreign keys to many-to-many relationships
    assurance_goals = models.ManyToManyField(
        AssuranceGoal, 
        through='TechniqueAssuranceGoal',
        related_name='techniques'
    )
    categories = models.ManyToManyField(
        Category, 
        through='TechniqueCategory',
        related_name='techniques'
    )
    subcategories = models.ManyToManyField(
        SubCategory, 
        through='TechniqueSubCategory',
        related_name='techniques',
        blank=True
    )
    # ...
```

#### 2.1.3 New Join Models for Relationships

While we're implementing many-to-many relationships for techniques to connect to multiple goals, categories, and subcategories, it's important to note that the hierarchical structure is maintained. Categories belong to specific goals, and subcategories belong to specific categories. This hierarchical relationship is preserved in the data model, even as techniques can now relate to multiple entities at each level.

```python
class TechniqueAssuranceGoal(models.Model):
    technique = models.ForeignKey('Technique', on_delete=models.CASCADE)
    assurance_goal = models.ForeignKey('AssuranceGoal', on_delete=models.CASCADE)
    
    class Meta:
        db_table = 'technique_assurance_goal'
        unique_together = ('technique', 'assurance_goal')

class TechniqueCategory(models.Model):
    technique = models.ForeignKey('Technique', on_delete=models.CASCADE)
    # The category foreign key here references a Category that is tied to a specific AssuranceGoal
    category = models.ForeignKey('Category', on_delete=models.CASCADE)
    
    class Meta:
        db_table = 'technique_category'
        unique_together = ('technique', 'category')

class TechniqueSubCategory(models.Model):
    technique = models.ForeignKey('Technique', on_delete=models.CASCADE)
    # The subcategory foreign key here references a SubCategory that is tied to a specific Category
    subcategory = models.ForeignKey('SubCategory', on_delete=models.CASCADE)
    
    class Meta:
        db_table = 'technique_subcategory'
        unique_together = ('technique', 'subcategory')
```

#### 2.1.4 Flexible Attribute System

```python
class AttributeType(models.Model):
    name = models.CharField(max_length=255, unique=True)
    description = models.TextField()
    applicable_goals = models.ManyToManyField('AssuranceGoal', blank=True)
    required_for_goals = models.ManyToManyField(
        'AssuranceGoal', 
        related_name='required_attribute_types',
        blank=True
    )
    
    class Meta:
        db_table = 'attribute_type'
    
    def __str__(self):
        return self.name

class AttributeValue(models.Model):
    attribute_type = models.ForeignKey(AttributeType, on_delete=models.CASCADE, related_name='values')
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    
    class Meta:
        db_table = 'attribute_value'
        unique_together = ('attribute_type', 'name')
    
    def __str__(self):
        return f"{self.attribute_type.name}: {self.name}"

class TechniqueAttribute(models.Model):
    technique = models.ForeignKey('Technique', on_delete=models.CASCADE, related_name='attributes')
    attribute_value = models.ForeignKey(AttributeValue, on_delete=models.CASCADE)
    
    class Meta:
        db_table = 'technique_attribute'
        unique_together = ('technique', 'attribute_value')
```

#### 2.1.5 Enhanced Resource Management

```python
class ResourceType(models.Model):
    name = models.CharField(max_length=100, unique=True)
    icon = models.CharField(max_length=50, blank=True)  # For frontend display
    
    class Meta:
        db_table = 'resource_type'
    
    def __str__(self):
        return self.name

class TechniqueResource(models.Model):
    technique = models.ForeignKey('Technique', on_delete=models.CASCADE, related_name='resources')
    resource_type = models.ForeignKey(ResourceType, on_delete=models.PROTECT)
    title = models.CharField(max_length=255)
    url = models.URLField()
    description = models.TextField(blank=True)
    
    class Meta:
        db_table = 'technique_resource'
        unique_together = ('technique', 'url')
```

#### 2.1.6 Multiple Example Use Cases and Limitations

```python
class TechniqueExampleUseCase(models.Model):
    technique = models.ForeignKey('Technique', on_delete=models.CASCADE, related_name='example_use_cases')
    description = models.TextField()
    assurance_goal = models.ForeignKey('AssuranceGoal', on_delete=models.CASCADE, null=True, blank=True)
    
    class Meta:
        db_table = 'technique_example_use_case'

class TechniqueLimitation(models.Model):
    technique = models.ForeignKey('Technique', on_delete=models.CASCADE, related_name='limitations')
    description = models.TextField()
    
    class Meta:
        db_table = 'technique_limitation'
```

### 2.2 Migration Workflow

1. **Create New Models**: Define all new models in `models.py`
2. **Generate Initial Migration**: Run `python manage.py makemigrations`
3. **Create Data Migration**: Generate and implement a data migration script
4. **Update Serializers**: Create serializers for new models and update existing ones
5. **Update ViewSets**: Add new ViewSets and update existing ones
6. **Update URLs**: Add new endpoints
7. **Apply Migrations**: Run migrations to update the database schema
8. **Test API**: Verify all endpoints work as expected

## 3. Frontend Migration Plan

### 3.1 Key Changes

#### 3.1.1 Update TypeScript Type Definitions

```typescript
// Updated Technique interface
export interface Technique {
  id: number;
  name: string;
  description: string;
  model_dependency: string;
  
  // Replace single values with arrays
  assurance_goals: AssuranceGoal[];
  categories: Category[];
  subcategories: SubCategory[];
  
  // New relationship data
  attributes: TechniqueAttribute[];
  resources: TechniqueResource[];
  example_use_cases: TechniqueExampleUseCase[];
  limitations: TechniqueLimitation[];
  tags: Tag[];
}

// New interfaces for relationship data
export interface TechniqueAttribute {
  id: number;
  attribute_type: string;
  attribute_value: number;
  attribute_value_name: string;
}

export interface TechniqueResource {
  id: number;
  resource_type: number;
  resource_type_name: string;
  title: string;
  url: string;
  description: string;
}

export interface TechniqueExampleUseCase {
  id: number;
  description: string;
  assurance_goal?: number;
  assurance_goal_name?: string;
}

export interface TechniqueLimitation {
  id: number;
  description: string;
}
```

#### 3.1.2 Update API Hooks

```typescript
// Example of new hooks for the flexible attribute system
export const useAttributeTypes = () => {
  return useQuery({
    queryKey: ["attribute-types"],
    queryFn: async () => {
      const response = await apiClient.get("/attributetypes/");
      return response.data as APIResponse<AttributeType>;
    },
    refetchOnWindowFocus: false,
  });
};

// Update technique mutation hooks to handle the new data structure
export const useCreateTechnique = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: TechniqueFormData) => {
      const response = await apiClient.post("/techniques/", data);
      return response.data as Technique;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["techniques"] });
    },
  });
};
```

#### 3.1.3 Update UI Components

1. **TechniquesList**: Update card display to handle multiple goals/categories
2. **TechniqueDetail**: Enhance to show all technique relationships and attributes
3. **TechniqueForm**: Create a more comprehensive form with multi-select fields

### 3.2 Form Improvements

1. **Tab-based Interface**: Use tabs to organize different sections of the form
2. **Multi-select Fields**: Create a component for selecting multiple items
3. **Dynamic Arrays**: Support adding/removing resources, example use cases, etc.

## 4. Implementation Strategy

### 4.1 Development Phases

#### Phase 1: Backend Development (2 weeks)
1. Define new models
2. Create migrations
3. Implement data migration
4. Update serializers and API endpoints
5. Write tests

#### Phase 2: Frontend Development (2 weeks, overlapping)
1. Update type definitions
2. Implement new components
3. Create improved forms
4. Update API hooks
5. Write tests

#### Phase 3: Integration Testing (1 week)
1. Test backend and frontend together
2. Verify data flow
3. Fix integration issues

#### Phase 4: Deployment (1 day)
1. Deploy backend changes
2. Apply migrations
3. Deploy frontend changes

#### Phase 5: Post-Deployment (1 week)
1. Monitor for issues
2. Fix bugs
3. Clean up technical debt

### 4.2 Testing Strategy

1. **Backend Testing**:
   - Model validation tests
   - API endpoint tests
   - Data migration tests
   - Performance testing

2. **Frontend Testing**:
   - Component rendering tests
   - Form validation tests
   - API integration tests
   - User flow tests

3. **End-to-End Testing**:
   - Complete user journeys
   - Edge cases

### 4.3 Validation

For each phase:
1. Code review by peers
2. Automated tests pass
3. Manual testing of key flows
4. Performance checks

## 5. Risk Management

### 5.1 Identified Risks

1. **Data Migration Complexity**: 
   - Mitigation: Thorough testing of migration scripts
   - Fallback: Backup database before migration

2. **API Compatibility Issues**:
   - Mitigation: Version API endpoints
   - Fallback: Support backward compatibility during transition

3. **Form Complexity**:
   - Mitigation: Break forms into logical sections
   - Fallback: Implement progressive enhancement

4. **Performance Impact**:
   - Mitigation: Optimize database queries
   - Fallback: Implement pagination and lazy loading
   
5. **Hierarchical Integrity Issues**:
   - Risk: Categories might be incorrectly associated with the wrong goals, or subcategories with the wrong categories
   - Mitigation: Implement strict validation logic in both backend (Django models/serializers) and frontend (form filtering)
   - Fallback: Run data integrity checks after migration

## 6. Conclusion

This migration plan transforms the TEA Techniques platform from a simple, single-relationship structure to a more flexible, comprehensive system that better represents the complex relationships between techniques and their properties. The changes maintain the core functionality while extending it to support more sophisticated use cases.

## 7. Timeline

- Week 1-2: Backend Development
- Week 2-3: Frontend Development
- Week 4: Integration Testing
- End of Week 4: Deployment
- Week 5: Post-deployment support and cleanup

Total timeline: 5 weeks