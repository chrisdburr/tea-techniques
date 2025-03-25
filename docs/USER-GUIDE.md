# User Guide

> [!NOTE]
> The TEA Techniques application provides a comprehensive database of techniques for evidencing claims about responsible AI design, development, and deployment. This guide will help you navigate the application and make the most of its features.

## Getting Started

<!-- TODO: add screenshots -->

[...]

### Navigation

The main navigation menu provides access to:

- **Home**: landing page with an overview of the application
- **Techniques**: browse and search the technique database
- **Categories**: information about the main categories for the TEA techniques platform
- **About** - information about the application and its purpose

## Using the Platform

[...]

### Filtering Options

The sidebar provides several filtering options:

- **Assurance Goals**: filter by high-level goals like fairness, transparency, etc.
- **Categories**: filter by domain categories within goals
- **Subcategories**: filter by specific subcategories
- **Model Dependency**: filter by model-agnostic or model-specific techniques
- **Complexity**: filter by implementation complexity (1-5 scale)
- **Computational Cost**: filter by computational requirements (1-5 scale)

<!-- TODO: add callout about glossary -->

## Technique Details

The technique detail page provides comprehensive information about a specific technique.

### Basic Information

- **Name** - The full name of the technique
- **Description** - A detailed description of the technique
- **Model Dependency** - Whether the technique is model-agnostic or model-specific
- **Applicable Models** - For model-specific techniques, which model types are supported

### Classification

- **Assurance Goals** - Which high-level goals this technique addresses
- **Categories** - Which categories the technique belongs to
- **Subcategories** - Which subcategories the technique belongs to
- **Tags** - Additional tags for finer classification

### Attributes

Visual representation of technique attributes such as:

- Scope (local vs. global)
- Approach (statistical, model-based, etc.)
- Implementation complexity
- Computational cost

### Resources

Links to external resources including:

- Academic papers
- Code repositories
- Documentation
- Tutorials
- Videos

Each resource includes:

- Title
- URL
- Brief description
- Author information (when available)
- Publication date (when available)

### Example Use Cases

Real-world examples of how the technique can be applied, including:

- Detailed descriptions of use cases
- Which assurance goals they primarily address

### Limitations

Known limitations of the technique, including:

- Technical constraints
- Applicability limitations
- Performance considerations

## Troubleshooting

### Common Issues

> [!WARNING]
>
> - **No Results**: Try removing some filters or broadening your search
> - **Slow Loading**: Check your internet connection or try refreshing the page
> - **Filter Not Working**: Try clearing all filters and applying them again

### Getting Help

> [!IMPORTANT]
> If you encounter issues not covered in this guide:
>
> - Check the [FAQ section](#faq) below
> - Check the [Glossary](GLOSSARY.md) for descriptions of key terms
> - Submit a bug report through the appropriate channels

## FAQ

<!-- TODO: copy this to the main site -->

> [!NOTE]
>
> ### General Questions
>
> **Q: What is the purpose of the TEA Techniques database?**  
> A: It provides a structured repository of techniques for evidencing claims about responsible AI development, helping practitioners identify appropriate methods for specific needs.
>
> **Q: How often is the database updated?**  
> A: The database is regularly updated with new techniques and improvements to existing entries as they become available.
>
> **Q: Can I export data from the database?**  
> A: Currently, data export functionality is not available through the UI. Contact the administrator if you need to export data.
>
> ### Technical Questions
>
> **Q: What does "Model-Agnostic" vs "Model-Specific" mean?**  
> A: Model-Agnostic techniques work with any AI model, while Model-Specific techniques only work with particular types of models (e.g., neural networks, decision trees).
>
> **Q: How are complexity and computational cost determined?**  
> A: These ratings are determined by the community, based on feedback mechanisms that allow them to change over time.
>
> **Q: Why are some techniques missing information?**  
> A: The database is continually being improved. Some techniques may have incomplete information that will be added in future updates.

### Feature Requests

> [!TIP]
> If you have suggestions for new features or improvements, please contact the system administrator or submit your ideas through the appropriate channels.

## Related Links

- [API Guide](API-GUIDE.md) - Information on the API for developers
- [Data Management Guide](DATA-MANAGEMENT.md) - How the database is managed and updated
