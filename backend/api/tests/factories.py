import factory
from faker import Faker
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


class AssuranceGoalFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = AssuranceGoal

    name = factory.LazyFunction(lambda: fake.unique.word().capitalize())
    description = factory.LazyFunction(lambda: fake.paragraph())




class TagFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = Tag

    name = factory.LazyFunction(lambda: fake.unique.word().capitalize())




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
    def tags(self, create, extracted, **kwargs):
        if not create:
            return

        if extracted:
            for tag in extracted:
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
