# TEA Techniques

![An illustration showing different techniques for assurance](https://alan-turing-institute.github.io/turing-commons/assets/images/illustrations/trust-yellow.png)

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)

An interactive database for exploring techniques for evidencing claims about
responsible AI design, development, and deployment. This repository has been
designed to work in conjunction with the
[Trustworthy and Ethical Assurance (TEA) platform](https://assuranceplatform.azurewebsites.net/)
as a core plugin to enable practitioners to identify and implement appropriate
assurance methods.

## ✨ Features

- **92 Comprehensive Techniques**: Detailed catalogue of responsible AI
  techniques
- **6 Assurance Goals**: Organised by explainability, fairness, privacy,
  reliability, safety, and transparency
- **Tag Filtering**: Filter by tags, such as `#expertise-level`,
  `#lifecycle-stage`, `#applicable-models`, and more
- **Static Site Generation**: Fast deployment via GitHub Pages
- **API-like Data Access**: JSON endpoints for programmatic access

## 🌐 View Site

Visit the site at:
[https://alan-turing-institute.github.io/tea-techniques](https://alan-turing-institute.github.io/tea-techniques)

## 🚀 Quickstart and Use

### Development Setup

We provide multiple ways to set up the development environment:

#### Option 1: Using Docker (Recommended for Quick Start)

This is the fastest way to get started with a consistent development
environment:

```bash
# Clone the repository
git clone https://github.com/alan-turing-institute/tea-techniques.git
cd tea-techniques

# Start the development environment
docker-compose -f docker-compose.development.yml up

# The application will be available at http://localhost:3000
```

The Docker setup includes:

- Node.js 24 Alpine Linux environment
- Automatic dependency installation
- Hot reloading for development
- Volume mounts for live code updates

To stop the development server:

```bash
docker-compose -f docker-compose.development.yml down
```

#### Option 2: Local Development

If you prefer to run the project locally:

**Prerequisites:**

- Node.js 24+
- pnpm 10.13.1+ (install via `corepack enable`)

```bash
# Clone the repository
git clone https://github.com/alan-turing-institute/tea-techniques.git
cd tea-techniques

# Install dependencies
pnpm install

# Start the development server
pnpm dev

# The application will be available at http://localhost:3000
```

**Other useful commands:**

```bash
# Type checking
pnpm type-check

# Linting
pnpm lint

# Format code
pnpm format

# Serve production build locally
pnpm serve
```

## 📁 Project Structure

```
tea-techniques/
├── app/                  # Next.js App Router pages
├── components/           # React components
│   ├── ui/               # shadcn/ui components
│   ├── layout/           # Layout components
│   └── technique/        # Technique-specific components
├── lib/                  # Utility functions and types
├── public/
│   └── data/             # Static JSON data files
├── scripts/              # Build and validation scripts
└── docs/                 # Project documentation
```

## 🤝 Contributing

We welcome contributions from the community!

For detailed contribution guidelines, see our
[Community Contributions](https://alan-turing-institute.github.io/tea-techniques/docs/community-contributions)
page.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file
for details.
