# ADR-0007: Repository Pattern for Data Access

## Status
Accepted

## Context
We need to abstract data access logic to:
- Decouple business logic from data storage implementation
- Enable easier testing with mock repositories
- Allow switching data sources (Firestore, REST API, etc.) without changing business logic
- Provide a consistent interface for data operations

## Decision
We will implement the Repository Pattern with the following structure:

### Repository Interface Pattern

```typescript
// Repository interface (domain layer)
interface IRepository<T> {
  findById(id: string): Promise<T | null>;
  findAll(userId: string): Promise<T[]>;
  create(data: Omit<T, 'id'>): Promise<T>;
  update(id: string, data: Partial<T>): Promise<T>;
  delete(id: string): Promise<void>;
}

// Repository implementation (infrastructure layer)
class FirestoreRepository<T> implements IRepository<T> {
  // Firestore-specific implementation
}
```

### Repository Organization

```
domains/{domain}/
├── repositories/
│   ├── interfaces/     # Repository interfaces
│   │   └── I{Entity}Repository.ts
│   └── implementations/
│       └── Firestore{Entity}Repository.ts
```

### Rationale

1. **Abstraction**: Business logic doesn't depend on Firestore directly
2. **Testability**: Easy to create mock repositories for testing
3. **Flexibility**: Can swap implementations (e.g., REST API, GraphQL)
4. **Consistency**: Uniform interface across all data access operations
5. **Single Responsibility**: Repositories only handle data access

## Consequences

### Positive
- Business logic is decoupled from data storage
- Easy to test with mock repositories
- Can change data source without affecting business logic
- Clear separation between domain and infrastructure

### Negative
- More abstraction layers
- Slight performance overhead (negligible)
- More files to maintain

## Alternatives Considered

1. **Direct Firestore calls**: Rejected - too tightly coupled
2. **Active Record pattern**: Rejected - doesn't fit our use case
3. **Data Mapper pattern**: Considered but Repository is simpler for our needs

