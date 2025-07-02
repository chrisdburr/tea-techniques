import factory
import datetime
from faker import Faker
from typing import List, Optional
from api.models import (
    Technique,
    AssuranceGoal,
    Tag,
    ResourceType,
    TechniqueResource,
    TechniqueExampleUseCase,
    TechniqueLimitation,
)

fake = Faker()

# Realistic domain-specific data for TEA techniques
ASSURANCE_GOALS = [
    "Explainability", "Fairness", "Privacy", "Reliability", 
    "Safety", "Transparency", "Accountability", "Robustness"
]

TECHNIQUE_CATEGORIES = [
    "algorithmic", "data-centric", "model-agnostic", "interpretability",
    "bias-detection", "privacy-preserving", "robustness-testing", "monitoring"
]

RESOURCE_TYPES = [
    "Technical Paper", "Review Paper", "Introductory Paper", "GitHub",
    "Documentation", "Tutorial", "Book", "Survey", "Blog", "Tool",
    "Law/Policy", "Software Package", "Dataset", "Benchmark"
]

TECHNIQUE_PREFIXES = [
    "SHapley Additive exPlanations", "Local Interpretable Model-agnostic Explanations",
    "Gradient-based", "Attention-based", "Counterfactual", "Adversarial",
    "Differential Privacy", "Federated", "Ensemble", "Meta-learning"
]

TECHNIQUE_DOMAINS = [
    "Computer Vision", "Natural Language Processing", "Recommender Systems",
    "Time Series Analysis", "Graph Neural Networks", "Reinforcement Learning",
    "Healthcare AI", "Financial AI", "Autonomous Systems", "Social Media Analysis"
]


class AssuranceGoalFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = AssuranceGoal
        django_get_or_create = ('name',)

    name = factory.LazyFunction(lambda: fake.random_element(ASSURANCE_GOALS))
    description = factory.LazyAttribute(
        lambda obj: f"{obj.name} techniques for trustworthy AI systems, "
                   f"focusing on {fake.words(nb=3, ext_word_list=None, unique=False)}"
    )


class TagFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = Tag
        django_get_or_create = ('name',)

    name = factory.LazyFunction(
        lambda: f"{fake.random_element(TECHNIQUE_CATEGORIES)}-{fake.word().lower()}"
    )


class ResourceTypeFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = ResourceType
        django_get_or_create = ('name',)

    name = factory.LazyFunction(lambda: fake.random_element(RESOURCE_TYPES))
    icon = factory.LazyAttribute(
        lambda obj: obj.name.lower().replace(" ", "_").replace("/", "_")
    )


class TechniqueFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = Technique

    name = factory.LazyFunction(
        lambda: f"{fake.random_element(TECHNIQUE_PREFIXES)} ({fake.random_element(['SHAP', 'LIME', 'GRAD', 'ATT', 'CF'])})"
    )
    
    description = factory.LazyFunction(
        lambda: (
            f"This technique addresses {fake.random_element(ASSURANCE_GOALS).lower()} "
            f"in {fake.random_element(TECHNIQUE_DOMAINS)} by {fake.sentence(nb_words=15)}. "
            f"It works by {fake.sentence(nb_words=20)} "
            f"The approach is particularly effective for {fake.words(nb=5)} scenarios."
        )
    )
    
    complexity_rating = factory.LazyFunction(lambda: fake.random_int(min=1, max=5))
    computational_cost_rating = factory.LazyFunction(lambda: fake.random_int(min=1, max=5))

    @factory.post_generation
    def assurance_goals(self, create, extracted, **kwargs):
        if not create:
            return

        if extracted:
            for goal in extracted:
                self.assurance_goals.add(goal)
        else:
            # Add 1-3 random assurance goals
            num_goals = fake.random_int(min=1, max=3)
            goals = [AssuranceGoalFactory() for _ in range(num_goals)]
            for goal in goals:
                self.assurance_goals.add(goal)

    @factory.post_generation
    def tags(self, create, extracted, **kwargs):
        if not create:
            return

        if extracted:
            for tag in extracted:
                self.tags.add(tag)
        else:
            # Add 2-5 random tags
            num_tags = fake.random_int(min=2, max=5)
            tags = [TagFactory() for _ in range(num_tags)]
            for tag in tags:
                self.tags.add(tag)

    @factory.post_generation
    def related_techniques(self, create, extracted, **kwargs):
        if not create:
            return

        if extracted:
            for technique in extracted:
                self.related_techniques.add(technique)


class TechniqueResourceFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = TechniqueResource

    technique = factory.SubFactory(TechniqueFactory)
    resource_type = factory.SubFactory(ResourceTypeFactory)
    
    title = factory.LazyFunction(
        lambda: f"{fake.catch_phrase()}: {fake.sentence(nb_words=6)}"
    )
    
    url = factory.LazyFunction(lambda: fake.url())
    
    description = factory.LazyFunction(
        lambda: f"This resource provides {fake.sentence(nb_words=12)} "
                f"It covers {fake.words(nb=4)} and includes {fake.sentence(nb_words=8)}"
    )
    
    authors = factory.LazyFunction(
        lambda: ", ".join([fake.name() for _ in range(fake.random_int(min=1, max=4))])
    )
    
    publication_date = factory.LazyFunction(
        lambda: fake.date_between(start_date=datetime.date(2020, 1, 1), end_date=datetime.date.today())
    )
    
    source_type = factory.LazyAttribute(lambda obj: obj.resource_type.name)


class TechniqueExampleUseCaseFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = TechniqueExampleUseCase

    technique = factory.SubFactory(TechniqueFactory)
    assurance_goal = factory.SubFactory(AssuranceGoalFactory)
    
    description = factory.LazyFunction(
        lambda: (
            f"In a {fake.random_element(TECHNIQUE_DOMAINS)} scenario, "
            f"this technique can be applied to {fake.sentence(nb_words=15)} "
            f"For example, {fake.sentence(nb_words=20)} "
            f"This helps ensure {fake.words(nb=3)} while maintaining {fake.words(nb=2)} performance."
        )
    )


class TechniqueLimitationFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = TechniqueLimitation

    technique = factory.SubFactory(TechniqueFactory)
    
    description = factory.LazyFunction(
        lambda: (
            f"This technique has limitations when {fake.sentence(nb_words=12)} "
            f"Specifically, it may struggle with {fake.words(nb=4)} scenarios "
            f"and requires careful consideration of {fake.words(nb=3)} factors."
        )
    )


# Utility factory classes for comprehensive testing scenarios

class CompleteTechniqueFactory(TechniqueFactory):
    """Factory that creates a technique with all related objects populated"""
    
    @factory.post_generation
    def create_complete_technique(self, create, extracted, **kwargs):
        if not create:
            return
            
        # Create 2-4 resources
        num_resources = fake.random_int(min=2, max=4)
        for _ in range(num_resources):
            TechniqueResourceFactory(technique=self)
            
        # Create 1-3 example use cases
        num_use_cases = fake.random_int(min=1, max=3)
        for _ in range(num_use_cases):
            TechniqueExampleUseCaseFactory(technique=self)
            
        # Create 2-5 limitations
        num_limitations = fake.random_int(min=2, max=5)
        for _ in range(num_limitations):
            TechniqueLimitationFactory(technique=self)


class MinimalTechniqueFactory(TechniqueFactory):
    """Factory for minimal technique with only required fields"""
    
    @factory.post_generation
    def assurance_goals(self, create, extracted, **kwargs):
        # Don't auto-create any relationships
        pass

    @factory.post_generation
    def tags(self, create, extracted, **kwargs):
        # Don't auto-create any relationships
        pass

    @factory.post_generation
    def related_techniques(self, create, extracted, **kwargs):
        # Don't auto-create any relationships
        pass


class IsolatedTechniqueFactory(factory.django.DjangoModelFactory):
    """Factory that creates a technique with NO automatic relationships"""
    
    class Meta:
        model = Technique

    name = factory.LazyFunction(
        lambda: f"Isolated Technique {fake.word()} ({fake.random_int(min=1000, max=9999)})"
    )
    
    description = factory.LazyFunction(
        lambda: f"Test technique for isolated testing. {fake.sentence(nb_words=10)}"
    )
    
    complexity_rating = factory.LazyFunction(lambda: fake.random_int(min=1, max=5))
    computational_cost_rating = factory.LazyFunction(lambda: fake.random_int(min=1, max=5))


# Test data utility functions

def create_test_assurance_goals() -> List[AssuranceGoal]:
    """Create all standard assurance goals for testing"""
    return [AssuranceGoalFactory(name=goal) for goal in ASSURANCE_GOALS]


def create_test_resource_types() -> List[ResourceType]:
    """Create all standard resource types for testing"""
    return [ResourceTypeFactory(name=res_type) for res_type in RESOURCE_TYPES]


def create_realistic_technique_dataset(count: int = 10) -> List[Technique]:
    """Create a realistic dataset of techniques for integration testing"""
    techniques = []
    
    # Create foundational data
    goals = create_test_assurance_goals()
    resource_types = create_test_resource_types()
    
    for _ in range(count):
        technique = CompleteTechniqueFactory()
        techniques.append(technique)
        
    return techniques


def create_edge_case_techniques() -> List[Technique]:
    """Create techniques with edge case data for testing robustness"""
    edge_cases = []
    
    # Technique with maximum ratings
    edge_cases.append(TechniqueFactory(
        complexity_rating=5,
        computational_cost_rating=5,
        name="Maximum Complexity Technique",
        description="A" * 1000  # Very long description
    ))
    
    # Technique with minimum ratings
    edge_cases.append(TechniqueFactory(
        complexity_rating=1,
        computational_cost_rating=1,
        name="Min",  # Very short name
        description="Short description."
    ))
    
    # Technique with special characters
    edge_cases.append(TechniqueFactory(
        name="Technique with Special Characters: &$@#%",
        description="Description with unicode: αβγδε and emojis: 🤖🔬📊"
    ))
    
    return edge_cases