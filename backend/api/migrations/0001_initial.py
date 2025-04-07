# Generated by Django 5.1.6 on 2025-04-07 11:20

import django.core.validators
import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
    ]

    operations = [
        migrations.CreateModel(
            name='AssuranceGoal',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(max_length=255, unique=True)),
                ('description', models.TextField()),
            ],
            options={
                'verbose_name_plural': 'Assurance Goals',
                'db_table': 'assurance_goal',
            },
        ),
        migrations.CreateModel(
            name='AttributeType',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(max_length=255, unique=True)),
                ('description', models.TextField(blank=True)),
            ],
            options={
                'db_table': 'attribute_type',
            },
        ),
        migrations.CreateModel(
            name='ResourceType',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(max_length=100, unique=True)),
                ('icon', models.CharField(blank=True, max_length=50)),
            ],
            options={
                'db_table': 'resource_type',
            },
        ),
        migrations.CreateModel(
            name='Tag',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(max_length=255, unique=True)),
            ],
            options={
                'db_table': 'tag',
            },
        ),
        migrations.CreateModel(
            name='Category',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(max_length=255)),
                ('description', models.TextField(blank=True)),
                ('assurance_goal', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='api.assurancegoal')),
            ],
            options={
                'verbose_name_plural': 'Categories',
                'db_table': 'category',
                'unique_together': {('name', 'assurance_goal')},
            },
        ),
        migrations.CreateModel(
            name='SubCategory',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(max_length=255)),
                ('description', models.TextField(blank=True)),
                ('category', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='subcategories', to='api.category')),
            ],
            options={
                'verbose_name_plural': 'Subcategories',
                'db_table': 'subcategory',
                'unique_together': {('name', 'category')},
            },
        ),
        migrations.CreateModel(
            name='Technique',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(max_length=255, unique=True)),
                ('description', models.TextField()),
                ('model_dependency', models.CharField(max_length=100)),
                ('complexity_rating', models.PositiveSmallIntegerField(blank=True, null=True, validators=[django.core.validators.MinValueValidator(1), django.core.validators.MaxValueValidator(5)])),
                ('computational_cost_rating', models.PositiveSmallIntegerField(blank=True, null=True, validators=[django.core.validators.MinValueValidator(1), django.core.validators.MaxValueValidator(5)])),
                ('applicable_models', models.JSONField(blank=True, help_text='List of model types this technique is applicable to (for model-specific techniques)', null=True)),
                ('assurance_goals', models.ManyToManyField(related_name='techniques', to='api.assurancegoal')),
                ('categories', models.ManyToManyField(related_name='techniques', to='api.category')),
                ('subcategories', models.ManyToManyField(blank=True, related_name='techniques', to='api.subcategory')),
                ('tags', models.ManyToManyField(blank=True, related_name='techniques', to='api.tag')),
            ],
            options={
                'db_table': 'technique',
            },
        ),
        migrations.CreateModel(
            name='TechniqueExampleUseCase',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('description', models.TextField()),
                ('assurance_goal', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, to='api.assurancegoal')),
                ('technique', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='example_use_cases', to='api.technique')),
            ],
            options={
                'db_table': 'technique_example_use_case',
            },
        ),
        migrations.CreateModel(
            name='TechniqueLimitation',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('description', models.TextField()),
                ('technique', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='limitations', to='api.technique')),
            ],
            options={
                'db_table': 'technique_limitation',
            },
        ),
        migrations.CreateModel(
            name='AttributeValue',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(max_length=255)),
                ('description', models.TextField(blank=True)),
                ('attribute_type', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='values', to='api.attributetype')),
                ('technique', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='attribute_values', to='api.technique')),
            ],
            options={
                'db_table': 'attribute_value',
                'unique_together': {('attribute_type', 'name', 'technique')},
            },
        ),
        migrations.CreateModel(
            name='TechniqueResource',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('title', models.CharField(max_length=255)),
                ('url', models.URLField()),
                ('description', models.TextField(blank=True)),
                ('authors', models.CharField(blank=True, max_length=500, null=True)),
                ('publication_date', models.DateField(blank=True, null=True)),
                ('source_type', models.CharField(blank=True, max_length=100, null=True)),
                ('resource_type', models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, to='api.resourcetype')),
                ('technique', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='resources', to='api.technique')),
            ],
            options={
                'db_table': 'technique_resource',
                'unique_together': {('technique', 'url')},
            },
        ),
    ]
