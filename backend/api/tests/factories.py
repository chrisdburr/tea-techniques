import factory
from faker import Faker
from api.models import (
    Technique,
    Category,
    SubCategory,
    AssuranceGoal,
    Tag,
    AttributeType,
    AttributeValue,
    ResourceType,
    TechniqueResource,
    TechniqueExampleUseCase,
    TechniqueLimitation,
)

fake = Faker()


class AssuranceGoalFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = AssuranceGoal

    name = factory.LazyFunction(lambda: fake.unique.word().capitalize())
    description = factory.LazyFunction(lambda: fake.paragraph())


class CategoryFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = Category

    name = factory.LazyFunction(lambda: fake.unique.word().capitalize())
    description = factory.LazyFunction(lambda: fake.paragraph())
    assurance_goal = factory.SubFactory(AssuranceGoalFactory)


class SubCategoryFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = SubCategory

    name = factory.LazyFunction(lambda: fake.unique.word().capitalize())
    description = factory.LazyFunction(lambda: fake.paragraph())
    category = factory.SubFactory(CategoryFactory)


class TagFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = Tag

    name = factory.LazyFunction(lambda: fake.unique.word().capitalize())


class AttributeTypeFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = AttributeType

    name = factory.LazyFunction(lambda: fake.unique.word().capitalize())
    description = factory.LazyFunction(lambda: fake.paragraph())

    @factory.post_generation
    def applicable_goals(self, create, extracted, **kwargs):
        if not create:
            return

        if extracted:
            for goal in extracted:
                self.applicable_goals.add(goal)

    @factory.post_generation
    def required_for_goals(self, create, extracted, **kwargs):
        if not create:
            return

        if extracted:
            for goal in extracted:
                self.required_for_goals.add(goal)


class AttributeValueFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = AttributeValue

    name = factory.LazyFunction(lambda: fake.word().capitalize())
    description = factory.LazyFunction(lambda: fake.sentence())
    attribute_type = factory.SubFactory(AttributeTypeFactory)
    technique = factory.SubFactory('api.tests.factories.TechniqueFactory')


class ResourceTypeFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = ResourceType

    name = factory.LazyFunction(lambda: fake.unique.word().capitalize())
    icon = factory.LazyFunction(lambda: fake.word().lower())


class TechniqueFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = Technique

    name = factory.LazyFunction(lambda: fake.unique.sentence(nb_words=3))
    description = factory.LazyFunction(lambda: fake.paragraph())
    model_dependency = factory.LazyFunction(
        lambda: fake.random_element(elements=("Model-Agnostic", "Model-Specific"))
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
            self.assurance_goals.add(AssuranceGoalFactory())

    @factory.post_generation
    def categories(self, create, extracted, **kwargs):
        if not create:
            return

        if extracted:
            for category in extracted:
                self.categories.add(category)
        else:
            self.categories.add(CategoryFactory())

    @factory.post_generation
    def subcategories(self, create, extracted, **kwargs):
        if not create:
            return

        if extracted:
            for subcategory in extracted:
                self.subcategories.add(subcategory)

    @factory.post_generation
    def tags(self, create, extracted, **kwargs):
        if not create:
            return

        if extracted:
            for tag in extracted:
                self.tags.add(tag)


# TechniqueAttribute has been replaced with AttributeValue
# that directly links to Technique
class AttributeValueFactoryWithTechnique(factory.django.DjangoModelFactory):
    class Meta:
        model = AttributeValue

    technique = factory.SubFactory(TechniqueFactory)
    attribute_type = factory.SubFactory(AttributeTypeFactory)
    name = factory.LazyFunction(lambda: fake.word().capitalize())
    description = factory.LazyFunction(lambda: fake.sentence())


class TechniqueResourceFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = TechniqueResource

    technique = factory.SubFactory(TechniqueFactory)
    resource_type = factory.SubFactory(ResourceTypeFactory)
    title = factory.LazyFunction(lambda: fake.sentence())
    url = factory.LazyFunction(lambda: fake.url())
    description = factory.LazyFunction(lambda: fake.paragraph())


class TechniqueExampleUseCaseFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = TechniqueExampleUseCase

    technique = factory.SubFactory(TechniqueFactory)
    description = factory.LazyFunction(lambda: fake.paragraph())
    assurance_goal = factory.SubFactory(AssuranceGoalFactory)


class TechniqueLimitationFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = TechniqueLimitation

    technique = factory.SubFactory(TechniqueFactory)
    description = factory.LazyFunction(lambda: fake.paragraph())
