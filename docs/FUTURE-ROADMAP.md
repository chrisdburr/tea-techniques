# Future Roadmap

> [!NOTE] Overview
> This document outlines the planned improvements and future direction for the TEA Techniques project. It serves as a guide for contributors and users to understand where the project is headed.

## Short-term Goals (0-3 months)

### Data Enrichment

- **Expand technique database**: expand techniques database to ensure greater coverage for goals beyond explainability and fairness
- **Improve existing entries**: enhance descriptions, add more resources, and refine categorisations
- **Hierarchical tags**: support for nested tagging system
- **Add technique relationships**: implement relationships between complementary or alternative techniques

### User Experience

- **Advanced filtering**: add filtering by additional attributes
- **Responsive optimisations**: improve mobile and tablet experiences
- **Accessibility**: ensure technique detail pages are accessible

### Community Features

- **Authorisation for CRUD Operations**: allow invited users to update the techniques via the frontend
- **Techniques Feedback**: provide targeted options for community to rate techniques (e.g. upvoting popular resources or techniques)
- **API documentation improvements**: Enhance Swagger documentation with more examples for developers
- **Frontend component library**: Create a storybook documentation for UI components
- **Dev container support**: Add devcontainer configuration for VSCode

## Medium-term Goals (3-6 months)

### Feature Additions

- **User accounts**: implement open user registration and authentication
- **Wiki Functionality**: flagging issues, errors, or omissions with techniques
- **Favorites system**: allow users to bookmark favorite techniques
- **Comment system**: enable discussions on techniques
- **Contribution workflow**: allow authenticated users to suggest new techniques or edits
- **Technique comparison**: side-by-side comparison of multiple techniques
- **Export functionality**: allow exporting technique details as PDF or CSV

### Development Improvements

- **API optimisation**: query optimization and endpoint consolidation
- **Frontend bundle optimisation**: code splitting and lazy loading of components
- **CI/CD pipeline**: comprehensive testing and deployment pipeline

### TEA Platform Integration

- **Public API tokens**: support for API keys for external integrations
- **TEA Platform Integration**: support TEA platform extension via API
- **Webhook support**: notify external systems on data updates
- **Embeddable widgets**: create embeddable technique cards for other websites
- **OpenAPI specification**: complete OpenAPI 3.0 specification for the API

## Long-term Goals (6+ months)

### Major Features

- **Technique evaluation framework**: add capability to evaluate and compare techniques based on standard metrics
- **Decision support system**: guide users to appropriate techniques based on their specific needs
- **Implementation guides**: step-by-step guides for using or implementing each technique
- **i18n support**: translate content to multiple languages
- **Interactive demonstrations**: In-browser demos or videos of selected techniques
- **Community-driven content**: allow greater community contributions (e.g. case studies) with moderation workflow
- **LLM integration**: Use TEA search (with LLM functionality) for technique explanation, practical guidance, and resource recommendation

### Architecture Evolution

[...]

## Data Model Improvements

### Taxonomy Enhancements

- **Folksonomy**: user-generated tagging to supplement official taxonomy
- **Cross-references**: better mapping between related techniques
- **Standard compatibility**: map techniques to relevant standards and regulations (integrate with AI Standards Hub)

### New Data Entities

- **Use Case library**: expand into a library of AI assurance use cases (via TEA Platform)
- **Organisation profiles**: information about organizations using specific techniques (via TEA Platform)
- **Practitioner guides**: role-specific guidance for different stakeholders (via BridgeAI)
- **Regulatory mapping**: connection between techniques and regulatory requirements (w/ DSIT)

### Visualisation Enhancements

- **Technique relationship graphs**: visual representation of related techniques (e.g. Obsidian Graph View)
- **Taxonomy explorer**: interactive visualisation of the technique taxonomy

## Research Integration

- **Citations**: BibTex citations for resources
- **Case study repository**: Citable repository of technique case studies (independent of TEA platform)

## Getting Involved

We welcome contributions to help achieve these roadmap items! See the [Contributing Guide](CONTRIBUTING.md) for information on how to get involved.

## Related Links

- [Contributing Guide](CONTRIBUTING.md)
- [Development Workflow](DEVELOPMENT-WORKFLOW.md)
- [Deployment Guide](DEPLOYMENT.md)
