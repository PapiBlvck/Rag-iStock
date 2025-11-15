# iStock Architecture Overview

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    User Interface                       │
│              (React + TypeScript SPA)                   │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐             │
│  │ Pages    │  │Components│  │ Contexts │             │
│  └──────────┘  └──────────┘  └──────────┘             │
└──────────────────┬──────────────────────────────────────┘
                   │
┌──────────────────▼──────────────────────────────────────┐
│              Domain Services Layer                      │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐             │
│  │ Health   │  │Nutrition │  │  User    │             │
│  │ Service  │  │ Service  │  │ Service  │             │
│  └────┬─────┘  └────┬──────┘  └────┬─────┘             │
│       │             │              │                    │
│       └─────────────┴──────────────┘                    │
│                   │                                      │
│  ┌────────────────▼────────────────┐                   │
│  │    Repository Interfaces        │                   │
│  └────────────────┬─────────────────┘                   │
└───────────────────┼──────────────────────────────────────┘
                    │
┌───────────────────▼──────────────────────────────────────┐
│         Repository Implementations                        │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐             │
│  │Firestore │  │Firestore │  │Firestore │             │
│  │Repos     │  │Repos     │  │Repos     │             │
│  └──────────┘  └──────────┘  └──────────┘             │
└───────────────────┬──────────────────────────────────────┘
                    │
┌───────────────────▼──────────────────────────────────────┐
│            tRPC Router (Cloud Functions)                  │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐             │
│  │ RAG      │  │ Feed Opt │  │ Health   │             │
│  └──────────┘  └──────────┘  └──────────┘             │
└───────────────────┬──────────────────────────────────────┘
                    │
┌───────────────────▼──────────────────────────────────────┐
│              External Services                          │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐             │
│  │ Firestore│  │  Vector  │  │   AI/LLM │             │
│  └──────────┘  └──────────┘  └──────────┘             │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│              Shared Package (@istock/shared)           │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐             │
│  │  Zod     │  │  Types   │  │ Schemas  │             │
│  │Schemas   │  │          │  │          │             │
│  └──────────┘  └──────────┘  └──────────┘             │
└─────────────────────────────────────────────────────────┘
```

## Domain-Driven Design Structure

The application follows Domain-Driven Design (DDD) principles with clear domain boundaries:

```
apps/web/src/domains/
├── health/              # Health consultation domain
│   ├── entities/        # Domain entities (ChatHistory, MessageFeedback)
│   ├── repositories/    # Repository interfaces and implementations
│   │   ├── interfaces/
│   │   └── implementations/
│   └── services/        # Business logic services
│       ├── interfaces/
│       └── implementations/
├── nutrition/           # Feed optimization domain
│   ├── entities/        # Domain entities (Ingredient, FeedOptimization)
│   ├── repositories/
│   └── services/
└── user/                # User management domain
    ├── entities/        # Domain entities (UserProfile)
    ├── repositories/
    └── services/
```

## Component Hierarchy

```
App
├── AppLayout
│   ├── SkipLinks
│   ├── Sidebar (Navigation)
│   │   ├── Navigation Items
│   │   └── User Menu
│   └── Main Content
│       ├── Dashboard
│       │   ├── StatsCard (x4)
│       │   ├── QuickActions
│       │   └── ActivityFeed
│       ├── Chatbot
│       │   ├── ChatInterface
│       │   │   └── MessageBubble (xN)
│       │   └── Chat Input Form
│       ├── FeedOptimizer
│       │   └── IngredientForm
│       ├── HealthRecords
│       ├── IngredientLibrary
│       └── Settings
├── ThemeProvider
├── AuthProvider
├── NotificationProvider
└── QueryClientProvider
```

## Architecture Layers

### Presentation Layer
- **Components**: React components for UI rendering
- **Pages**: Page-level components that compose features
- **Hooks**: Custom React hooks for component logic
- **Contexts**: Global state management (Auth, Theme, Notifications)

### Domain Layer
- **Entities**: Domain models representing business concepts
- **Services**: Business logic and orchestration
- **Repository Interfaces**: Contracts for data access

### Infrastructure Layer
- **Repository Implementations**: Firestore-specific data access
- **External Services**: tRPC, RAG API, Firebase
- **Utilities**: Helper functions and utilities

### Dependency Injection
- Services depend on repository interfaces, not implementations
- Easy to swap implementations for testing
- Clear dependency boundaries

## Data Flow

### Authentication Flow
1. User submits credentials
2. AuthContext handles login/signup
3. User state stored in localStorage
4. AppLayout shows authenticated UI
5. Protected routes rendered

### Chat Flow (with Domain Architecture)
1. User types message in component
2. Component calls HealthService.askQuestion()
3. HealthService uses IChatRepository interface
4. FirestoreChatRepository implements data access
5. Response returned through service layer
6. Component displays result
7. Chat saved via HealthService.saveChat()

### Feed Optimization Flow
1. User selects ingredients and animal type
2. Component calls NutritionService.optimizeFeed()
3. Service uses feed optimizer client
4. Result saved via NutritionService.saveFeedOptimization()
5. Uses IFeedOptimizationRepository for persistence

### State Management Flow

```
Global UI State (Context API)
├── AuthContext ────────► localStorage
├── ThemeContext ───────► localStorage
└── NotificationContext ─► In-memory

Server State (TanStack Query)
├── useAskRag ──────────► tRPC mutation
├── useOptimizeFeed ─────► tRPC mutation
└── Query Cache ────────► In-memory

Form State (React Hook Form)
├── Chatbot Form ───────► Zod validation
├── Feed Form ──────────► Zod validation
└── Local component state
```

## Package Dependencies

### apps/web
- **React 18**: UI framework
- **TypeScript**: Type safety
- **Vite**: Build tool
- **TanStack Query**: Server state
- **React Hook Form**: Form handling
- **Zod**: Validation
- **Radix UI**: Accessible components
- **Tailwind CSS**: Styling
- **@istock/shared**: Shared types and schemas

### packages/shared
- **Zod**: Schema definitions
- **TypeScript**: Type exports

## Build and Deployment

### Development
```bash
pnpm dev  # Start Vite dev server
```

### Production Build
```bash
pnpm build  # TypeScript check + Vite build
```

### Build Output
- `apps/web/dist/`: Static assets
- Code splitting: Route-based lazy loading
- Tree shaking: Unused code eliminated

## Security Considerations

1. **Authentication**: Mock currently, will integrate Firebase Auth
2. **API Security**: tRPC provides type-safe, validated endpoints
3. **XSS Protection**: React automatically escapes user input
4. **CORS**: Configured in tRPC/backend
5. **Secrets**: Environment variables via T3 Env

## Performance Optimizations

1. **Code Splitting**: React.lazy for route-based splitting
2. **Tree Shaking**: Vite eliminates unused code
3. **React Query Caching**: Reduces API calls
4. **React Hook Form**: Uncontrolled components reduce re-renders
5. **Image Optimization**: Future: next/image or similar
6. **Bundle Analysis**: Vite build reports bundle size

## Error Handling

The application uses a structured error handling approach:

- **Domain Errors**: Custom error classes (NotFoundError, ValidationError, etc.)
- **Error Propagation**: Errors flow from repositories → services → components
- **User-Friendly Messages**: Errors are transformed to user-friendly messages at the UI layer
- **Error Boundaries**: React Error Boundaries catch component-level errors

See [ADR-0009: Error Handling Strategy](./adr/0009-error-handling-strategy.md) for details.

## Dependency Management

- **Dependency Injection Container**: Simple DI container for service registration
- **Interface-Based Design**: Services depend on interfaces, not concrete implementations
- **Testability**: Easy to inject mocks for testing

See [ADR-0010: Dependency Injection Pattern](./adr/0010-dependency-injection.md) for details.

## Future Enhancements

1. **Server-Side Rendering**: Consider Next.js if needed
2. **PWA Support**: Service workers for offline capability
3. **Testing**: Add Vitest for unit tests, Playwright for E2E
4. **Storybook**: Component documentation and testing
5. **Monitoring**: Add error tracking (Sentry)
6. **Analytics**: User behavior tracking
7. **Caching Layer**: Add caching for frequently accessed data
8. **Event Sourcing**: Consider event sourcing for audit trails

