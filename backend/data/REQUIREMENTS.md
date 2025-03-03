# TEA Techniques Database Revisions Requirements

This document tracks all required changes for the database update plan. Each change is documented with its rationale, implementation requirements, and dependencies.

## 1. TechniqueRelationship Model Enhancements

**Current Implementation:**
- Both `technique_from` and `technique_to` fields are nullable
- Uses `on_delete=models.DO_NOTHING`
- Lacks a field for specifying relationship type
- Missing constraints to prevent duplicate relationships

**Proposed Changes:**
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
        
    def __str__(self):
        return f"{self.technique_from.name} → {self.technique_to.name} ({self.relationship_type})"
```

**Rationale:**

Supports bidirectional similarity relationships between techniques
Creates an Obsidian-like backlink system for technique navigation
Prevents orphaned relationships when techniques are deleted
Allows for future expansion to different relationship types

**Implementation Steps:**

Create a plan to modify field constraints (removing null=True)
Add the relationship_type field with default value "similar"
Clean any existing null entries in the relationship table
Add the unique_together constraint for the three fields

**Dependencies:**

None

## 2. Maintaining Hierarchical Relationship Between Goals, Categories, and Sub-Categories

**Current Implementation:**

AssuranceGoal has a one-to-many relationship with Category
Category has a one-to-many relationship with SubCategory
The model enforces the hierarchical nature through foreign keys

**Analysis:**
The current data model correctly implements the business requirements:

Each goal has a set of categories attached to it
Each category may have a set of sub-categories
Goals do not share categories (even if they have the same name conceptually)
Categories do not share sub-categories

**Decision:**
We will maintain the current hierarchical structure rather than implementing the many-to-many relationships proposed in the plan. This ensures that:

Categories remain specific to a single assurance goal
Sub-categories remain specific to a single category
The data model accurately reflects the business domain requirements

**Implementation Requirements:**

Retain the current foreign key relationships in the model
Do not implement the CategoryAssuranceGoal and SubCategoryCategory join tables proposed in the plan
Ensure any data import scripts maintain these hierarchical relationships

**Rationale:**
While many-to-many relationships might offer more flexibility, they don't align with the business requirement that goals should have distinct categories and categories should have distinct sub-categories, even if they share the same name conceptually. The current model better enforces data integrity and domain rules.

## 3. Optional Sub-Category Relationship for Techniques

**Current Implementation:**
```python
class Technique(models.Model):
    # other fields...
    sub_category = models.ForeignKey(SubCategory, on_delete=models.CASCADE, null=True, blank=True)
    # other fields...
```

**Analysis:**
The current data model correctly implements an optional relationship between `Technique` and `SubCategory`. This aligns with the business requirement that not all techniques need a sub-category, as some categories may not require further subdivision.

**Decision:**
Maintain the optional relationship between `Technique` and `SubCategory` in the model.

**Implementation Requirements:**
- Ensure that any changes to the model or database schema preserve the optional nature of this relationship
- Any form validation or API endpoint validation should continue to allow techniques without a sub-category
- Data import scripts should handle cases where sub-category is null

**Rationale:**
Categories may have different levels of granularity. Some may benefit from subdivision into sub-categories, while others may be sufficiently specific without further subdivision. Maintaining the optional relationship provides appropriate flexibility in the data model.

## 4. Support for Techniques Associated with Multiple Goals, Categories, and Sub-Categories

**Current Implementation:**
```python
class Technique(models.Model):
    # other fields...
    assurance_goal = models.ForeignKey(AssuranceGoal, on_delete=models.CASCADE)
    category = models.ForeignKey(Category, on_delete=models.CASCADE)
    sub_category = models.ForeignKey(SubCategory, on_delete=models.CASCADE, null=True, blank=True)
    # other fields...
```

**Problem:**
The current model limits techniques to a single assurance goal and category, which doesn't account for techniques that may be relevant to multiple goals.

**Proposed Changes:**
```python
class Technique(models.Model):
    # other fields...
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
    # other fields...

class TechniqueAssuranceGoal(models.Model):
    technique = models.ForeignKey(Technique, on_delete=models.CASCADE)
    assurance_goal = models.ForeignKey(AssuranceGoal, on_delete=models.CASCADE)
    
    class Meta:
        db_table = 'technique_assurance_goal'
        unique_together = ('technique', 'assurance_goal')

class TechniqueCategory(models.Model):
    technique = models.ForeignKey(Technique, on_delete=models.CASCADE)
    category = models.ForeignKey(Category, on_delete=models.CASCADE)
    
    class Meta:
        db_table = 'technique_category'
        unique_together = ('technique', 'category')

class TechniqueSubCategory(models.Model):
    technique = models.ForeignKey(Technique, on_delete=models.CASCADE)
    subcategory = models.ForeignKey(SubCategory, on_delete=models.CASCADE)
    
    class Meta:
        db_table = 'technique_subcategory'
        unique_together = ('technique', 'subcategory')
```

**Implementation Requirements:**
1. Create the new many-to-many relationship tables
2. Implement data validation to ensure integrity across the hierarchy:
   - A technique can only be associated with categories that belong to its associated goals
   - A technique can only be associated with subcategories that belong to its associated categories
3. Migrate existing data by creating appropriate entries in the join tables
4. Update API endpoints, serializers, and frontend code to handle multiple associations

**Rationale:**
This change enables the platform to represent techniques that span multiple assurance goals, which more accurately reflects real-world scenarios where techniques can serve multiple purposes across different assurance domains.

**Complexity Impact:**
This is a significant change that affects the core data model and will require careful consideration. It may require specialized forms and validation logic to maintain referential integrity across the hierarchical relationships.

# REQUIREMENTS.md

## 5. Enhanced Technique Attributes and Resources Management

After reviewing the remaining technique attributes, I recommend the following changes to improve flexibility and extensibility:

### 5.1 Model Dependency Attribute

**Current Implementation:**
```python
class Technique(models.Model):
    # other fields...
    model_dependency = models.CharField(max_length=255)
    # other fields...
```

**Decision:**
Maintain the current implementation as a simple CharField. This attribute serves as a basic categorization that doesn't require a more complex relationship structure.

---

### 5.2 Multiple Example Use Cases

**Current Implementation:**
```python
class Technique(models.Model):
    # other fields...
    example_use_case = models.TextField()
    # other fields...
```

**Proposed Changes:**
```python
class TechniqueExampleUseCase(models.Model):
    technique = models.ForeignKey(Technique, on_delete=models.CASCADE, related_name='example_use_cases')
    description = models.TextField()
    assurance_goal = models.ForeignKey(AssuranceGoal, on_delete=models.CASCADE, null=True, blank=True)
    
    class Meta:
        db_table = 'technique_example_use_case'
```

**Rationale:**
This change allows a technique to have multiple example use cases, which is particularly valuable when a technique applies to multiple assurance goals. The optional assurance_goal field allows examples to be associated with specific goals when relevant.

---

### 5.3 Goal-Specific Attributes (Scope, FairnessApproach, etc.)

**Current Implementation:**
```python
class Technique(models.Model):
    # other fields...
    scope = models.CharField(max_length=255, blank=True, null=True)
    fairness_approach = models.ManyToManyField(FairnessApproach, through='TechniqueFairnessApproach', blank=True)
    # other fields...
```

**Proposed Changes:**
Implement the AttributeType/AttributeValue system from the plan:

```python
class AttributeType(models.Model):
    """Defines types of attributes that can be associated with techniques"""
    name = models.CharField(max_length=255, unique=True)
    description = models.TextField()
    applicable_goals = models.ManyToManyField(AssuranceGoal, blank=True)
    required_for_goals = models.ManyToManyField(
        AssuranceGoal, 
        related_name='required_attribute_types',
        blank=True
    )
    
    def __str__(self):
        return self.name

class AttributeValue(models.Model):
    """Possible values for attributes"""
    attribute_type = models.ForeignKey(AttributeType, on_delete=models.CASCADE, related_name='values')
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    
    class Meta:
        unique_together = ('attribute_type', 'name')
    
    def __str__(self):
        return f"{self.attribute_type.name}: {self.name}"

class TechniqueAttribute(models.Model):
    """Associates attribute values with techniques"""
    technique = models.ForeignKey(Technique, on_delete=models.CASCADE, related_name='attributes')
    attribute_value = models.ForeignKey(AttributeValue, on_delete=models.CASCADE)
    
    class Meta:
        unique_together = ('technique', 'attribute_value')
```

**Rationale:**
This flexible attribute system accommodates goal-specific attributes like 'scope' for explainability and 'fairness approach' for fairness without requiring schema changes when new attribute types are needed. The `required_for_goals` relationship allows enforcing that techniques associated with certain goals must have specific attribute types.

---

### 5.4 Enhanced Resource Links

**Current Implementation:**
```python
class Technique(models.Model):
    # other fields...
    reference = models.URLField(blank=True)
    software_package = models.URLField(blank=True)
    # other fields...
```

**Proposed Changes:**
```python
class ResourceType(models.Model):
    """Types of resources (e.g., GitHub, arXiv, DOI, Website)"""
    name = models.CharField(max_length=100, unique=True)
    icon = models.CharField(max_length=50, blank=True)  # For frontend display
    
    def __str__(self):
        return self.name

class TechniqueResource(models.Model):
    """Resources/links associated with techniques"""
    technique = models.ForeignKey(Technique, on_delete=models.CASCADE, related_name='resources')
    resource_type = models.ForeignKey(ResourceType, on_delete=models.PROTECT)
    title = models.CharField(max_length=255)
    url = models.URLField()
    description = models.TextField(blank=True)
    
    class Meta:
        unique_together = ('technique', 'url')
    
    def __str__(self):
        return f"{self.resource_type.name}: {self.title}"
```

**Rationale:**
This model allows for multiple categorized resources per technique, providing much more flexibility than the current single-URL fields. Users can add various resource types (GitHub repositories, academic papers, documentation, etc.) with descriptive titles.

---

### 5.5 Multiple Limitations

**Current Implementation:**
```python
class Technique(models.Model):
    # other fields...
    limitation = models.TextField(blank=True)
    # other fields...
```

**Proposed Changes:**
```python
class TechniqueLimitation(models.Model):
    technique = models.ForeignKey(Technique, on_delete=models.CASCADE, related_name='limitations')
    description = models.TextField()
    
    def __str__(self):
        return f"Limitation for {self.technique.name}"
```

**Rationale:**
Similar to example use cases, allowing multiple limitation descriptions provides more flexibility, especially for techniques that span multiple assurance goals or have different limitations in different contexts.

---

### 5.6 Tags System

**Current Implementation:**
```python
class Tag(models.Model):
    name = models.CharField(max_length=255, unique=True)

class TechniqueTag(models.Model):
    technique = models.ForeignKey(Technique, on_delete=models.CASCADE)
    tag = models.ForeignKey(Tag, on_delete=models.CASCADE)
    
    class Meta:
        unique_together = ('technique', 'tag')
```

**Decision:**
Maintain the current implementation. The existing many-to-many relationship through TechniqueTag adequately supports the flexible tagging system needed.

---

## Implementation Considerations:

1. The update should include data transfer from existing fields to the new relational structures
2. Frontend forms will need updating to support these more complex data structures
3. API endpoints must be enhanced to expose the richer relationships
4. Validation logic should enforce goal-specific attribute requirements

The proposed changes significantly improve the flexibility and robustness of the data model while addressing the specific requirements for each attribute type.

## 6. Removal of Unused or Deprecated Models

For a cleaner codebase and database schema, we should remove models that are not currently being used.

**Models to Remove:**

### 6.1 Project Lifecycle Stage Models

```python
class ProjectLifecycleStage(models.Model):
    name = models.CharField(max_length=255, unique=True)
    description = models.TextField()

class TechniqueProjectLifecycleStage(models.Model):
    technique = models.ForeignKey(Technique, on_delete=models.CASCADE)
    project_lifecycle_stage = models.ForeignKey(ProjectLifecycleStage, on_delete=models.CASCADE)
```

**Rationale:**
These models appear to be fairness-specific attributes that are not currently being utilized effectively. Rather than maintaining separate specialized models, any future lifecycle stage information can be handled through the more flexible AttributeType/AttributeValue system proposed in section 5.3.

**Implementation Steps:**
1. Create code to delete these tables
2. Remove references from the Technique model
3. Remove related serializers and views
4. Update any form fields or UI elements that reference these models

### 6.2 Clean Up Commented-Out Code

The codebase contains commented-out models that were likely part of previous design iterations:

```python
# class TechniqueCategory(models.Model):
#     technique = models.ForeignKey(Technique, on_delete=models.CASCADE)
#     category = models.ForeignKey(Category, on_delete=models.CASCADE)

# class TechniqueSubCategory(models.Model):
#     technique = models.ForeignKey(Technique, on_delete=models.CASCADE)
#     sub_category = models.ForeignKey(SubCategory, on_delete=models.CASCADE)
```

**Implementation Steps:**
1. Remove commented-out code that is no longer relevant
2. Ensure documentation reflects the current and planned data model
3. Clean up any other deprecated code fragments

**Benefit:**
These cleanup actions will reduce confusion during development and maintenance, leading to a clearer codebase that better reflects the current system design.