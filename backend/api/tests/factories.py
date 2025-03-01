import factory
from faker import Faker
from api.models import Technique, Category, SubCategory, AssuranceGoal

fake = Faker()

class CategoryFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = Category
    
    name = factory.LazyFunction(lambda: fake.word().capitalize())

class SubCategoryFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = SubCategory
    
    name = factory.LazyFunction(lambda: fake.word().capitalize())
    category = factory.SubFactory(CategoryFactory)

class AssuranceGoalFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = AssuranceGoal
    
    name = factory.LazyFunction(lambda: fake.sentence(nb_words=3))
    description = factory.LazyFunction(lambda: fake.paragraph())

class TechniqueFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = Technique
    
    name = factory.LazyFunction(lambda: fake.sentence(nb_words=2))
    description = factory.LazyFunction(lambda: fake.paragraph())
    example_use_case = factory.LazyFunction(lambda: fake.paragraph())
    model_dependency = factory.LazyFunction(lambda: fake.random_element(elements=('Agnostic', 'Specific')))
    
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
        else:
            self.subcategories.add(SubCategoryFactory())
    
    @factory.post_generation
    def assurance_goals(self, create, extracted, **kwargs):
        if not create:
            return
        
        if extracted:
            for goal in extracted:
                self.assurance_goals.add(goal)
        else:
            self.assurance_goals.add(AssuranceGoalFactory())