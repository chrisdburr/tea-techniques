# Explainability Techniques

A simple (and work-in-progress) Django app for interacting with a database of XAI techniques. 

## Quickstart

### Clone repository

```shell
git clone https://github.com/chrisdburr/tea-XAI-demo.git && cd tea-XAI-demo
```

### Populate `.env` file

- Create a `.env` file in the root directory and ensure the following environment variables are set

```.env
# PostgreSQL settings
DB_USER=username
DB_PASSWORD=password
DB_HOST=localhost
DB_NAME=xai-techniques
DB_PORT=5432 # change if necessary in case of port conflicts
```

### Install Python dependancies and activate the virtual environment

> [!WARNING]  
> This repository contains a `pyproject.toml` file, created using [Poetry](https://python-poetry.org/docs/#installation) to manage virtual environments and packages. Instructions for poetry are below, but will need to be modified if using alternatives, such as conda or pyvenv.

```shell
poetry install
eval $(poetry env activate)
```

### Setup postgres container

1. Ensure environment variables are set (see above)
2. Create docker container using `docker compose up -d`
3. Test to ensure the container is running correctly using `docker ps`

### Populate database

Once the virtual environment, packages, and container are created/running, you can populate the database.

```shell
python manage.py makemigrations
python manage.py migrate
python load_and_import.py
```

### Run Django App

Assuming no errors were reported in the previous steps, you can now create a superuser and run the webserver.

```shell
python manage.py createsuperuser
# Fill in details as required
python manage.py runserver
```

You can then navigate to one of the following urls:

1. Admin Page: http://127.0.0.1:8000/admin/
2. Home Page: http://127.0.0.1:8000/
3. List of Techniques: http://127.0.0.1:8000/
4. Main API Endpoint: http://127.0.0.1:8000/api/

> [!INFO]  
> You can also run `python manage.py show_urls` in the terminal to see a list of all available urls.
