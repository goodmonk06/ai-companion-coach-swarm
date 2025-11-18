# AI Companion Coach Swarm

メンバーごとにパーソナルAIコーチを割り当てる「コーチ群」基盤。日々の振り返りや目標フォローを自動化。

A personal AI coaching platform that enables members to have coaching conversations with multiple AI companions, each with distinct coaching styles and personalities. Designed for daily reflection, goal tracking, and personal development with persistent, structured data.

## 🌟 Overview

The AI Companion Coach Swarm is a **production-ready, event-driven coaching platform** that provides:

- **Multiple Coach Personas**: 5 distinct coaching archetypes (Empathetic Supporter, Strategic Challenger, Mindful Guide, Pragmatic Mentor, Creative Catalyst)
- **Session Management**: Full coaching conversations with AI-generated summaries and action items
- **Goal Tracking**: Create trackable goals with milestones, progress monitoring, and insights
- **Session Templates**: Reusable guided coaching flows for common scenarios
- **Quick Reflections**: Standalone reflections with mood tracking and tagging
- **Analytics & Insights**: Member analytics, activity trends, and goal completion rates
- **Flexible Tagging**: Tag system for organizing sessions, goals, and reflections
- **Event-Driven Architecture**: Extensible event system for integrations
- **Adapter Pattern**: Plugin points for notifications, metrics, storage, and more

## ⚠️ Important Usage Notes

This is a **companion tool** designed to supplement, not replace, human coaching or therapy:

- **Not a replacement** for professional therapy or medical advice
- **Bounded usage**: Best for daily reflection, goal setting, and accountability
- **Data privacy**: All conversations are stored locally in your database
- **Safe exploration**: Encourages self-reflection in a structured, non-judgmental space

## 🏗️ Architecture

### Tech Stack

- **Backend**: Node.js + Fastify + TypeScript
- **Database**: PostgreSQL + Prisma ORM
- **LLM**: Anthropic Claude (for coaching dialogue)
- **Infrastructure**: Error handling, logging, metrics, events
- **Testing**: Vitest
- **Container**: Docker + Docker Compose

### Domain Model

```
Member (User)
  ├── MemberPreferences (1:1)
  ├── MemberCoachAssignment (Many-to-Many) → CoachPersona
  ├── CoachingSession (1:N)
  │   ├── SessionTemplate (optional)
  │   └── SessionTag (via Tag)
  ├── CoachingGoal (1:N)
  │   ├── CoachPersona (optional)
  │   ├── Milestones (JSON)
  │   └── GoalTag (via Tag)
  └── Reflection (1:N)
      └── ReflectionTag (via Tag)
```

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for detailed architecture documentation.

## 🚀 Quick Start

### Prerequisites

- Node.js 20+
- Docker & Docker Compose (for PostgreSQL)
- Anthropic API key ([Get one here](https://console.anthropic.com/))

### Setup

1. **Clone and install dependencies**
   ```bash
   git clone <repository-url>
   cd ai-companion-coach-swarm
   npm install
   ```

2. **Configure environment**
   ```bash
   cp .env.example .env
   # Edit .env and add your ANTHROPIC_API_KEY
   ```

3. **Start PostgreSQL**
   ```bash
   make db-up
   # or: docker-compose -f docker-compose.dev.yml up -d
   ```

4. **Run migrations and seed data**
   ```bash
   npm run db:migrate
   npm run db:seed
   ```

5. **Start development server**
   ```bash
   npm run dev
   # Server starts at http://localhost:3000
   ```

### Using Make (Recommended)

```bash
make setup        # Complete setup (install, db, migrate, seed)
make dev          # Start development server
make test         # Run tests
make db-studio    # Open Prisma Studio (DB GUI)
```

## 📚 API Reference

### Core Endpoints

#### Sessions
- `POST /api/sessions/start` - Start coaching session
- `POST /api/sessions/:id/message` - Send message
- `POST /api/sessions/:id/end` - End session with summary
- `GET /api/sessions/:id` - Get session details
- `GET /api/sessions/member/:memberId` - Get member sessions

#### Goals
- `POST /api/goals` - Create goal
- `GET /api/goals/member/:memberId` - List member goals
- `GET /api/goals/:id` - Get goal details
- `PATCH /api/goals/:id` - Update goal
- `POST /api/goals/:id/progress` - Update progress
- `POST /api/goals/:id/milestones` - Add milestone
- `POST /api/goals/:id/milestones/:milestoneId/complete` - Complete milestone
- `GET /api/goals/:id/insights` - Get goal insights
- `DELETE /api/goals/:id` - Delete goal

#### Templates
- `POST /api/templates` - Create template
- `GET /api/templates` - List all templates
- `GET /api/templates/:id` - Get template details

#### Reflections
- `POST /api/reflections` - Create reflection
- `GET /api/reflections/member/:memberId` - List member reflections
- `GET /api/reflections/:id` - Get reflection
- `PATCH /api/reflections/:id` - Update reflection
- `DELETE /api/reflections/:id` - Delete reflection

#### Tags
- `POST /api/tags` - Create tag
- `GET /api/tags` - List all tags
- `POST /api/tags/tag-entity` - Tag an entity

#### Analytics
- `GET /api/analytics/member/:memberId` - Get member analytics

#### Coaches
- `GET /api/coaches` - List all coaches
- `GET /api/coaches/:id` - Get coach details
- `GET /api/coaches/member/:memberId` - Get member's coaches
- `POST /api/coaches/assign` - Assign coach to member
- `DELETE /api/coaches/assign` - Unassign coach from member

#### Members
- `POST /api/members` - Create member
- `GET /api/members` - List all members
- `GET /api/members/:id` - Get member details
- `GET /api/members/email/:email` - Get member by email
- `PATCH /api/members/:id` - Update member
- `DELETE /api/members/:id` - Delete member

## 🎭 Coach Personas

The system includes 5 diverse coaching styles:

1. **Empathetic Supporter** 💙
   - Warm, validating, emotionally supportive
   - Best for: Processing emotions, building confidence, work-life balance
   - Specialties: emotional-support, confidence-building

2. **Strategic Challenger** 🎯
   - Direct, results-oriented, thought-provoking
   - Best for: Career advancement, breaking plateaus, strategic decisions
   - Specialties: career-advancement, goal-setting, decision-making

3. **Mindful Guide** 🧘
   - Contemplative, awareness-focused, reflective
   - Best for: Stress management, self-awareness, mindfulness
   - Specialties: stress-management, self-awareness, mindfulness

4. **Pragmatic Mentor** 📊
   - Practical, framework-driven, skill-focused
   - Best for: Learning skills, productivity, time management
   - Specialties: productivity, time-management, skill-building

5. **Creative Catalyst** 🎨
   - Energetic, innovative, exploratory
   - Best for: Innovation, creative blocks, problem-solving
   - Specialties: innovation, creative-thinking, problem-solving

## 🎯 Key Features

### Goal Tracking

Track goals with milestones, progress monitoring, and intelligent insights:

```json
{
  "title": "Become a Tech Lead within 12 months",
  "status": "ACTIVE",
  "priority": "HIGH",
  "progress": 35,
  "milestones": [
    { "title": "Complete leadership training", "completed": true },
    { "title": "Mentor 2 junior developers", "completed": false },
    { "title": "Present at tech conference", "completed": false }
  ]
}
```

Goal insights provide:
- Days since creation
- Days to target
- Progress rate
- Estimated completion date
- Related sessions count

### Session Templates

Pre-built templates for common scenarios:

- **Career Goal Setting** (45 min, intermediate)
- **Stress Management & Mindfulness** (30 min, beginner)
- **Weekly Reflection & Planning** (20 min, beginner)

Each template includes guided prompts, estimated duration, and recommended coach.

### Quick Reflections

Capture thoughts quickly with mood tracking:

```json
{
  "content": "Had a productive 1-on-1 today...",
  "mood": "motivated",
  "tags": ["grateful", "career"]
}
```

### Analytics Dashboard

Comprehensive member analytics:
- Total sessions, goals, reflections
- Goal completion rate
- Average session duration
- Most-used coach
- Recent activity trends
- Streak tracking

### Event-Driven Integration

Subscribe to domain events for custom workflows:

```typescript
eventBus.on(EventTypes.GOAL_COMPLETED, async (event) => {
  // Send celebration notification
  // Update achievements
  // Trigger rewards
});
```

20+ domain events including:
- Session events (started, ended, archived)
- Goal events (created, progress, milestone, completed)
- Reflection events (created, updated, deleted)
- Member events (created, updated, preferences)
- Tag events (created, entity tagged)

### Extension Points

Adapter interfaces for external integrations:

```typescript
// Notifications
INotificationAdapter - Email, push, SMS
IMetricsAdapter - Prometheus, DataDog
IExternalProfileAdapter - User profile sync
IStorageAdapter - S3, file storage
IAnalyticsAdapter - Segment, Mixpanel
IAIAdapter - Alternative LLM providers
```

See [docs/INTEGRATION_RECIPES.md](docs/INTEGRATION_RECIPES.md) for integration examples.

## 🧪 Testing

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Watch mode
npm run test:watch

# Type check
npm run typecheck

# Run specific test file
npx vitest src/services/__tests__/session.service.test.ts
```

## 🐳 Docker Deployment

### Development
```bash
make db-up         # Start PostgreSQL only
npm run dev        # Run app locally
```

### Production
```bash
# Build and start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

## 📁 Project Structure

```
ai-companion-coach-swarm/
├── docs/
│   ├── PHASE3_OVERVIEW.md         # Phase 3 implementation summary
│   ├── ARCHITECTURE.md            # System architecture & design
│   └── INTEGRATION_RECIPES.md     # Integration examples
├── prisma/
│   ├── schema.prisma              # Database schema (11 models)
│   ├── seed.ts                    # Basic seed data
│   └── seed-enhanced.ts           # Comprehensive seed scenarios
├── src/
│   ├── config/
│   │   └── env.ts                 # Environment validation
│   ├── lib/
│   │   ├── adapters/              # Extension point interfaces
│   │   ├── errors.ts              # Custom error classes
│   │   ├── events.ts              # Domain event system
│   │   ├── logger.ts              # Structured logging
│   │   ├── metrics.ts             # Metrics collection
│   │   └── prisma.ts              # Database client
│   ├── routes/                    # API endpoints
│   │   ├── sessions.ts
│   │   ├── goals.ts
│   │   ├── templates.ts
│   │   ├── reflections.ts
│   │   ├── tags.ts
│   │   ├── analytics.ts
│   │   ├── coaches.ts
│   │   └── members.ts
│   ├── services/                  # Business logic
│   │   ├── session.service.ts
│   │   ├── goal.service.ts
│   │   ├── template.service.ts
│   │   ├── reflection.service.ts
│   │   ├── tag.service.ts
│   │   ├── analytics.service.ts
│   │   ├── llm.service.ts
│   │   ├── coach.service.ts
│   │   └── member.service.ts
│   ├── types/index.ts             # TypeScript types (40+ types)
│   ├── server.ts                  # Fastify server setup
│   └── index.ts                   # Entry point
├── Dockerfile
├── docker-compose.yml
├── docker-compose.dev.yml
├── Makefile                       # Development commands
├── package.json
├── tsconfig.json
└── README.md
```

## 🔧 Development

### Environment Variables

```bash
# Required
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/coach_swarm?schema=public"
ANTHROPIC_API_KEY="your_key_here"
PORT=3000
HOST=0.0.0.0
NODE_ENV=development

# Optional
SESSION_TIMEOUT_MINUTES=60
MAX_MESSAGE_LENGTH=5000
```

### Database Management

```bash
# Open Prisma Studio (visual DB editor)
make db-studio

# Create a new migration
npm run db:migrate

# Reset database (WARNING: destroys data)
make db-reset

# Seed with comprehensive data
npm run db:seed

# Seed with basic data
npm run db:seed:basic
```

### Code Quality

```bash
# Lint code
npm run lint

# Format code
npm run format

# Type check
npm run typecheck
```

## 🔌 Integration Examples

### Subscribing to Events

```typescript
import { eventBus, EventTypes } from './lib/events';

// Listen for goal completions
eventBus.on(EventTypes.GOAL_COMPLETED, async (event) => {
  const { goalId, memberId, title } = event.payload;
  console.log(`🎉 Goal completed: ${title}`);
  // Send notification, update UI, etc.
});
```

### Using Adapters

```typescript
import { adapterRegistry, AdapterNames } from './lib/adapters';
import { SendGridNotificationAdapter } from './adapters/sendgrid';

// Register real notification adapter
adapterRegistry.register(
  AdapterNames.NOTIFICATION,
  new SendGridNotificationAdapter()
);

// Now all notification calls will use SendGrid
```

### Metrics Tracking

```typescript
import { metrics, MetricNames } from './lib/metrics';

// Record custom metrics
metrics.incrementCounter('custom.event', 1, { type: 'important' });
metrics.recordHistogram('api.latency', durationMs, { endpoint: '/api/goals' });
metrics.setGauge('active.sessions', activeSessions);

// Get snapshot
const snapshot = metrics.getSnapshot();
```

## 📊 Demo Data

After running `npm run db:seed`, you'll have:

- **5 Members** with diverse personas and backgrounds
- **5 Coach Personas** with specialties
- **10+ Coach Assignments**
- **4 Active Goals** with milestones in various states
- **5 Reflections** with moods and tags
- **3 Session Templates** for common scenarios
- **10 Tags** across categories (goals, emotions, skills)

Demo credentials:
- Email: `demo@example.com`
- Assigned coaches: Empathetic Supporter, Strategic Challenger

## 🚀 Future Extensions

### Immediate Roadmap
- [ ] Authentication & authorization (JWT, session-based)
- [ ] Rate limiting & API security
- [ ] WebSocket support for real-time sessions
- [ ] Enhanced search (full-text across sessions, goals, reflections)
- [ ] Export functionality (PDF, Markdown, JSON)
- [ ] Scheduled sessions & reminders
- [ ] Coach customization per member

### Long-term Vision
- [ ] Mobile app (React Native)
- [ ] Voice/audio coaching sessions
- [ ] Group coaching capabilities
- [ ] Advanced analytics with ML insights
- [ ] Integration with wearables for wellness data
- [ ] Gamification & achievement system
- [ ] Peer coaching & community features
- [ ] Multi-language support
- [ ] White-label deployments

## 🤝 Contributing

This is a bounded personal coaching tool. When contributing:

1. Maintain the focus on **safe, structured reflection**
2. Don't position coaches as authority figures or therapists
3. Keep coaching styles distinct and well-documented
4. Ensure all data is stored persistently and securely
5. Write tests for new features
6. Update documentation for new capabilities

## 📄 License

MIT License - See LICENSE file for details

## 🙏 Acknowledgments

- Powered by [Anthropic Claude](https://www.anthropic.com/) for thoughtful, nuanced coaching dialogue
- Built with [Fastify](https://www.fastify.io/) for high-performance APIs
- Structured data with [Prisma](https://www.prisma.io/)

---

**Remember**: This is a companion tool for personal growth, not a replacement for professional coaching or therapy. Use it to structure your reflections, track your progress, and explore your thoughts in a safe, supportive environment.

**Questions?** See [QUICKSTART.md](./QUICKSTART.md) for a quick start guide, or check out the comprehensive documentation in the `docs/` folder.
