# AI Companion Coach Swarm

メンバーごとにパーソナルAIコーチを割り当てる「コーチ群」基盤。日々の振り返りや目標フォローを自動化。

A personal AI coaching platform that enables members to have coaching conversations with multiple AI companions, each with distinct coaching styles and personalities. Designed for daily reflection, goal tracking, and personal development.

## 🌟 Overview

The AI Companion Coach Swarm is a bounded, safe tool for personal growth and reflection. It provides:

- **Multiple Coach Personas**: Each with unique coaching styles (empathetic, strategic, mindful, pragmatic, creative)
- **Session Management**: Start, engage in, and end coaching sessions with persistent conversation history
- **AI-Powered Dialogue**: Contextual coaching responses using Claude (Anthropic)
- **Automatic Summarization**: Session summaries and actionable insights generated at session end
- **Structured Data**: All conversations, summaries, and action items stored in PostgreSQL

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
- **Testing**: Vitest
- **Container**: Docker + Docker Compose

### Domain Model

```
Member (User)
  ├── MemberCoachAssignment (Many-to-Many)
  │   └── CoachPersona (Coach archetype)
  └── CoachingSession (Conversation)
      ├── transcriptJson (Message history)
      ├── summaryMarkdown (AI-generated summary)
      └── actionItemsJson (Extracted action items)
```

### Key Entities

- **Member**: A user of the coaching system
- **CoachPersona**: A distinct coaching style/archetype (empathetic, strategic, etc.)
- **MemberCoachAssignment**: Links members to their assigned coaches
- **CoachingSession**: A single coaching conversation with full transcript and summary

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

### Sessions

#### Start a Session
```http
POST /api/sessions/start
Content-Type: application/json

{
  "memberId": "uuid",
  "coachPersonaId": "uuid"
}

Response:
{
  "sessionId": "uuid",
  "coachName": "Empathetic Supporter",
  "message": "Welcome! How can I support you today?"
}
```

#### Send a Message
```http
POST /api/sessions/:id/message
Content-Type: application/json

{
  "message": "I'm feeling stuck on my career goals..."
}

Response:
{
  "response": "I hear that you're feeling stuck...",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

#### End a Session
```http
POST /api/sessions/:id/end

Response:
{
  "summary": "In this session, we explored...",
  "actionItems": [
    {
      "title": "Define one career goal",
      "description": "Write down a specific, measurable goal",
      "priority": "high"
    }
  ],
  "sessionDurationMinutes": 15
}
```

#### Get Session Details
```http
GET /api/sessions/:id

Response:
{
  "id": "uuid",
  "memberId": "uuid",
  "coachPersonaId": "uuid",
  "startedAt": "2024-01-15T10:00:00Z",
  "endedAt": "2024-01-15T10:15:00Z",
  "transcript": [...],
  "summaryMarkdown": "...",
  "actionItems": [...]
}
```

### Coaches

#### List All Coaches
```http
GET /api/coaches

Response:
[
  {
    "id": "uuid",
    "key": "empathetic-supporter",
    "name": "Empathetic Supporter",
    "styleDescriptionMarkdown": "...",
    "configJson": {...}
  }
]
```

#### Assign Coach to Member
```http
POST /api/coaches/assign
Content-Type: application/json

{
  "memberId": "uuid",
  "coachPersonaId": "uuid"
}
```

### Members

#### Create Member
```http
POST /api/members
Content-Type: application/json

{
  "email": "user@example.com",
  "name": "Jane Doe"
}
```

#### Get Member
```http
GET /api/members/:id
```

## 🎭 Coach Personas

The system includes 5 diverse coaching styles:

1. **Empathetic Supporter**
   - Warm, validating, emotionally supportive
   - Best for: Processing emotions, building confidence

2. **Strategic Challenger**
   - Direct, results-oriented, thought-provoking
   - Best for: Career advancement, breaking plateaus

3. **Mindful Guide**
   - Contemplative, awareness-focused, reflective
   - Best for: Stress management, self-awareness

4. **Pragmatic Mentor**
   - Practical, framework-driven, skill-focused
   - Best for: Learning skills, productivity

5. **Creative Catalyst**
   - Energetic, innovative, exploratory
   - Best for: Innovation, creative blocks

## 🧪 Testing

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

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
├── prisma/
│   ├── schema.prisma      # Database schema
│   └── seed.ts            # Seed data script
├── src/
│   ├── config/
│   │   └── env.ts         # Environment validation
│   ├── lib/
│   │   └── prisma.ts      # Prisma client
│   ├── routes/
│   │   ├── sessions.ts    # Session endpoints
│   │   ├── coaches.ts     # Coach endpoints
│   │   └── members.ts     # Member endpoints
│   ├── services/
│   │   ├── llm.service.ts      # AI/LLM integration
│   │   ├── session.service.ts  # Session logic
│   │   ├── coach.service.ts    # Coach logic
│   │   └── member.service.ts   # Member logic
│   ├── types/
│   │   └── index.ts       # TypeScript types
│   ├── server.ts          # Fastify server setup
│   └── index.ts           # Entry point
├── scripts/
│   ├── check-env.ts       # Environment checker
│   └── init-migration.sh  # Migration helper
├── docker-compose.yml     # Production Docker setup
├── docker-compose.dev.yml # Development Docker setup
├── Dockerfile             # Application container
├── Makefile               # Development commands
└── package.json
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

# Seed with initial data
make db-seed
```

### Code Quality

```bash
# Lint code
npm run lint

# Format code
npm run format

# Type check
npx tsc --noEmit
```

## 🤝 Contributing

This is a bounded personal coaching tool. When contributing:

1. Maintain the focus on **safe, structured reflection**
2. Don't position coaches as authority figures or therapists
3. Keep coaching styles distinct and well-documented
4. Ensure all data is stored persistently and securely
5. Write tests for new features

## 📄 License

MIT License - See LICENSE file for details

## 🙏 Acknowledgments

- Powered by [Anthropic Claude](https://www.anthropic.com/) for thoughtful, nuanced coaching dialogue
- Built with [Fastify](https://www.fastify.io/) for high-performance APIs
- Structured data with [Prisma](https://www.prisma.io/)

---

**Remember**: This is a companion tool for personal growth, not a replacement for professional coaching or therapy. Use it to structure your reflections, track your progress, and explore your thoughts in a safe, supportive environment.
