# Generated by Django 5.1.6 on 2025-03-02 17:19

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
                'verbose_name_plural': 'Tags',
                'db_table': 'tag',
            },
        ),
        migrations.CreateModel(
            name='Technique',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(max_length=255, unique=True)),
                ('description', models.TextField()),
                ('model_dependency', models.CharField(max_length=255)),
            ],
            options={
                'verbose_name_plural': 'Techniques',
                'db_table': 'technique',
            },
        ),
        migrations.CreateModel(
            name='AttributeType',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(max_length=255, unique=True)),
                ('description', models.TextField()),
                ('applicable_goals', models.ManyToManyField(blank=True, to='api.assurancegoal')),
                ('required_for_goals', models.ManyToManyField(blank=True, related_name='required_attribute_types', to='api.assurancegoal')),
            ],
            options={
                'db_table': 'attribute_type',
            },
        ),
        migrations.CreateModel(
            name='AttributeValue',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(max_length=255)),
                ('description', models.TextField(blank=True)),
                ('attribute_type', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='values', to='api.attributetype')),
            ],
            options={
                'db_table': 'attribute_value',
                'unique_together': {('attribute_type', 'name')},
            },
        ),
        migrations.CreateModel(
            name='Category',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(max_length=255)),
                ('description', models.TextField()),
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
                ('description', models.TextField()),
                ('category', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='api.category')),
            ],
            options={
                'verbose_name_plural': 'Sub-Categories',
                'db_table': 'sub_category',
                'unique_together': {('name', 'category')},
            },
        ),
        migrations.CreateModel(
            name='TechniqueAssuranceGoal',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('assurance_goal', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='api.assurancegoal')),
                ('technique', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='api.technique')),
            ],
            options={
                'verbose_name_plural': 'Technique Assurance Goals',
                'db_table': 'technique_assurance_goal',
                'unique_together': {('technique', 'assurance_goal')},
            },
        ),
        migrations.AddField(
            model_name='technique',
            name='assurance_goals',
            field=models.ManyToManyField(related_name='techniques', through='api.TechniqueAssuranceGoal', to='api.assurancegoal'),
        ),
        migrations.CreateModel(
            name='TechniqueCategory',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('category', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='api.category')),
                ('technique', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='api.technique')),
            ],
            options={
                'verbose_name_plural': 'Technique Categories',
                'db_table': 'technique_category',
                'unique_together': {('technique', 'category')},
            },
        ),
        migrations.AddField(
            model_name='technique',
            name='categories',
            field=models.ManyToManyField(related_name='techniques', through='api.TechniqueCategory', to='api.category'),
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
                'verbose_name_plural': 'Technique Example Use Cases',
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
                'verbose_name_plural': 'Technique Limitations',
                'db_table': 'technique_limitation',
            },
        ),
        migrations.CreateModel(
            name='TechniqueSubCategory',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('subcategory', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='api.subcategory')),
                ('technique', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='api.technique')),
            ],
            options={
                'verbose_name_plural': 'Technique Subcategories',
                'db_table': 'technique_subcategory',
                'unique_together': {('technique', 'subcategory')},
            },
        ),
        migrations.AddField(
            model_name='technique',
            name='subcategories',
            field=models.ManyToManyField(blank=True, related_name='techniques', through='api.TechniqueSubCategory', to='api.subcategory'),
        ),
        migrations.CreateModel(
            name='TechniqueTag',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('tag', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='api.tag')),
                ('technique', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='api.technique')),
            ],
            options={
                'verbose_name_plural': 'Technique Tags',
                'db_table': 'technique_tag',
                'unique_together': {('technique', 'tag')},
            },
        ),
        migrations.AddField(
            model_name='technique',
            name='tags',
            field=models.ManyToManyField(blank=True, through='api.TechniqueTag', to='api.tag'),
        ),
        migrations.CreateModel(
            name='TechniqueAttribute',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('attribute_value', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='api.attributevalue')),
                ('technique', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='attributes', to='api.technique')),
            ],
            options={
                'verbose_name_plural': 'Technique Attributes',
                'db_table': 'technique_attribute',
                'unique_together': {('technique', 'attribute_value')},
            },
        ),
        migrations.CreateModel(
            name='TechniqueRelationship',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('relationship_type', models.CharField(default='similar', max_length=50)),
                ('technique_from', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='related_from', to='api.technique')),
                ('technique_to', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='related_to', to='api.technique')),
            ],
            options={
                'verbose_name_plural': 'Technique Relationships',
                'db_table': 'technique_relationship',
                'unique_together': {('technique_from', 'technique_to', 'relationship_type')},
            },
        ),
        migrations.CreateModel(
            name='TechniqueResource',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('title', models.CharField(max_length=255)),
                ('url', models.URLField()),
                ('description', models.TextField(blank=True)),
                ('resource_type', models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, to='api.resourcetype')),
                ('technique', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='resources', to='api.technique')),
            ],
            options={
                'verbose_name_plural': 'Technique Resources',
                'db_table': 'technique_resource',
                'unique_together': {('technique', 'url')},
            },
        ),
    ]
