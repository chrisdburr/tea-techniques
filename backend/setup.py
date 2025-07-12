from setuptools import find_packages, setup

setup(
    name="tea-techniques-backend",
    version="0.1.0",
    packages=find_packages(),
    install_requires=[
        "djangorestframework>=3.15.2",
        "django-filter>=24.3",
        "django>=5.1.1",
    ],
)
