# Frontend Guide

> [!NOTE] Overview
> The TEA Techniques frontend is built with Next.js 15.2, TypeScript, and Tailwind CSS. It provides an interactive interface for browsing, searching, and managing techniques for trustworthy and ethical AI assurance.

## Architecture

The frontend follows Next.js App Router organization:

```
frontend/
├── src/
│   ├── app/               # Next.js App Router pages
│   ├── components/        # Reusable React components
│   │   ├── common/        # Generic form components
│   │   ├── layout/        # Layout components (header, footer)
│   │   ├── technique/     # Technique-specific components
│   │   └── ui/            # Base UI components
│   ├── lib/               # Utilities and helpers
│   │   ├── api/           # API integration
│   │   ├── context/       # React context providers
│   │   └── hooks/         # Custom React hooks
│   └── styles/            # Global styles
└── public/                # Static assets
```

## Component Structure

### Page Components

Located in `src/app/`, these components define the routes of the application:

- `page.tsx` - Homepage
- `techniques/page.tsx` - Techniques listing page
- `techniques/[id]/page.tsx` - Technique detail page
- `techniques/[id]/edit/page.tsx` - Edit technique page
- `techniques/add/page.tsx` - Add new technique page
- `categories/page.tsx` - Categories browsing page
- `about/page.tsx` - About page

### Layout Components

Located in `src/components/layout/`:

- `Header.tsx` - Top navigation bar
- `Footer.tsx` - Page footer
- `MainLayout.tsx` - Main layout wrapper

### Technique Components

Located in `src/components/technique/`:

- `TechniqueForm.tsx` - Form for creating and editing techniques
- `TechniquesList.tsx` - Grid display of technique cards
- `TechniquesSidebar.tsx` - Filter sidebar for techniques listing
- `AttributeVisualizer.tsx` - Visual representation of technique attributes
- `CategoryTag.tsx` - Display category tags
- `GoalIcon.tsx` - Icons for assurance goals

### UI Components

Located in `src/components/ui/`:

- Base UI components like buttons, cards, inputs, etc.
- Based on shadcn/ui with custom styling
- Follows a consistent design language

## State Management

The application uses a combination of:

1. **React Query** for server state management
2. **React Context** for cross-component state (e.g., dark mode)
3. **React useState/useReducer** for local component state

### API Integration

API calls are handled through custom hooks in `src/lib/api/hooks.ts`:

```typescript
// Example API hook
export function useTechniques(params: TechniquesParams = {}) {
  return useQuery({
    queryKey: ["techniques", params],
    queryFn: () => fetchTechniques(params),
  });
}
```

## Key Features

### Technique Browsing

- Grid view of techniques with filtering
- Sidebar with filters for assurance goals, categories, model dependency, and ratings (i.e. complexity and computational cost)
- Search functionality for finding techniques by name or description
- Pagination for handling large sets of techniques

### Technique Details

- Comprehensive view of a technique's metadata
- Visualisation of attributes and relationships
- Links to related resources
- Examples and limitations sections

### Technique Management

- Form for adding new techniques
- Form for editing existing techniques
- Validation for required fields
- Multi-step process for complex data entry

## Form Management

The application uses a custom `useForm` hook for form state management:

```typescript
const {
  values,
  errors,
  handleChange,
  handleBlur,
  setFieldValue,
  validateForm,
} = useForm<TechniqueFormData>(initialFormData, validators);
```

## API Error Handling

Error handling is centralized using the `useApiError` hook:

```typescript
const { error, handleError } = useApiError();

try {
  // API call
} catch (error) {
  handleError(error);
}
```

## Styling

The application uses Tailwind CSS for styling with a customised theme:

```
tailwind.config.ts      # Tailwind configuration
src/app/globals.css     # Global styles
```

### Theme

- Dark and light mode support
- Responsive design for mobile, tablet, and desktop

## TypeScript Types

Core types are defined in `src/lib/types.ts`:

```typescript
export interface Technique {
  id: number;
  name: string;
  description: string;
  model_dependency: string;
  // ... other properties
}

export interface AssuranceGoal {
  id: number;
  name: string;
  description: string;
}

// ... other interfaces
```

## Testing

Frontend tests are located in the `frontend/tests` directory, using Jest and React Testing Library.

### Running Tests

```bash
# Run all tests
npm run test

# Run tests in watch mode
npm run test:watch
```

## Development Workflow

1. Start the backend server
2. Start the frontend development server:
   ```bash
   npm run dev --turbopack
   ```
3. Access the application at `http://localhost:3000`

## Build Process

```bash
# Build for production
npm run build

# Start production server
npm run start
```

## Performance Considerations

- Images are optimised using Next.js Image component
- Data is cached with React Query
- Components use proper memoization where appropriate
- Pagination for large data sets

## Related Links

- [Testing Guide](TESTING.md) - More details on testing approach
- [API Guide](API-GUIDE.md) - Information on the API endpoints used by the frontend
- [Deployment Guide](DEPLOYMENT.md) - How to deploy the frontend
- [Next.js Documentation](https://nextjs.org/docs)
