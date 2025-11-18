# Quick Start Guide

Get your AI Companion Coach Swarm up and running in 5 minutes.

## Prerequisites

- Node.js 20+
- Docker Desktop (for PostgreSQL)
- An Anthropic API key ([Get one here](https://console.anthropic.com/))

## Setup Steps

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment

```bash
cp .env.example .env
```

Edit `.env` and add your Anthropic API key:
```bash
ANTHROPIC_API_KEY=sk-ant-api03-your-actual-key-here
```

### 3. Start Database

```bash
make db-up
# or: docker-compose -f docker-compose.dev.yml up -d
```

Wait a few seconds for PostgreSQL to be ready.

### 4. Setup Database Schema

```bash
npm run db:push
npm run db:seed
```

This creates the database tables and seeds 5 coach personas plus a demo user.

### 5. Start the Server

```bash
npm run dev
```

You should see:
```
🚀 Server ready at http://0.0.0.0:3000
📊 Health check: http://0.0.0.0:3000/health
```

## Try It Out

### Option 1: Use the Example Script

```bash
chmod +x examples/api-usage.sh
./examples/api-usage.sh
```

This will:
1. Check server health
2. List available coaches
3. Start a coaching session
4. Send messages
5. End the session and generate a summary

### Option 2: Manual API Calls

#### 1. Check Health
```bash
curl http://localhost:3000/health
```

#### 2. List Available Coaches
```bash
curl http://localhost:3000/api/coaches | jq
```

#### 3. Get Demo Member
```bash
curl http://localhost:3000/api/members/email/demo@example.com | jq
# Note the "id" field - you'll need this
```

#### 4. Start a Session
```bash
curl -X POST http://localhost:3000/api/sessions/start \
  -H "Content-Type: application/json" \
  -d '{
    "memberId": "YOUR_MEMBER_ID",
    "coachPersonaId": "YOUR_COACH_ID"
  }' | jq

# Note the "sessionId" from the response
```

#### 5. Send a Message
```bash
curl -X POST http://localhost:3000/api/sessions/YOUR_SESSION_ID/message \
  -H "Content-Type: application/json" \
  -d '{
    "message": "I want to work on my career goals this year."
  }' | jq
```

#### 6. End Session and Get Summary
```bash
curl -X POST http://localhost:3000/api/sessions/YOUR_SESSION_ID/end | jq
```

## What's Available

### Coach Personas (Pre-seeded)

1. **Empathetic Supporter** - Warm, emotionally supportive
2. **Strategic Challenger** - Direct, results-oriented
3. **Mindful Guide** - Contemplative, reflective
4. **Pragmatic Mentor** - Practical, framework-driven
5. **Creative Catalyst** - Innovative, exploratory

### Demo Account

- Email: `demo@example.com`
- Name: Demo User
- Assigned Coaches: Empathetic Supporter, Strategic Challenger

## Development Tools

```bash
# Run tests
npm test

# Format code
npm run format

# View database in browser
npm run db:studio
# Opens at http://localhost:5555

# View all available Make commands
make help
```

## Troubleshooting

### Database Connection Error

Make sure PostgreSQL is running:
```bash
docker ps | grep coach-swarm-db
```

If not running:
```bash
make db-up
```

### Environment Variables Missing

Check your configuration:
```bash
tsx scripts/check-env.ts
```

### Port Already in Use

Change the port in `.env`:
```bash
PORT=3001
```

## Next Steps

- Read the full [README.md](./README.md) for detailed documentation
- Explore the [API Reference](./README.md#-api-reference)
- Check out the [project structure](./README.md#-project-structure)
- Review the [coach personas](./README.md#-coach-personas)

## Useful Commands

```bash
make setup           # One-command setup
make dev             # Start dev server
make test            # Run tests
make db-studio       # Open database GUI
make db-reset        # Reset database (⚠️ destroys data)
make docker-up       # Start with Docker (production mode)
```

---

**Need help?** Check the [README.md](./README.md) or open an issue on GitHub.
