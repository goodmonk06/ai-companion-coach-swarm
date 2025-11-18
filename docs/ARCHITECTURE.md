# Architecture Overview

## System Design

The AI Companion Coach Swarm is built as a modular, event-driven system with clear separation of concerns.

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Client Layer                              │
│  (API Consumers: Web UI, Mobile App, CLI, External Services)    │
└──────────────────┬──────────────────────────────────────────────┘
                   │
┌──────────────────▼──────────────────────────────────────────────┐
│                     API Layer (Fastify)                          │
│  ┌──────────┐ ┌──────────┐ ┌─────────┐ ┌───────────┐          │
│  │ Sessions │ │  Goals   │ │ Coaches │ │Analytics  │          │
│  │  Routes  │ │  Routes  │ │ Routes  │ │  Routes   │   ...    │
│  └─────┬────┘ └────┬─────┘ └────┬────┘ └─────┬─────┘          │
└────────┼───────────┼────────────┼─────────────┼────────────────┘
         │           │            │             │
┌────────▼───────────▼────────────▼─────────────▼────────────────┐
│                    Service Layer                                 │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐           │
│  │   Session    │ │     Goal     │ │     LLM      │           │
│  │   Service    │ │   Service    │ │   Service    │   ...     │
│  └──────┬───────┘ └──────┬───────┘ └──────┬───────┘           │
└─────────┼──────────────────┼──────────────┼─────────────────────┘
          │                  │              │
┌─────────▼──────────────────▼──────────────▼─────────────────────┐
│                Infrastructure Layer                               │
│  ┌─────────┐ ┌─────────┐ ┌──────────┐ ┌────────────┐          │
│  │ Events  │ │ Metrics │ │  Logger  │ │   Errors   │          │
│  └────┬────┘ └────┬────┘ └────┬─────┘ └─────┬──────┘          │
└───────┼───────────┼───────────┼──────────────┼──────────────────┘
        │           │           │              │
┌───────▼───────────▼───────────▼──────────────▼──────────────────┐
│                  Integration Layer                                │
│  ┌────────────┐ ┌────────────┐ ┌────────────┐                  │
│  │ Adapters   │ │  External  │ │  Database  │                  │
│  │ (No-op)    │ │  Services  │ │  (Prisma)  │                  │
│  └────────────┘ └────────────┘ └─────┬──────┘                  │
└────────────────────────────────────────┼──────────────────────────┘
                                        │
                             ┌──────────▼──────────┐
                             │   PostgreSQL DB     │
                             └─────────────────────┘
```

## Core Components

### 1. API Layer (Routes)

**Location**: `src/routes/`

Fastify route handlers that:
- Validate incoming requests using Zod schemas
- Call appropriate service methods
- Format and return responses
- Handle errors with consistent error responses

**Key Routes**:
- `/api/sessions` - Coaching session management
- `/api/goals` - Goal tracking and progress
- `/api/templates` - Session templates
- `/api/reflections` - Quick reflections
- `/api/coaches` - Coach persona management
- `/api/members` - Member management
- `/api/tags` - Tagging system
- `/api/analytics` - Analytics and insights

### 2. Service Layer

**Location**: `src/services/`

Business logic layer containing:

- **SessionService**: Session lifecycle, message handling, summarization
- **GoalService**: Goal CRUD, progress tracking, milestones
- **TemplateService**: Template management and usage
- **ReflectionService**: Reflection creation and search
- **LLMService**: AI/LLM integration (Anthropic Claude)
- **CoachService**: Coach assignment and management
- **MemberService**: Member CRUD operations
- **TagService**: Tagging operations
- **AnalyticsService**: Analytics aggregation

**Service Responsibilities**:
- Implement core business logic
- Orchestrate database operations
- Emit domain events
- Record metrics
- Handle errors with custom error types

### 3. Infrastructure Layer

**Location**: `src/lib/`

Cross-cutting concerns:

#### Error Handling (`errors.ts`)
- Custom error classes (NotFoundError, ValidationError, etc.)
- Consistent error formatting
- Error categorization (operational vs programming errors)

#### Logging (`logger.ts`)
- Structured logging with context
- Log levels (debug, info, warn, error)
- Child loggers for request scoping

#### Metrics (`metrics.ts`)
- Counter, histogram, and gauge metrics
- In-memory metric storage
- Extension points for external systems

#### Events (`events.ts`)
- Domain event system
- Event bus for publish-subscribe
- Typed event payloads
- Event handlers for side effects

### 4. Integration Layer

**Location**: `src/lib/adapters/`

Extension points for external integrations:

- `INotificationAdapter` - Email, push, SMS notifications
- `IMetricsAdapter` - External metrics (Prometheus, DataDog)
- `IExternalProfileAdapter` - User profile syncing
- `IStorageAdapter` - File storage (S3, local)
- `IAnalyticsAdapter` - Analytics platforms
- `IAIAdapter` - Alternative LLM providers

**Default Implementations**:
- No-op adapters for development
- In-memory implementations for testing

## Data Flow

### Example: Starting a Coaching Session

```
1. Client Request
   POST /api/sessions/start
   { memberId, coachPersonaId }
   
2. Route Handler (sessions.ts)
   - Validates request with Zod
   - Calls sessionService.startSession()
   
3. Service Layer (session.service.ts)
   - Verifies member and coach exist
   - Checks coach assignment
   - Creates session in database
   - Generates AI greeting
   - Emits SESSION_STARTED event
   - Records metrics
   - Returns session data
   
4. Event System
   - SESSION_STARTED event triggers:
     * Analytics tracking
     * Notification (if adapter configured)
     * Audit logging
     
5. Response
   - Returns { sessionId, coachName, greeting }
```

## Database Design

**ORM**: Prisma

**Key Entities**:

```
Member (User)
  ├─ MemberPreferences (1:1)
  ├─ MemberCoachAssignment (1:N) ──→ CoachPersona
  ├─ CoachingSession (1:N)
  ├─ CoachingGoal (1:N)
  └─ Reflection (1:N)

CoachingSession
  ├─ Member (N:1)
  ├─ CoachPersona (N:1)
  ├─ SessionTemplate (N:1, optional)
  └─ SessionTag (N:N via Tag)

CoachingGoal
  ├─ Member (N:1)
  ├─ CoachPersona (N:1, optional)
  └─ GoalTag (N:N via Tag)

Reflection
  ├─ Member (N:1)
  └─ ReflectionTag (N:N via Tag)
```

## Event-Driven Architecture

### Domain Events

Events are emitted for significant domain activities:

**Session Events**:
- `SESSION_STARTED` - New session created
- `SESSION_MESSAGE_SENT` - User sends message
- `SESSION_MESSAGE_RECEIVED` - AI responds
- `SESSION_ENDED` - Session completed with summary
- `SESSION_ARCHIVED` - Session archived

**Goal Events**:
- `GOAL_CREATED` - New goal created
- `GOAL_PROGRESS_UPDATED` - Progress updated
- `GOAL_MILESTONE_REACHED` - Milestone completed
- `GOAL_COMPLETED` - Goal completed

**Other Events**:
- `REFLECTION_CREATED`
- `TEMPLATE_USED`
- `MEMBER_CREATED`
- `ENTITY_TAGGED`

### Event Handlers

Event handlers can be registered to:
- Send notifications
- Update analytics
- Trigger workflows
- Sync with external systems

Example:
```typescript
eventBus.on(EventTypes.GOAL_COMPLETED, async (event) => {
  // Send celebration notification
  // Update member achievements
  // Trigger confetti animation 🎉
});
```

## Extension Points

### 1. Adapter Pattern

Replace default implementations with real integrations:

```typescript
// Register real notification adapter
adapterRegistry.register(
  AdapterNames.NOTIFICATION,
  new SendGridNotificationAdapter()
);

// Register metrics adapter
adapterRegistry.register(
  AdapterNames.METRICS,
  new PrometheusMetricsAdapter()
);
```

### 2. Event Listeners

Add custom event handlers:

```typescript
// Custom analytics
eventBus.on(EventTypes.SESSION_ENDED, async (event) => {
  await customAnalytics.trackSessionCompletion(event.payload);
});
```

### 3. Coach Persona Plugins

Extend coach behaviors with custom logic:

```typescript
// Future: Plugin system for coach behaviors
coachRegistry.registerPlugin('goal-tracker', {
  beforeMessage: async (context) => {
    // Inject goal progress into context
  },
  afterMessage: async (context, response) => {
    // Extract goal mentions
  }
});
```

## Security Considerations

1. **Input Validation**: All API inputs validated with Zod schemas
2. **SQL Injection**: Protected by Prisma parameterized queries
3. **Error Handling**: Sensitive info not exposed in error messages
4. **Rate Limiting**: TODO - Add rate limiting middleware
5. **Authentication**: TODO - Add auth middleware (JWT, session)
6. **Authorization**: TODO - Row-level security for member data

## Performance Considerations

1. **Database Indexing**: Indexes on frequently queried fields
2. **Connection Pooling**: Prisma connection pooling enabled
3. **Metrics**: Track slow queries and API response times
4. **Caching**: TODO - Add Redis for session state
5. **LLM Optimization**: Configurable temperature and token limits

## Testing Strategy

1. **Unit Tests**: Service layer logic
2. **Integration Tests**: API endpoints with test DB
3. **Test Fixtures**: Factory functions for test data
4. **Mocking**: Mock adapters for external services

## Deployment Architecture

```
┌─────────────────┐
│   Load Balancer │
└────────┬────────┘
         │
    ┌────▼────┐
    │  App 1  │
    │ (Node)  │
    └────┬────┘
         │
    ┌────▼────┐
    │  App 2  │
    │ (Node)  │
    └────┬────┘
         │
    ┌────▼──────────┐
    │  PostgreSQL   │
    │   (Primary)   │
    └───────────────┘
```

**Scalability**:
- Stateless API servers (horizontal scaling)
- Database connection pooling
- Future: Redis for session state
- Future: Message queue for async tasks

## Future Enhancements

1. **Real-time Communication**: WebSocket support for live sessions
2. **Microservices**: Split into session, goal, analytics services
3. **CQRS**: Separate read/write models for analytics
4. **Event Sourcing**: Store all events for audit trail
5. **GraphQL API**: Add GraphQL layer for flexible queries
6. **gRPC**: Internal service communication via gRPC
