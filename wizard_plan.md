# TEA Techniques Wizard Implementation Plan

## Overview

A multi-phase implementation plan for creating a technique finder wizard that
helps users identify the most appropriate AI assurance techniques for their
needs. The wizard will start as a deterministic decision tree and evolve to
support LLM-powered recommendations.

## Phase 1: MVP Wizard (No Data Collection)

### Stage 1.1: Core Components (Day 1)

#### 1. Create wizard configuration file (`lib/wizard/config.ts`)

- Define entry points (by goal, by model, by technique type)
- Map questions to tag categories
- Configure filtering logic
- Structure:
  ```typescript
  export const wizardConfig = {
    entryPoints: [
      { id: 'by-goal', title: 'I know my assurance goal', ... },
      { id: 'by-model', title: 'I know my model type', ... },
      { id: 'by-technique', title: 'I know the technique type', ... }
    ],
    questions: {
      'assurance-goal': { text: 'What is your primary goal?', ... },
      'model-type': { text: 'What type of model are you using?', ... },
      ...
    },
    flows: {
      'by-goal': ['assurance-goal', 'lifecycle-stage', 'model-type'],
      'by-model': ['model-type', 'assurance-goal', 'lifecycle-stage'],
      ...
    }
  }
  ```

#### 2. Build wizard state machine (`lib/wizard/wizard-machine.ts`)

- Implement state transitions
- Handle multiple entry points
- Track user path through questions
- Support back/forward navigation

### Stage 1.2: Wizard and Question Components (Day 1-2)

#### 1. Create base wizard component (`components/wizard/technique-wizard.tsx`)

- Sheet/modal container using existing sheet.tsx
- Question navigation (next/previous/restart)
- Progress indicator
- Keyboard navigation support

#### 2. Entry point selector (`components/wizard/entry-selector.tsx`)

- Three cards with icons:
  - "I know my goal" → 🎯
  - "I know my model" → 🤖
  - "I know the technique type" → 🔧
- Clear descriptions for each path

#### 3. Dynamic question renderer (`components/wizard/question-renderer.tsx`)

- Renders questions based on current state
- Radio buttons for single-select
- Dynamic options from data (goals, tags, etc.)
- Show count of remaining techniques as user answers

#### 4. Results component (`components/wizard/wizard-results.tsx`)

- Display filtered techniques using existing TechniquesDataTable
- Show reasoning path (which answers led to results)
- Option to restart or refineHold o

### Stage 1.3: Integration (Day 2)

#### 1. Add wizard trigger to homepage

- New button: "Find the Right Technique"
- Position next to "Explore Techniques"
- Icon: compass or wizard hat

#### 2. Create wizard route (`app/wizard/page.tsx`)

- Standalone page option
- Can be accessed directly via URL
- SEO-friendly with proper metadata

#### 3. Connect to existing data layer

- Use `getTechniques()` from lib/data.ts
- Apply filters progressively based on answers
- Optimize filtering for performance

### Stage 1.4: Testing & Polish (Day 3)

#### 1. Test all entry paths

- Verify each entry point works correctly
- Ensure results are accurate
- Test edge cases (no results, single result)

#### 2. Add keyboard navigation

- Enter to proceed
- Escape to close
- Arrow keys for option selection
- Tab navigation

#### 3. Responsive design

- Mobile-friendly question layout
- Touch-optimized buttons
- Swipe gestures for navigation

## Phase 2: Adding User Feedback & Data Collection

### Stage 2.1: Backend Setup (Day 1)

#### 1. Switch from static to hybrid build

- Modify next.config.mjs to remove `output: 'export'`
- Keep static generation for existing pages
- Enable API routes for feedback only

#### 2. Install database dependencies

```bash
pnpm add prisma @prisma/client
pnpm add -D @types/cookie
pnpm add iron-session  # For secure session management
```

#### 3. Initialize Prisma with SQLite

- Development: SQLite for simplicity
- Production: Can migrate to PostgreSQL if needed
- Schema location: `prisma/schema.prisma`

### Stage 2.2: Database Schema (Day 1)

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "sqlite"
  url      = "file:./dev.db"
}

model WizardSession {
  id          String   @id @default(cuid())
  sessionId   String   @unique
  path        Json     // Array of questions/answers
  techniques  String[] // Recommended technique slugs
  createdAt   DateTime @default(now())
  feedback    Feedback?
}

model Feedback {
  id        String        @id @default(cuid())
  sessionId String        @unique
  session   WizardSession @relation(fields: [sessionId], references: [sessionId])
  satisfied Boolean
  createdAt DateTime      @default(now())
}

model Pattern {
  id           String   @id @default(uuid())
  pathHash     String   @unique
  path         Json
  techniques   String[]
  successCount Int      @default(0)
  failureCount Int      @default(0)
  lastUpdated  DateTime @updatedAt
}
```

### Stage 2.3: API Routes (Day 2)

#### 1. Session management (`app/api/wizard/session/route.ts`)

- POST: Create anonymous session
- Use httpOnly cookie for session ID
- Rate limiting: max 10 sessions per IP per hour
- Session expiry: 24 hours

#### 2. Feedback endpoint (`app/api/wizard/feedback/route.ts`)

- POST: Submit satisfaction feedback
- Validate session exists
- Update pattern aggregates
- Prevent duplicate feedback

#### 3. Analytics endpoint (`app/api/wizard/analytics/route.ts`)

- GET: Retrieve aggregated patterns (protected)
- Require API key or admin auth
- No individual session data exposed
- Export options for analysis

### Stage 2.4: Frontend Integration (Day 2-3)

#### 1. Add feedback UI to wizard results

```tsx
<FeedbackSection>
  <p>Were these recommendations helpful?</p>
  <div className="flex gap-2">
    <Button onClick={() => submitFeedback(true)} variant="outline">
      👍 Yes, helpful
    </Button>
    <Button onClick={() => submitFeedback(false)} variant="outline">
      👎 Not quite right
    </Button>
  </div>
</FeedbackSection>
```

#### 2. Session tracking

- Initialize session on wizard open
- Store path as user progresses
- Submit complete path with results
- Handle offline scenarios

#### 3. Privacy notice

- Add small text about anonymous feedback
- Link to privacy policy
- GDPR compliance considerations
- Cookie consent (if required)

### Stage 2.5: Analytics Dashboard (Day 3)

#### 1. Create admin route (`app/admin/wizard-analytics/page.tsx`)

- Password-protected via environment variable
- Show success rates by path
- Identify problematic patterns
- Export data for further analysis

#### 2. Metrics to track

- Most common paths
- Satisfaction rates per path
- Techniques with highest satisfaction
- Drop-off points in wizard
- Average time to complete
- Browser/device statistics

## Phase 3: Handling Updates (High-Level)

### Approach: Data-Driven Updates

#### Automatic Updates (No Code Changes)

- New techniques automatically appear in results
- New tags in existing categories work without changes
- Updated technique descriptions reflected immediately

#### Semi-Automatic Updates (Config Changes)

- New tags in existing categories: Update wizard config
- Reordering questions: Modify flow configuration
- Adjusting filter logic: Update filtering functions

#### Manual Updates (Code Changes)

- New categories require:
  1. Update wizard config to include new category
  2. Add category description to tag-definitions.ts
  3. Add new question type if needed
  4. Rebuild and deploy

### Maintenance Tools

- Script to validate wizard config against actual data
- Automated tests for all possible paths
- Dashboard to monitor which paths need adjustment
- CLI tool to simulate wizard paths

### Version Management

- Track wizard config versions
- A/B testing capability for different flows
- Rollback mechanism for problematic updates

## Phase 4: LLM-Powered Finder (High-Level)

### Architecture

#### 1. RAG Setup

- Embed all techniques using sentence-transformers
- Store embeddings in vector database
  - Development: ChromaDB (local)
  - Production: Pinecone/Weaviate
- Update embeddings when techniques change
- Include technique metadata in embeddings

#### 2. Few-Shot Learning

- Use successful wizard patterns as examples
- Top patterns become prompt examples
- Continuously improve from feedback
- Pattern format:
  ```json
  {
    "query": "explain neural network decisions",
    "path": ["explainability", "neural-network", "local"],
    "techniques": ["shap", "grad-cam"],
    "satisfaction": 0.85
  }
  ```

#### 3. Hybrid Interface

- Add "Ask AI" tab alongside wizard
- Natural language input box
- Show both AI recommendations and option to use wizard
- Confidence scores for recommendations
- Fallback to wizard for low confidence

#### 4. Local LLM Testing

- Use Ollama with multiple models:
  - Llama 3.2 (3B)
  - Phi-3 (3.8B)
  - Mistral (7B)
- Test with collected wizard patterns
- Measure accuracy vs wizard recommendations
- Performance benchmarks

### Implementation Steps

1. **Embedding Pipeline**

   ```typescript
   // Generate embeddings for all techniques
   const embedder = new SentenceTransformer('all-MiniLM-L6-v2');
   const embeddings = techniques.map((t) => ({
     slug: t.slug,
     vector: embedder.encode(formatTechnique(t)),
   }));
   ```

2. **RAG Retrieval**

   ```typescript
   // Retrieve relevant techniques
   const relevant = vectorDB.search(query, (k = 10));
   ```

3. **Prompt Engineering**

   ```typescript
   const prompt = `
   Given these techniques: ${relevant}
   User query: ${query}
   Similar successful patterns: ${examples}

   Recommend techniques (only from the list).
   `;
   ```

### Success Metrics

- Hallucination rate < 5%
- User satisfaction >= wizard satisfaction
- Response time < 2 seconds
- Accuracy vs ground truth > 80%
- Fallback to wizard < 20% of queries

### Testing Protocol

1. Create test set from wizard patterns
2. Run each model against test set
3. Measure precision, recall, F1 score
4. Compare response times
5. Evaluate explanation quality

## Implementation Notes

### Technology Choices

- **State Management**: React hooks + context (simple, sufficient)
- **Animations**: Tailwind transitions + Framer Motion (if needed)
- **Database**:
  - Dev: SQLite (simple, file-based)
  - Prod: PostgreSQL (if scale requires)
- **Sessions**: iron-session (secure, serverless-compatible)
- **Future LLM**:
  - Testing: Ollama (local)
  - Production: Vercel AI SDK with OpenAI/Anthropic

### Performance Considerations

- Lazy load wizard components
- Precompute common filter combinations
- Cache question options
- Optimize technique filtering algorithm
- Use Web Workers for heavy computations

### Accessibility

- ARIA labels for all interactive elements
- Screen reader announcements for state changes
- Keyboard navigation throughout
- High contrast mode support
- Focus management

### File Structure

```
components/
  wizard/
    technique-wizard.tsx      # Main wizard container
    entry-selector.tsx        # Entry point selection
    question-renderer.tsx     # Dynamic question display
    wizard-results.tsx        # Results display
    feedback-section.tsx      # Phase 2: Feedback UI
    wizard-provider.tsx       # Context provider

lib/
  wizard/
    config.ts                 # Wizard configuration
    wizard-machine.ts         # State machine logic
    filters.ts               # Technique filtering
    analytics.ts             # Phase 2: Analytics helpers
    types.ts                 # TypeScript interfaces

app/
  wizard/
    page.tsx                 # Standalone wizard page
  api/                       # Phase 2: API routes
    wizard/
      session/route.ts
      feedback/route.ts
      analytics/route.ts
  admin/                     # Phase 2: Admin pages
    wizard-analytics/
      page.tsx

prisma/                      # Phase 2: Database
  schema.prisma
  migrations/

tests/
  wizard/
    wizard.test.ts           # Unit tests
    paths.test.ts            # Path validation
    filters.test.ts          # Filter logic tests
```

## Timeline

### Phase 1: 3-4 days

- Day 1: Core components and state machine
- Day 2: Question components and integration
- Day 3: Testing and polish
- Day 4: Buffer for issues

### Phase 2: 3-4 days

- Day 1: Backend setup and database
- Day 2: API routes
- Day 3: Frontend integration and analytics

### Phase 3: 1 day

- Maintenance tools and documentation

### Phase 4: 1 week

- Day 1-2: Embedding pipeline
- Day 3-4: RAG implementation
- Day 5: LLM testing
- Day 6-7: Integration and optimization

## Success Criteria

### Phase 1

- All three entry points functional
- Accurate technique filtering
- Smooth user experience
- Mobile responsive

### Phase 2

- Feedback collection working
- No privacy issues
- Analytics providing insights
- Session management secure

### Phase 3

- Updates require minimal effort
- System remains maintainable
- Documentation complete

### Phase 4

- LLM provides accurate recommendations
- No hallucinations
- Fast response times
- Users prefer it to basic search

This plan provides a comprehensive roadmap from a simple wizard to an AI-powered
recommendation system, with clear implementation steps and success metrics for
each phase.
