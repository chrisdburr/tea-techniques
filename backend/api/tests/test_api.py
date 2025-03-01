from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from api.models import Technique
from api.tests.factories import TechniqueFactory, CategoryFactory, SubCategoryFactory
import json

class TechniqueAPITestCase(APITestCase):
    def setUp(self):
        self.url = reverse('api:technique-list')
        self.category = CategoryFactory()
        self.subcategory = SubCategoryFactory(category=self.category)
        
        # Create sample techniques
        self.technique1 = TechniqueFactory(
            name="Test Technique 1",
            categories=[self.category],
            subcategories=[self.subcategory]
        )
        self.technique2 = TechniqueFactory(
            name="Test Technique 2",
            categories=[self.category],
            subcategories=[self.subcategory]
        )
    
    def test_get_technique_list(self):
        """Test retrieving a list of techniques"""
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 2)
        self.assertEqual(response.data[0]['name'], "Test Technique 1")
        self.assertEqual(response.data[1]['name'], "Test Technique 2")
    
    def test_get_technique_detail(self):
        """Test retrieving a specific technique"""
        url = reverse('api:technique-detail', kwargs={'pk': self.technique1.pk})
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['name'], "Test Technique 1")
    
    def test_create_technique(self):
        """Test creating a technique"""
        data = {
            "name": "New Test Technique",
            "description": "Description for new test technique",
            "model_dependency": "Agnostic",
            "example_use_case": "Example use case for new technique",
            "categories": [self.category.id],
            "subcategories": [self.subcategory.id]
        }
        response = self.client.post(self.url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Technique.objects.count(), 3)
        self.assertEqual(Technique.objects.get(name="New Test Technique").name, "New Test Technique")
    
    def test_update_technique(self):
        """Test updating a technique"""
        url = reverse('api:technique-detail', kwargs={'pk': self.technique1.pk})
        data = {
            "name": "Updated Test Technique",
            "description": "Updated description",
            "model_dependency": self.technique1.model_dependency,
            "example_use_case": self.technique1.example_use_case,
            "categories": [cat.id for cat in self.technique1.categories.all()],
            "subcategories": [subcat.id for subcat in self.technique1.subcategories.all()]
        }
        response = self.client.put(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['name'], "Updated Test Technique")
        self.assertEqual(response.data['description'], "Updated description")
        
        # Verify the update in the database
        self.technique1.refresh_from_db()
        self.assertEqual(self.technique1.name, "Updated Test Technique")
        self.assertEqual(self.technique1.description, "Updated description")
    
    def test_filter_techniques_by_category(self):
        """Test filtering techniques by category"""
        new_category = CategoryFactory(name="FilterCategory")
        new_technique = TechniqueFactory(name="Filtered Technique", categories=[new_category])
        
        url = f"{self.url}?category={new_category.id}"
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['name'], "Filtered Technique")
    
    def test_filter_techniques_by_name(self):
        """Test filtering techniques by name"""
        TechniqueFactory(name="SpecialName Technique")
        
        url = f"{self.url}?name=SpecialName"
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['name'], "SpecialName Technique")
    
    def test_delete_technique(self):
        """Test deleting a technique"""
        url = reverse('api:technique-detail', kwargs={'pk': self.technique1.pk})
        response = self.client.delete(url)
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertEqual(Technique.objects.count(), 1)
        self.assertFalse(Technique.objects.filter(pk=self.technique1.pk).exists())