# run this to create a random key for the .env file
from django.core.management.utils import get_random_secret_key
print(get_random_secret_key())