# Critical Implementation Prompts for roFl Development

This document contains copy-paste ready prompts for implementing each critical feature. Each prompt is designed for maximum clarity and can be given directly to Claude Code or development teams.

---

## 🚨 PHASE 0: CRITICAL SECURITY FIXES

### Prompt 1: Firebase Security Rules Implementation

```
ROLE: Senior Firebase Security Engineer

CONTEXT: 
The roFl application currently has NO Firebase security rules, leaving the database completely exposed. The app uses Firestore for storing prompts and will soon have user authentication via Firebase Auth.

CRITICAL REQUIREMENTS:
1. Create firestore.rules file in project root
2. Implement user-based access control
3. Ensure users can only read/write their own data
4. Add rate limiting rules where possible
5. Test rules with Firebase emulator

DELIVERABLES:
1. /firestore.rules with comprehensive security rules
2. /storage.rules for future file uploads
3. Update firebase.json to reference rules files
4. Test file /test/security-rules.test.js
5. Documentation of rule logic

IMPLEMENTATION:
Create firestore.rules with:
- Authenticated user check for all operations
- User can only access documents where userId == auth.uid
- Prompts collection: read/write own, no access to others
- Future workspaces collection: role-based access
- Rate limiting: max 100 writes per minute per user
- Validation: required fields, string length limits

SUCCESS CRITERIA:
- Deploy rules: firebase deploy --only firestore:rules
- Run tests: npm run test:rules (all pass)
- Attempt unauthorized access (should fail)
- Verify authorized access works
```

### Prompt 2: Fix TypeScript and Build Errors

```
ROLE: Senior TypeScript/Next.js Developer

CONTEXT:
The roFl Next.js 15 application has critical TypeScript errors preventing production deployment:
- 9 TypeScript compilation errors
- Build fails due to useSearchParams without Suspense
- Missing imports in prompts/page.tsx
- Type mismatches in PromptForm

ERRORS TO FIX:
1. src/app/prompts/page.tsx:131-133 - Missing CardHeader, CardTitle imports
2. src/components/PromptForm.tsx:133 - Type mismatch in handleSubmit
3. src/components/PromptForm.tsx:194 - Unknown 'topic' property
4. src/components/PromptOptimizerDialog.tsx:78 - useEffect expects 0-1 arguments
5. src/components/ui/sidebar.tsx:8 - Missing use-mobile hook
6. src/app/prompts/new/page.tsx - useSearchParams needs Suspense boundary

DELIVERABLES:
1. All TypeScript errors resolved
2. Successful npm run typecheck (0 errors)
3. Successful npm run build
4. Remove ignoreBuildErrors from next.config.ts
5. Proper Suspense boundaries added

SUCCESS CRITERIA:
- npm run typecheck: ✅ 0 errors
- npm run build: ✅ Builds successfully
- npm run dev: ✅ No runtime errors
- All pages load without hydration errors
```

### Prompt 3: Implement Firebase Authentication

```
ROLE: Full-Stack Authentication Specialist

CONTEXT:
roFl currently has NO authentication. We need Firebase Auth with email/password and Google Sign-In, protecting all routes and data.

TECHNICAL STACK:
- Next.js 15 with App Router
- Firebase Auth SDK
- React Context for auth state
- Middleware for route protection

DELIVERABLES:

1. /src/contexts/AuthContext.tsx
   - Auth provider with user state
   - Login, logout, signup functions
   - Current user tracking
   - Loading states

2. /src/app/(auth)/login/page.tsx
   - Email/password login form
   - Google Sign-In button
   - Link to signup
   - Error handling with toasts

3. /src/app/(auth)/signup/page.tsx
   - Registration form with validation
   - Password strength requirements
   - Terms acceptance checkbox
   - Auto-login after signup

4. /src/middleware.ts
   - Protect all routes except /login, /signup
   - Redirect unauthenticated users
   - Pass user context to protected pages

5. /src/lib/auth-helpers.ts
   - getUserFromToken()
   - refreshToken()
   - validateSession()

6. Update all Firestore operations
   - Add userId field to all documents
   - Filter queries by current user
   - Update types to include userId

SECURITY REQUIREMENTS:
- Passwords: min 8 chars, 1 uppercase, 1 number
- Session timeout: 24 hours
- Secure cookie storage
- CSRF protection
- Rate limit auth attempts

SUCCESS CRITERIA:
- User can sign up and see welcome message
- User can log in and access their data only
- Unauthenticated users redirected to login
- User data persists across sessions
- Logout clears all user data
```

### Prompt 4: Implement Rate Limiting

```
ROLE: Backend Security Engineer

CONTEXT:
The roFl AI endpoints (Genkit flows) have no rate limiting, making them vulnerable to abuse and cost overruns.

REQUIREMENTS:
Implement rate limiting for:
1. AI chat interactions: 100 requests/hour
2. Prompt optimization: 50 requests/hour
3. Batch processing: 10 requests/hour
4. Firestore writes: 100 writes/minute

DELIVERABLES:

1. /src/lib/rate-limiter.ts
   - Token bucket algorithm
   - Redis or in-memory store
   - Per-user limits
   - IP-based fallback

2. /src/middleware/rate-limit.ts
   - Express/Next.js middleware
   - Custom limits per endpoint
   - Graceful error responses
   - Headers with limit info

3. Update all AI flows:
   - src/ai/flows/conversational-chat-flow.ts
   - src/ai/flows/optimize-prompt.ts
   - src/ai/flows/process-unstructured-prompts.ts
   - Add rate limit checks

4. Client-side handling:
   - Show remaining requests
   - Countdown timer when limited
   - Queue requests when possible

IMPLEMENTATION:
```typescript
// Example rate limiter
class RateLimiter {
  constructor(
    private maxRequests: number,
    private windowMs: number
  ) {}
  
  async checkLimit(userId: string): Promise<boolean> {
    // Implementation
  }
}
```

SUCCESS CRITERIA:
- Endpoints reject after limit reached
- Clear error messages to users
- Limits reset after time window
- Different limits per endpoint
- Admin bypass capability
```

---

## 🏗️ PHASE 1: MVP COMPLETION

### Prompt 5: Fix State Synchronization with React Query

```
ROLE: React State Management Expert

CONTEXT:
The roFl app has broken state synchronization. Changes made in /chat don't reflect in /prompts without a full page refresh. We need proper state management with React Query.

CURRENT ISSUES:
- No cache invalidation after mutations
- No optimistic updates
- No real-time sync between pages
- Stale data after saves

DELIVERABLES:

1. /src/lib/queries/prompt-queries.ts
```typescript
// All prompt-related queries and mutations
export const usePrompts = () => useQuery({
  queryKey: ['prompts'],
  queryFn: fetchPrompts,
  staleTime: 30000,
});

export const useCreatePrompt = () => useMutation({
  mutationFn: createPrompt,
  onSuccess: () => {
    queryClient.invalidateQueries(['prompts']);
  },
  // Optimistic update
  onMutate: async (newPrompt) => {
    await queryClient.cancelQueries(['prompts']);
    const previousPrompts = queryClient.getQueryData(['prompts']);
    queryClient.setQueryData(['prompts'], old => [...old, newPrompt]);
    return { previousPrompts };
  },
});
```

2. /src/hooks/use-realtime-prompts.ts
   - Firestore listener integration
   - Auto-update React Query cache
   - Cleanup on unmount

3. Update all components:
   - /src/app/chat/page.tsx
   - /src/app/prompts/page.tsx
   - /src/components/PromptForm.tsx
   - Use new hooks consistently

4. /src/lib/stores/ui-store.ts (Zustand)
   - Global UI state (modals, toasts)
   - Pending operations queue
   - Error recovery state

SUCCESS CRITERIA:
- Save prompt in chat → immediately visible in library
- Edit prompt → updates everywhere instantly
- Delete prompt → removes from all views
- Network failure → optimistic updates rollback
- Loading states during all operations
```

### Prompt 6: Complete Global Navigation

```
ROLE: Frontend UI/UX Developer

CONTEXT:
roFl lacks proper navigation between its main sections. Users must manually type URLs. We need a polished, intuitive navigation system.

DESIGN REQUIREMENTS:
- Asymmetric/frameless aesthetic (left-aligned)
- Mobile responsive
- Active state indicators
- Smooth transitions
- Keyboard navigation support

DELIVERABLES:

1. /src/components/Navigation/Sidebar.tsx
```typescript
// Persistent sidebar with:
- roFl logo/brand
- Main nav items (Chat, Library, Import, Settings)
- User profile section
- Logout button
- Collapsible on mobile
```

2. /src/components/Navigation/MobileNav.tsx
   - Bottom tab bar for mobile
   - Gesture support
   - Active state animations

3. /src/components/Navigation/CommandPalette.tsx
   - Cmd+K quick navigation
   - Search all prompts
   - Recent items
   - Quick actions

4. Update /src/app/layout.tsx
   - Integrate navigation components
   - Manage navigation state
   - Handle route changes

5. /src/styles/navigation.module.css
   - Custom animations
   - Hover effects
   - Focus states

SUCCESS CRITERIA:
- Click navigation works on all devices
- Current page clearly indicated
- Keyboard navigation (Tab, arrows)
- Mobile menu smooth and responsive
- No layout shift on navigation
```

---

## 🚀 PHASE 2: PRODUCTION FEATURES

### Prompt 7: Unified Knowledge Schema

```
ROLE: Data Architecture Specialist

CONTEXT:
roFl needs to evolve from just "prompts" to handle multiple content types: prompts, notes, ideas, actions, mind maps. We need a unified data model.

REQUIREMENTS:
- Backward compatible with existing prompts
- Support for relationships between items
- Version history capability
- Efficient querying

DELIVERABLES:

1. /src/lib/types/knowledge.ts
```typescript
export interface KnowledgeAsset {
  id: string;
  type: 'prompt' | 'note' | 'idea' | 'action' | 'mindmap';
  title: string;
  content: string;
  metadata: {
    source?: 'chat' | 'import' | 'manual';
    format?: 'text' | 'markdown' | 'json';
    originalContext?: string;
    connections?: string[]; // Related asset IDs
    tags?: string[];
    category?: string;
  };
  userId: string;
  workspaceId?: string;
  version: {
    current: number;
    history?: VersionEntry[];
  };
  permissions: {
    owner: string;
    editors?: string[];
    viewers?: string[];
    public?: boolean;
  };
  stats: {
    views: number;
    copies: number;
    rating?: number;
  };
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

2. /src/lib/migrations/prompts-to-knowledge.ts
   - Migration script for existing data
   - Rollback capability
   - Progress tracking

3. /src/lib/services/knowledge-service.ts
   - CRUD operations
   - Search and filter
   - Relationship management
   - Version control

4. Update all UI components
   - Generic asset cards
   - Type-specific renderers
   - Unified forms

SUCCESS CRITERIA:
- Existing prompts migrated successfully
- Can create all asset types
- Relationships visible in UI
- Search works across all types
- No performance degradation
```

### Prompt 8: Import System for Apple Notes & Chats

```
ROLE: Data Import/Export Engineer

CONTEXT:
Users need to import existing content from Apple Notes exports and AI chat logs. Build a robust import system with parsing and organization.

SUPPORTED FORMATS:
- Apple Notes: HTML export (.html files in .zip)
- ChatGPT: JSON export
- Claude: Plain text or JSON
- Generic: .txt, .md files

DELIVERABLES:

1. /src/app/import/page.tsx
```typescript
// Import wizard UI with:
- Drag & drop zone
- File type detection
- Preview of parsed content
- Bulk editing before save
- Progress indicator
```

2. /src/lib/parsers/apple-notes-parser.ts
   - Extract title, content, creation date
   - Handle attachments
   - Preserve formatting
   - Batch processing

3. /src/lib/parsers/chat-parser.ts
   - Identify conversation structure
   - Extract prompts and responses
   - Detect code blocks
   - Sentiment analysis

4. /src/ai/flows/analyze-import-flow.ts
   - AI categorization
   - Auto-tagging
   - Quality scoring
   - Duplicate detection

5. /src/components/ImportPreview.tsx
   - Table view of parsed items
   - Inline editing
   - Bulk actions
   - Validation errors

PARSING LOGIC:
```typescript
interface ParseResult {
  success: boolean;
  items: KnowledgeAsset[];
  errors: ParseError[];
  statistics: {
    total: number;
    parsed: number;
    failed: number;
    duplicates: number;
  };
}
```

SUCCESS CRITERIA:
- Import 100+ Apple Notes without errors
- Parse ChatGPT export maintaining context
- Show preview before saving
- Handle malformed files gracefully
- Complete import in < 30 seconds for 1000 items
```

---

## 🧠 PHASE 3: INTELLIGENT FEATURES

### Prompt 9: AI-Powered Mind Map Generator

```
ROLE: Visualization & AI Engineer

CONTEXT:
Users want to visualize connections between their knowledge assets. Build an AI-powered mind map generator using React Flow.

REQUIREMENTS:
- Generate maps from any content
- Interactive editing
- Auto-layout algorithms
- Real-time collaboration ready
- Export capabilities

DELIVERABLES:

1. /src/components/MindMap/MindMapCanvas.tsx
```typescript
// React Flow implementation
import ReactFlow from 'reactflow';

export function MindMapCanvas({ 
  nodes, 
  edges, 
  onNodesChange,
  onEdgesChange 
}) {
  // Custom node types
  // Zoom controls
  // Mini map
  // Export functionality
}
```

2. /src/ai/flows/generate-mindmap-flow.ts
```typescript
// AI generates map structure
const generateMindMap = ai.defineFlow({
  inputSchema: z.object({
    content: z.string(),
    assets: z.array(KnowledgeAssetSchema).optional(),
    style: z.enum(['hierarchical', 'radial', 'force']),
  }),
  outputSchema: MindMapSchema,
  // Logic to analyze content and create nodes/edges
});
```

3. /src/components/MindMap/NodeTypes/
   - PromptNode.tsx
   - IdeaNode.tsx
   - ActionNode.tsx
   - Custom styling per type

4. /src/lib/layouts/auto-layout.ts
   - Dagre algorithm integration
   - Force-directed layout
   - Manual adjustment saving

5. /src/components/MindMap/MindMapToolbar.tsx
   - Add nodes
   - Change layouts
   - Export (PNG, SVG, JSON)
   - Share functionality

SUCCESS CRITERIA:
- Generate map from 50+ items in < 5 seconds
- Smooth interaction with 100+ nodes
- Auto-layout looks professional
- Can manually edit and save changes
- Exports are high quality
```

### Prompt 10: Semantic Search with Vector Embeddings

```
ROLE: ML/Search Engineer

CONTEXT:
Implement semantic search using vector embeddings so users can find content by meaning, not just keywords.

TECH STACK:
- OpenAI/Gemini for embeddings
- Pinecone/Weaviate for vector storage
- Next.js API routes
- React Query for caching

DELIVERABLES:

1. /src/lib/embeddings/embedding-service.ts
```typescript
class EmbeddingService {
  async generateEmbedding(text: string): Promise<number[]> {
    // Call OpenAI/Gemini API
    // Cache results
    // Handle rate limits
  }
  
  async bulkGenerate(items: string[]): Promise<number[][]> {
    // Batch processing
    // Progress callbacks
  }
}
```

2. /src/lib/vector-store/pinecone-client.ts
   - Initialize Pinecone
   - Upsert embeddings
   - Query similar vectors
   - Metadata filtering

3. /src/api/search/semantic/route.ts
   - API endpoint for search
   - Combine vector + keyword search
   - Ranking algorithm
   - Response caching

4. /src/components/Search/SemanticSearch.tsx
   - Search input with AI toggle
   - Results with similarity scores
   - Filter by type/date/tags
   - Search history

5. /src/workers/embedding-worker.ts
   - Background job for new content
   - Batch processing queue
   - Error recovery
   - Progress tracking

IMPLEMENTATION FLOW:
1. User creates content → Generate embedding
2. Store in Pinecone with metadata
3. Search query → Generate query embedding
4. Find similar vectors → Return results
5. Combine with keyword matches → Rank

SUCCESS CRITERIA:
- Search returns relevant results for concepts
- < 500ms search response time
- Handles 10k+ documents
- Accuracy > 85% for test queries
- Works offline with cache
```

---

## 🎯 PHASE 4: MARKETPLACE & TESTING

### Prompt 11: Prompt Marketplace

```
ROLE: Full-Stack Marketplace Developer

CONTEXT:
Build a community marketplace where users can publish, discover, and fork high-quality prompts.

FEATURES:
- Publishing workflow
- Discovery/browse
- Social features (likes, saves)
- Forking mechanism
- Quality control

DELIVERABLES:

1. /src/app/marketplace/page.tsx
   - Browse interface
   - Category filters
   - Trending/new/top
   - Search functionality

2. /src/lib/marketplace/publishing-service.ts
```typescript
interface PublishedPrompt extends KnowledgeAsset {
  marketplace: {
    published: boolean;
    publishedAt: Timestamp;
    price: number; // 0 for free
    license: 'MIT' | 'CC-BY' | 'proprietary';
    stats: {
      views: number;
      forks: number;
      likes: number;
      rating: number;
    };
    reviews: Review[];
  };
}
```

3. /src/components/Marketplace/PromptCard.tsx
   - Preview with truncation
   - Author info
   - Stats display
   - Quick actions (like, fork, save)

4. /src/components/Publishing/PublishModal.tsx
   - Title/description
   - Category selection
   - License choice
   - Preview before publish

5. /src/lib/marketplace/moderation.ts
   - Content filtering
   - Quality scoring
   - Spam detection
   - Report handling

SUCCESS CRITERIA:
- Publish prompt in < 3 clicks
- Browse 1000+ prompts smoothly
- Fork adds to personal library
- Social features work real-time
- No inappropriate content
```

### Prompt 12: A/B Testing Module

```
ROLE: Testing & Analytics Engineer

CONTEXT:
Users want to compare prompt variations. Build an A/B testing module for prompts.

REQUIREMENTS:
- Side-by-side comparison
- Statistical significance
- Multiple test inputs
- Result visualization
- Test history

DELIVERABLES:

1. /src/app/testing/page.tsx
```typescript
// Test configuration UI
- Two prompt input areas
- Test parameters (model, temperature)
- Input dataset upload
- Run test button
- Results dashboard
```

2. /src/lib/testing/test-runner.ts
```typescript
interface TestConfiguration {
  id: string;
  variants: {
    A: { prompt: string; params: ModelParams };
    B: { prompt: string; params: ModelParams };
  };
  inputs: TestInput[];
  evaluationCriteria: string[];
  iterations: number;
}

class TestRunner {
  async runTest(config: TestConfiguration): Promise<TestResults> {
    // Run both variants
    // Collect metrics
    // Calculate statistics
    // Return results
  }
}
```

3. /src/components/Testing/ResultsChart.tsx
   - Bar charts for metrics
   - Statistical significance
   - Response time comparison
   - Cost analysis

4. /src/ai/flows/evaluate-responses-flow.ts
   - AI judges response quality
   - Scoring based on criteria
   - Explanation of differences

5. /src/lib/testing/statistics.ts
   - T-test implementation
   - Confidence intervals
   - Effect size calculation
   - Sample size recommendation

SUCCESS CRITERIA:
- Run test with 10 inputs in < 1 minute
- Clear winner indication
- Detailed metrics per input
- Export results to CSV
- Save test for future reference
```

---

## 🛠️ UTILITY PROMPTS

### Prompt 13: Comprehensive Testing Suite

```
ROLE: QA Automation Engineer

CONTEXT:
roFl has 0% test coverage. Implement comprehensive testing.

DELIVERABLES:
1. Jest/Vitest configuration
2. Unit tests for all utilities
3. Integration tests for Firebase
4. E2E tests for critical paths
5. CI/CD pipeline integration

TEST COVERAGE TARGETS:
- Utilities: 100%
- Components: 80%
- API routes: 90%
- AI flows: 70%
- Overall: 85%
```

### Prompt 14: Performance Optimization

```
ROLE: Performance Engineer

CONTEXT:
Optimize roFl for speed and efficiency.

DELIVERABLES:
1. Code splitting implementation
2. Image optimization
3. Database query optimization
4. Caching strategy
5. Bundle size reduction

SUCCESS METRICS:
- Lighthouse score > 90
- First paint < 1s
- TTI < 3s
- Bundle size < 500KB
```

### Prompt 15: Monitoring & Analytics

```
ROLE: DevOps Engineer

CONTEXT:
Implement monitoring and analytics for roFl.

DELIVERABLES:
1. Sentry error tracking
2. Google Analytics
3. Custom event tracking
4. Performance monitoring
5. User behavior analytics

SUCCESS CRITERIA:
- All errors tracked
- User journey visible
- Performance metrics available
- Alerts configured
```

---

## Implementation Priority Matrix

| Priority | Urgency | Feature | Estimated Time |
|----------|---------|---------|---------------|
| P0 | CRITICAL | Security fixes | 3 days |
| P0 | CRITICAL | Authentication | 2 days |
| P1 | HIGH | State management | 2 days |
| P1 | HIGH | Navigation | 1 day |
| P2 | MEDIUM | Import system | 3 days |
| P2 | MEDIUM | Unified schema | 2 days |
| P3 | LOW | Mind maps | 4 days |
| P3 | LOW | Semantic search | 3 days |
| P4 | FUTURE | Marketplace | 5 days |
| P4 | FUTURE | A/B testing | 3 days |

---

## Notes for Developers

1. **Always fix security first** - No features until Phase 0 complete
2. **Test as you go** - Don't accumulate technical debt
3. **Document everything** - Future developers will thank you
4. **User feedback loops** - Show progress early and often
5. **Performance budgets** - Set limits and stick to them

Each prompt can be copied and pasted directly into Claude Code or given to developers. They are self-contained with all necessary context and success criteria.