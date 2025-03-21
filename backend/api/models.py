from django.db import models


class AssuranceGoal(models.Model):
    name = models.CharField(max_length=255, unique=True)
    description = models.TextField()

    class Meta:
        db_table = "assurance_goal"
        verbose_name_plural = "Assurance Goals"

    def __str__(self):
        return self.name


class Category(models.Model):
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    assurance_goal = models.ForeignKey(AssuranceGoal, on_delete=models.CASCADE)

    class Meta:
        db_table = "category"
        verbose_name_plural = "Categories"
        unique_together = ("name", "assurance_goal")

    def __str__(self):
        return f"{self.name} ({self.assurance_goal.name})"


class SubCategory(models.Model):
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    category = models.ForeignKey(
        Category, on_delete=models.CASCADE, related_name="subcategories"
    )

    class Meta:
        db_table = "subcategory"
        verbose_name_plural = "Subcategories"
        unique_together = ("name", "category")

    def __str__(self):
        return f"{self.name} ({self.category.name})"


class Tag(models.Model):
    name = models.CharField(max_length=255, unique=True)

    class Meta:
        db_table = "tag"

    def __str__(self):
        return self.name


class ResourceType(models.Model):
    name = models.CharField(max_length=100, unique=True)
    icon = models.CharField(max_length=50, blank=True)

    class Meta:
        db_table = "resource_type"

    def __str__(self):
        return self.name


class Technique(models.Model):
    name = models.CharField(max_length=255, unique=True)
    description = models.TextField()
    model_dependency = models.CharField(max_length=100)
    category_tags = models.CharField(
        max_length=500, blank=True, help_text="Format: #category/subcategory"
    )
    complexity_rating = models.PositiveSmallIntegerField(null=True, blank=True)
    computational_cost_rating = models.PositiveSmallIntegerField(null=True, blank=True)
    applicable_models = models.JSONField(
        null=True,
        blank=True,
        help_text="List of model types this technique is applicable to (for model-specific techniques)",
    )
    assurance_goals = models.ManyToManyField(AssuranceGoal, related_name="techniques")
    categories = models.ManyToManyField(Category, related_name="techniques")
    subcategories = models.ManyToManyField(
        SubCategory, related_name="techniques", blank=True
    )
    tags = models.ManyToManyField(Tag, related_name="techniques", blank=True)

    class Meta:
        db_table = "technique"

    def __str__(self):
        return self.name


class AttributeType(models.Model):
    name = models.CharField(max_length=255, unique=True)
    description = models.TextField(blank=True)

    class Meta:
        db_table = "attribute_type"

    def __str__(self):
        return self.name


class AttributeValue(models.Model):
    attribute_type = models.ForeignKey(
        AttributeType, on_delete=models.CASCADE, related_name="values"
    )
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)

    technique = models.ForeignKey(
        Technique, on_delete=models.CASCADE, related_name="attribute_values"
    )

    class Meta:
        db_table = "attribute_value"
        unique_together = ("attribute_type", "name", "technique")

    def __str__(self):
        return f"{self.attribute_type.name}: {self.name}"


class TechniqueResource(models.Model):
    technique = models.ForeignKey(
        Technique, on_delete=models.CASCADE, related_name="resources"
    )
    resource_type = models.ForeignKey(ResourceType, on_delete=models.PROTECT)
    title = models.CharField(max_length=255)
    url = models.URLField()
    description = models.TextField(blank=True)
    authors = models.CharField(max_length=500, blank=True, null=True)
    publication_date = models.CharField(max_length=50, blank=True, null=True)

    class Meta:
        db_table = "technique_resource"
        unique_together = ("technique", "url")

    def __str__(self):
        return f"{self.resource_type.name}: {self.title}"


class TechniqueExampleUseCase(models.Model):
    technique = models.ForeignKey(
        Technique, on_delete=models.CASCADE, related_name="example_use_cases"
    )
    description = models.TextField()
    assurance_goal = models.ForeignKey(
        AssuranceGoal, on_delete=models.CASCADE, null=True, blank=True
    )

    class Meta:
        db_table = "technique_example_use_case"

    def __str__(self):
        return f"Use case for {self.technique.name}"


class TechniqueLimitation(models.Model):
    technique = models.ForeignKey(
        Technique, on_delete=models.CASCADE, related_name="limitations"
    )
    description = models.TextField()

    class Meta:
        db_table = "technique_limitation"

    def __str__(self):
        return f"Limitation for {self.technique.name}"
