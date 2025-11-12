# TEA Techniques

Interactive web app for exploring AI assurance techniques that support argument-based assurance. Fully static Next.js 14 application optimized for GitHub Pages.

## Architecture Overview

### Data System

- **Source:** `/public/data/techniques.json` (ground truth)
- **Generated:** ~280+ JSON files for optimal performance
- **Structure:**
  - 7 Assurance Goals (Explainability, Fairness, Privacy, Reliability, Safety, Security, Transparency)
  - 92 Techniques with detailed metadata
  - 184 Filter combinations across 10 categories (applicable-models, data-type, lifecycle-stage, etc.)

### Tech Stack

- **Next.js 14** with static export
- **TypeScript** (strict mode)
- **Tailwind CSS** + **shadcn/ui** (New York style)
- **next-themes** for dark/light mode
- **Fuse.js** for client-side search
- **XState** for wizard state machine


## Key Implementation Details

### Data Loading

All data loaded statically at build time via `lib/data.ts`:

- `getTechniques()` - All techniques (cached)
- `getTechniqueBySlug(slug)` - Single technique
- `getAssuranceGoals()` - All 7 goals
- `getTags()` - All filter tags

### Navigation

- Conditional layout (different headers for homepage vs internal pages)
- Sidebar navigation using shadcn/ui patterns

### Search

- Client-side Fuse.js with dynamic imports
- Pre-generated search index at build time

### Wizard

- XState-powered interactive technique finder
- Multi-step filtering based on user requirements

## Configuration

### next.config.mjs

- Static export for GitHub Pages
- Image optimization disabled (required for static)
- Trailing slashes enabled
- React strict mode disabled for static generation

### TypeScript

- Strict mode with null checks
- Path alias: `@/*` → project root
- ES2017 target, ESNext modules

### Styling & Linting

- Tailwind CSS with CSS variables for theming
- Biome with "ultracite" configuration

## Development Guidelines

### Key Commands

**Always use `pnpm` over `npm` and Docker Compose for development environment.**

```bash

# Development

docker compose -f docker-compose.development.yml up -d # Start dev server
pnpm type-check # TypeScript checking
pnpm lint # Lint with biome (ultracite config)
pnpm format # Format with biome

# Data Generation

pnpm generate-data # Generate static JSON files
pnpm generate-sitemap # Generate sitemap.xml

# Both run automatically in prebuild

```

**Build Note:** Requires `NODE_ENV=production` for static exports due to Next.js 14 useContext issue.

### General

- Write tests first (TDD)
- Follow existing naming conventions

### Static-First Approach

- Everything pre-computed at build time.
- No runtime data fetching or backend dependencies.

### Component Patterns

- Follow shadcn/ui (New York) patterns in `components/ui/`.
- Use existing components before creating new ones.

### Data Updates

- Modify `/public/data/techniques.json` then run `pnpm generate-data` to regenerate all derived files.

### Testing Changes

- Always verify with `pnpm type-check` and `pnpm lint` before committing.
