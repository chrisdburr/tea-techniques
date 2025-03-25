# Model Architecture

> [!NOTE]
> The TEA Techniques application is built around a core set of models that represent techniques for evidencing claims about responsible AI design, development, and deployment. The model architecture follows a hierarchical structure with assurance goals at the top level, followed by categories, subcategories, and techniques.

## Entity Relationship Diagram

```
┌─────────────────┐     ┌───────────────┐     ┌────────────────┐
│  AssuranceGoal  │     │    Category   │     │   SubCategory  │
├─────────────────┤     ├───────────────┤     ├────────────────┤
│ id              │     │ id            │     │ id             │
│ name            │────┐│ name          │────┐│ name           │
│ description     │    ││ description   │    ││ description    │
└─────────────────┘    │└───────────────┘    │└────────────────┘
                       │                      │
                       │                      │
┌─────────────────┐    │    ┌───────────────┐│    ┌────────────────┐
│    Technique    │    │    │AttributeType  ││    │ AttributeValue  │
├─────────────────┤    │    ├───────────────┤│    ├────────────────┤
│ id              │    │    │ id            ││    │ id             │
│ name            │    │    │ name          ││    │ attribute_type │
│ description     │    │    │ description   ││    │ name           │
│ model_dependency│◄───┼────┤               ││◄───┤ description    │
│ complexity      │    │    └───────────────┘│    │ technique      │
│ comp_cost       │    │                     │    └────────────────┘
└───────┬─────────┘    │                     │
        │              │                     │
        │              │                     │
        ▼              │                     │
┌─────────────────┐    │                     │
│  TechResource   │    │                     │
├─────────────────┤    │                     │
│ id              │    │                     │
│ technique       │◄───┘                     │
│ resource_type   │                          │
│ title           │                          │
│ url             │                          │
│ description     │                          │
└─────────────────┘                          │
                                             │
┌─────────────────┐                          │
│  TechUseCase    │                          │
├─────────────────┤                          │
│ id              │                          │
│ technique       │◄─────────────────────────┘
│ description     │
│ assurance_goal  │
└─────────────────┘

┌─────────────────┐
│ TechLimitation  │
├─────────────────┤
│ id              │
│ technique       │◄─────────────────────────┐
│ description     │                          │
└─────────────────┘                          │
                                             │
┌─────────────────┐                          │
│ ResourceType    │                          │
├─────────────────┤                          │
│ id              │                          │
│ name            │◄─────────────────────────┘
│ icon            │
└─────────────────┘
```

## Core Models

### AssuranceGoal

The highest level of classification for techniques. Represents broad goals in responsible AI such as fairness, transparency, safety, etc.

```python
class AssuranceGoal(models.Model):
    name = models.CharField(max_length=255, unique=True)
    description = models.TextField()
```

### Category

A domain within an assurance goal. Each category belongs to a specific assurance goal.

```python
class Category(models.Model):
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    assurance_goal = models.ForeignKey(AssuranceGoal, on_delete=models.CASCADE)
```

### SubCategory

A specific area within a category. Each subcategory belongs to a specific category.

```python
class SubCategory(models.Model):
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    category = models.ForeignKey(Category, on_delete=models.CASCADE, related_name="subcategories")
```

### Technique

The central model representing a specific technique for evidencing claims about responsible AI.

```python
class Technique(models.Model):
    name = models.CharField(max_length=255, unique=True)
    description = models.TextField()
    model_dependency = models.CharField(max_length=100)
    category_tags = models.CharField(max_length=500, blank=True)
    complexity_rating = models.PositiveSmallIntegerField(null=True, blank=True)
    computational_cost_rating = models.PositiveSmallIntegerField(null=True, blank=True)
    applicable_models = models.JSONField(null=True, blank=True)
    assurance_goals = models.ManyToManyField(AssuranceGoal, related_name="techniques")
    categories = models.ManyToManyField(Category, related_name="techniques")
    subcategories = models.ManyToManyField(SubCategory, related_name="techniques", blank=True)
    tags = models.ManyToManyField(Tag, related_name="techniques", blank=True)
```

## Supporting Models

### Tag

Simple tagging system for techniques.

```python
class Tag(models.Model):
    name = models.CharField(max_length=255, unique=True)
```

### AttributeType and AttributeValue

Flexible attributes system for techniques. Types define the kinds of attributes, and values store the specific values for each technique.

```python
class AttributeType(models.Model):
    name = models.CharField(max_length=255, unique=True)
    description = models.TextField(blank=True)

class AttributeValue(models.Model):
    attribute_type = models.ForeignKey(AttributeType, on_delete=models.CASCADE, related_name="values")
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    technique = models.ForeignKey(Technique, on_delete=models.CASCADE, related_name="attribute_values")
```

### ResourceType and TechniqueResource

System for linking techniques to external resources like papers, code repositories, and documentation.

```python
class ResourceType(models.Model):
    name = models.CharField(max_length=100, unique=True)
    icon = models.CharField(max_length=50, blank=True)

class TechniqueResource(models.Model):
    technique = models.ForeignKey(Technique, on_delete=models.CASCADE, related_name="resources")
    resource_type = models.ForeignKey(ResourceType, on_delete=models.PROTECT)
    title = models.CharField(max_length=255)
    url = models.URLField()
    description = models.TextField(blank=True)
    authors = models.CharField(max_length=500, blank=True, null=True)
    publication_date = models.CharField(max_length=50, blank=True, null=True)
    source_type = models.CharField(max_length=100, blank=True, null=True)
```

### TechniqueExampleUseCase and TechniqueLimitation

Additional information about techniques.

```python
class TechniqueExampleUseCase(models.Model):
    technique = models.ForeignKey(Technique, on_delete=models.CASCADE, related_name="example_use_cases")
    description = models.TextField()
    assurance_goal = models.ForeignKey(AssuranceGoal, on_delete=models.CASCADE, null=True, blank=True)

class TechniqueLimitation(models.Model):
    technique = models.ForeignKey(Technique, on_delete=models.CASCADE, related_name="limitations")
    description = models.TextField()
```

## Key Relationships

- **Hierarchical Classification**: AssuranceGoal → Category → SubCategory
- **Many-to-Many**: Techniques can belong to multiple assurance goals, categories, subcategories, and tags
- **One-to-Many**: Techniques can have multiple attributes, resources, use cases, and limitations

> [!TIP] Model Dependency
> The `model_dependency` field on Technique indicates whether a technique is:
>
> - **Model-Agnostic**: Works with any AI model
> - **Model-Specific**: Works only with specific types of AI models
>
> For model-specific techniques, the `applicable_models` field stores a JSON array of specific model types.

## Rating Systems

Techniques include two rating fields:

- **complexity_rating**: How difficult the technique is to implement (1-5 scale)
- **computational_cost_rating**: How computationally expensive the technique is to run (1-5 scale)

> [!IMPORTANT] Database Considerations
> The application supports both SQLite (for development) and PostgreSQL (for production) databases. Some special handling is required for SQLite due to schema compatibility issues, particularly with JSONField.

## Schema Evolution

When modifying the model schema, follow these steps in order:

1. Create Django migrations: `python manage.py makemigrations`
2. Apply migrations: `python manage.py migrate`
3. Update the related serializers in `serializers.py`
4. Update the JSON data structure in `techniques.json`
5. For SQLite deployments, handle missing columns with `add_missing_columns` management command

## Related Links

- [Data Management Guide](DATA-MANAGEMENT.md) - How to manage and import technique data
- [API Guide](API-GUIDE.md) - API endpoints for accessing the models
- [Django Models Documentation](https://docs.djangoproject.com/en/5.1/topics/db/models/)
