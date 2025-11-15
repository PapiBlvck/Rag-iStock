# ADR-0008: Service Layer Architecture

## Status
Accepted

## Context
We need a clear separation between:
- Presentation layer (React components)
- Business logic layer
- Data access layer (repositories)

This separation ensures business rules are centralized and reusable across different presentation layers.

## Decision
We will implement a Service Layer pattern with the following structure:

### Service Layer Structure

```
domains/{domain}/
├── services/
│   ├── interfaces/     # Service interfaces
│   │   └── I{Entity}Service.ts
│   └── implementations/
│       └── {Entity}Service.ts
```

### Service Responsibilities

Services handle:
- Business logic and validation
- Orchestrating multiple repository calls
- Domain-specific calculations
- Error handling and transformation
- Transaction management (if needed)

### Service Interface Pattern

```typescript
interface IHealthService {
  askQuestion(query: string, userId: string): Promise<HealthResponse>;
  getChatHistory(userId: string): Promise<ChatHistory[]>;
  saveChat(chat: ChatData, userId: string): Promise<string>;
}
```

### Rationale

1. **Separation of Concerns**: Components focus on UI, services handle business logic
2. **Reusability**: Services can be used by different components or APIs
3. **Testability**: Business logic can be tested independently
4. **Maintainability**: Changes to business rules are centralized
5. **Single Responsibility**: Each service has a clear, focused purpose

## Consequences

### Positive
- Clear separation between UI and business logic
- Business rules are centralized and reusable
- Easier to test business logic
- Components remain simple and focused

### Negative
- Additional layer of abstraction
- More files to maintain
- Need to be disciplined about keeping logic in services

## Alternatives Considered

1. **Logic in components**: Rejected - violates separation of concerns
2. **Logic in repositories**: Rejected - repositories should only handle data access
3. **Use cases pattern**: Considered but service layer is simpler for our needs

