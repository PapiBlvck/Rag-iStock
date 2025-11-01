<!-- cc08825a-5d71-409a-8498-505df2f7a065 4f35dd36-f072-4779-9eed-ba396670cb37 -->
# iStock Frontend Development Plan

## Phase 1: Monorepo Setup & Foundation

### 1.1 Initialize Monorepo Structure

- Create directory structure per TDD: `apps/web`, `packages/shared`, `functions/`, `docs/`
- Set up root `package.json` with pnpm workspace configuration
- Create `pnpm-workspace.yaml` for monorepo management
- Add root-level configuration files (`.gitignore`, `.editorconfig`, etc.)

### 1.2 Setup packages/shared

- Create `packages/shared/package.json` with Zod as dependency
- Implement Zod schemas:
- `FeedIngredientSchema` (name, unitPrice, nutritionalValues)
- `RagResponseSchema` (text, sources array, confidence)
- `FeedRationSchema` (cost, rations array)
- `HealthRecordSchema`
- Auth schemas (email, password, role)
- Export all schemas and TypeScript types from index

### 1.3 Setup apps/web - Base Configuration

- Initialize React 18 + Vite project in `apps/web`
- Configure `vite.config.ts` with React plugin and path aliases
- Set up TypeScript with strict mode in `tsconfig.json`
- Configure Tailwind CSS with Inter font
- Install and configure shadcn/ui with Tailwind
- Set up Tailwind config with Inter font family

## Phase 2: Core Dependencies & Infrastructure

### 2.1 Install Required Dependencies

- React 18, React DOM
- Vite and plugins
- Tailwind CSS, PostCSS, Autoprefixer
- shadcn/ui base dependencies (Radix UI primitives)
- tRPC client (@trpc/client, @trpc/react-query)
- TanStack Query (@tanstack/react-query)
- React Hook Form (@hookform/resolvers, react-hook-form)
- Zod (from workspace)
- React Router (for navigation - using simple if/else as specified)

### 2.2 Configure tRPC Client

- Create `apps/web/src/lib/trpc.ts` with tRPC client setup
- Create mock tRPC procedures:
- `health.askRag` mutation (returns mock RagResponse)
- `nutrition.optimizeFeed` mutation (returns mock FeedRation)
- Mock delay/simulation for realistic API behavior
- Set up TanStack Query provider integration
- Create typed hooks (`useTRPC`, `useMutation` wrappers)

### 2.3 Setup shadcn/ui Components

- Initialize shadcn/ui config (`components.json`)
- Install core components needed:
- Card, Input, Textarea, Button
- Table, Sheet/Sidebar (for mobile nav)
- Select/Combobox components
- Form components (Label, Form wrapper)

## Phase 3: Authentication System

### 3.1 Auth Context & State Management

- Create `apps/web/src/contexts/AuthContext.tsx`:
- useState/useEffect for auth state
- localStorage persistence (user, role, auth status)
- Login/logout functions
- Mock authentication logic (simulates successful login)
- Create `apps/web/src/hooks/useAuth.ts` hook wrapper

### 3.2 Auth UI Components

- Create `apps/web/src/components/auth/SignIn.tsx`:
- shadcn/ui Card layout
- React Hook Form + Zod validation
- Email and password inputs
- Form submission handler
- Create `apps/web/src/components/auth/SignUp.tsx` (similar structure)
- Create shared auth form validation schemas

### 3.3 Protected Route Logic

- Create `apps/web/src/components/auth/ProtectedRoute.tsx` wrapper
- Implement route gating logic (redirect to sign-in if not authenticated)

## Phase 4: Main Application Layout

### 4.1 Root Layout Component

- Create `apps/web/src/components/layout/AppLayout.tsx`:
- Responsive sidebar/navigation using shadcn/ui Sheet for mobile
- Desktop sidebar with navigation links
- Mobile hamburger menu (Sheet component)
- Header with user info and logout

### 4.2 Navigation System

- Implement client-side routing (simple if/else/switch in App.tsx)
- Route states: 'chatbot' | 'feed-optimizer'
- Navigation component with active state indicators
- Mobile-responsive navigation drawer

## Phase 5: Health Chatbot Feature

### 5.1 Chatbot UI Components

- Create `apps/web/src/components/chatbot/ChatInterface.tsx`:
- Chat message list container
- Message bubble components (user query vs AI response)
- Loading state indicators
- Scrollable message history
- Create `apps/web/src/components/chatbot/MessageBubble.tsx`:
- User message styling (right-aligned)
- AI response styling (left-aligned)
- Source citations display (footnotes or "Sources Used" block)
- Confidence score display

### 5.2 Chatbot Logic

- Create `apps/web/src/pages/Chatbot.tsx`:
- useState for chat history array
- React Hook Form for query input (Textarea)
- tRPC mutation hook integration (`health.askRag`)
- Form submission handler
- Error handling and display
- Integrate TanStack Query mutation for API calls
- Format and display RagResponse with sources and confidence

## Phase 6: Feed Optimizer Feature

### 6.1 Feed Optimizer Form

- Create `apps/web/src/components/feed/TargetAnimalSelect.tsx`:
- Radio/Select component for animal type
- Options: 'Dairy Cattle', 'Beef Cattle', 'Calf'
- Create `apps/web/src/components/feed/IngredientForm.tsx`:
- Individual ingredient input fields
- Name, unitPrice (number input)
- Nutritional values (simplified: Protein %, Energy Mcal/kg inputs)
- Create `apps/web/src/components/feed/IngredientList.tsx`:
- Dynamic ingredient list using React Hook Form's `useFieldArray`
- Add/remove ingredient buttons
- Validation per ingredient entry

### 6.2 Feed Optimizer Logic

- Create `apps/web/src/pages/FeedOptimizer.tsx`:
- React Hook Form setup with Zod schema validation
- Form with targetAnimal and ingredients array
- Integration with tRPC mutation (`nutrition.optimizeFeed`)
- Form submission and error handling

### 6.3 Results Display

- Create `apps/web/src/components/feed/FeedResults.tsx`:
- shadcn/ui Table component
- Display FeedRation.rations array (ingredient percentages)
- Prominent total cost display
- Clean, professional table styling

## Phase 7: Main App Entry & Routing

### 7.1 App.tsx Main Component

- Create `apps/web/src/App.tsx`:
- Simple if/else routing logic (no external router)
- Route states: 'sign-in' | 'sign-up' | 'chatbot' | 'feed-optimizer'
- Auth check and routing decision
- Conditional rendering of components

### 7.2 Main Entry Point

- Create/update `apps/web/src/main.tsx`:
- React 18 createRoot setup
- TanStack Query QueryClient and Provider
- tRPC Provider wrapper
- AuthContext Provider
- App component mounting

### 7.3 Global Styles

- Create `apps/web/src/index.css`:
- Tailwind directives
- Inter font import
- Global base styles
- Custom CSS variables for theming (shadcn/ui)

## Phase 8: Styling & Responsiveness

### 8.1 Mobile Responsiveness

- Ensure all components are mobile-first
- Test and adjust sidebar navigation for mobile (Sheet component)
- Responsive tables for feed results
- Mobile-friendly chat interface
- Responsive form layouts

### 8.2 Design Polish

- Apply rounded corners and shadows per requirements
- Consistent spacing and typography
- Ensure Inter font is applied globally
- Professional color scheme
- Loading states and transitions

## Phase 9: Final Integration & Testing

### 9.1 Integration Checks

- Verify all imports and dependencies
- Test authentication flow (sign-in → main app)
- Test navigation between chatbot and feed optimizer
- Verify tRPC mock procedures are working
- Check localStorage persistence

### 9.2 File Structure Validation

- Verify monorepo structure matches TDD
- Ensure proper exports and imports
- Check TypeScript types are properly defined
- Validate all Zod schemas are in packages/shared

## Deliverables Checklist

- [ ] Complete monorepo structure (`apps/web`, `packages/shared`)
- [ ] All Zod schemas in `packages/shared`
- [ ] tRPC client setup with mock procedures
- [ ] Authentication system with localStorage
- [ ] Responsive app layout with navigation
- [ ] Health Chatbot with source citations display
- [ ] Feed Optimizer with dynamic ingredient inputs
- [ ] Client-side routing (if/else, no router library)
- [ ] Mobile-responsive design throughout
- [ ] Inter font and professional styling

### To-dos

- [ ] Create monorepo structure (apps/web, packages/shared, functions, docs) with pnpm workspace configuration
- [ ] Create packages/shared with Zod schemas (FeedIngredient, RagResponse, FeedRation, HealthRecord, Auth schemas)
- [ ] Initialize React 18 + Vite project in apps/web with TypeScript strict mode and path aliases
- [ ] Configure Tailwind CSS with Inter font and initialize shadcn/ui with required components (Card, Input, Textarea, Button, Table, Sheet, Form)
- [ ] Install all dependencies (TanStack Query, React Hook Form, Zod resolver, tRPC client libraries)
- [ ] Create tRPC client setup with mock procedures (health.askRag, nutrition.optimizeFeed) integrated with TanStack Query
- [ ] Create AuthContext with localStorage persistence, login/logout functions, and useAuth hook
- [ ] Build SignIn and SignUp components with React Hook Form + Zod validation using shadcn/ui Card and Input
- [ ] Build responsive AppLayout with sidebar navigation (Sheet for mobile, sidebar for desktop) and user header
- [ ] Create App.tsx with simple if/else routing logic (no router library) for sign-in, chatbot, feed-optimizer routes
- [ ] Create ChatInterface and MessageBubble components with chat history, loading states, and source citations display
- [ ] Build Chatbot page with React Hook Form input, tRPC mutation integration, and RagResponse display with sources and confidence
- [ ] Create TargetAnimalSelect, IngredientForm, and IngredientList components with useFieldArray for dynamic ingredients
- [ ] Build FeedOptimizer page with React Hook Form + Zod validation and tRPC mutation integration
- [ ] Build FeedResults component with shadcn/ui Table showing ration percentages and total cost
- [ ] Create main.tsx with React 18 createRoot, TanStack Query Provider, tRPC Provider, and AuthContext Provider
- [ ] Apply Inter font globally, ensure mobile responsiveness, add rounded corners/shadows, and polish all components